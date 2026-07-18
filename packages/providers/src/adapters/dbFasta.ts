/**
 * DB FaSta — elevator/escalator operational status at DB stations (DB API
 * Marketplace, free credentials). Gated on DB_CLIENT_ID + DB_API_KEY.
 *
 * Honesty rules: state "UNKNOWN" means "not determinable", never "working";
 * coverage is DB stations only — no statement about other operators or
 * accessibility in general.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type StationFacilityContext,
  type StationFacility,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const SEARCH_RADIUS_M = 3000;
const MAX_FACILITIES = 10;

const FacilitySchema = z.object({
  equipmentnumber: z.number(),
  type: z.string(),
  state: z.string(),
  description: z.string().nullable().optional(),
  geocoordX: z.number().optional(),
  geocoordY: z.number().optional(),
  stationnumber: z.number().nullable().optional(),
});

const FacilitiesResponse = z.array(FacilitySchema);

export async function getStationFacilityContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<StationFacilityContext>> {
  const provider = getEffectiveProvider('db-fasta', ctx.config);
  if (provider.status !== 'verified' || !ctx.config.dbClientId || !ctx.config.dbApiKey) {
    return {
      status: 'configuration-required',
      demo: false,
      data: null,
      evidence: [],
      limitations: provider.knownLimitations,
      statusDetail:
        'Bahnhofs-Aufzugsstatus ist nicht konfiguriert. Für Live-Betrieb sind kostenlose DB-API-Marketplace-Zugangsdaten (DB_CLIENT_ID, DB_API_KEY) erforderlich.',
      retrievedAt: new Date().toISOString(),
    };
  }

  try {
    // The facilities endpoint is nationwide; the shared national snapshot is
    // cached and filtered locally by distance.
    const url = `${ctx.config.dbFastaUrl}/facilities?type=ELEVATOR,ESCALATOR`;
    const fingerprint = requestFingerprint({ resource: 'fasta-facilities' });
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx, {
      headers: {
        'DB-Client-Id': ctx.config.dbClientId,
        'DB-Api-Key': ctx.config.dbApiKey,
        Accept: 'application/json',
      },
    });
    const parsed = FacilitiesResponse.safeParse(result.raw);
    if (!parsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Antwort der Quelle entsprach nicht dem dokumentierten Schema und wurde verworfen.',
        retrievedAt: result.retrievedAt,
      };
    }

    const facilities: StationFacility[] = parsed.data
      .flatMap((f) => {
        if (typeof f.geocoordX !== 'number' || typeof f.geocoordY !== 'number') return [];
        const facilityCoords = { latitude: f.geocoordY, longitude: f.geocoordX };
        const facility: StationFacility = {
          id: String(f.equipmentnumber),
          type: f.type,
          state: f.state,
          description: f.description ?? null,
          coordinates: facilityCoords,
          distanceMeters: Math.round(distanceMeters(coords, facilityCoords)),
          stationNumber: f.stationnumber ?? null,
          mode: 'realtime',
        };
        return [facility];
      })
      .filter((f) => f.distanceMeters <= SEARCH_RADIUS_M)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, MAX_FACILITIES);

    const nearest = facilities[0];
    const evidence = makeEvidence(provider, {
      mode: 'realtime',
      method:
        'Betriebszustand von Aufzügen/Fahrtreppen an DB-Stationen (FaSta, DB API Marketplace), landesweiter Datensatz lokal nach Entfernung gefiltert. „UNKNOWN“ = nicht ermittelbar, nicht „funktioniert“.',
      spatial: nearest
        ? { kind: 'station', stationId: nearest.id, distanceMeters: nearest.distanceMeters }
        : { kind: 'unknown' },
      completeness: 'partial',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
    });

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: { facilities, searchRadiusMeters: SEARCH_RADIUS_M },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(facilities.length === 0
        ? {
            statusDetail:
              'Keine DB-Aufzüge/Fahrtreppen im Umkreis von 3 km im Datensatz — keine Aussage über andere Betreiber.',
          }
        : {}),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<StationFacilityContext>(err, provider.knownLimitations);
  }
}
