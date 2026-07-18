/**
 * Fuel prices (Tankerkönig access layer over official MTS-K data).
 *
 * Gated on TANKERKOENIG_API_KEY (free registration). Prices are notified by
 * station operators to the Markttransparenzstelle — labelled as such; small
 * delays and notification errors are possible and stated. Fair use: the
 * provider caps polling at one request per 5 minutes per location (cache TTL).
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type FuelContext,
  type FuelStation,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const SEARCH_RADIUS_KM = 5;
const MAX_STATIONS = 6;

const StationSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  dist: z.number().optional(),
  isOpen: z.boolean().nullable().optional(),
  e5: z
    .union([z.number(), z.literal(false)])
    .nullable()
    .optional(),
  e10: z
    .union([z.number(), z.literal(false)])
    .nullable()
    .optional(),
  diesel: z
    .union([z.number(), z.literal(false)])
    .nullable()
    .optional(),
});

const ListResponse = z.object({
  ok: z.boolean(),
  stations: z.array(StationSchema).optional(),
  message: z.string().optional(),
});

function price(v: number | false | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export async function getFuelContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<FuelContext>> {
  const provider = getEffectiveProvider('tankerkoenig-mtsk', ctx.config);
  if (provider.status !== 'verified' || !ctx.config.tankerkoenigApiKey) {
    return {
      status: 'configuration-required',
      demo: false,
      data: null,
      evidence: [],
      limitations: provider.knownLimitations,
      statusDetail:
        'Kraftstoffpreise sind nicht konfiguriert. Für Live-Betrieb ist ein kostenloser Tankerkönig-API-Schlüssel (TANKERKOENIG_API_KEY) erforderlich.',
      retrievedAt: new Date().toISOString(),
    };
  }

  try {
    const url =
      `${ctx.config.tankerkoenigUrl}/list.php?lat=${coords.latitude.toFixed(4)}` +
      `&lng=${coords.longitude.toFixed(4)}&rad=${SEARCH_RADIUS_KM}&sort=dist&type=all` +
      `&apikey=${encodeURIComponent(ctx.config.tankerkoenigApiKey)}`;
    const fingerprint = requestFingerprint({
      resource: 'fuel-list',
      lat: coords.latitude.toFixed(3),
      lon: coords.longitude.toFixed(3),
    });
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = ListResponse.safeParse(result.raw);
    if (!parsed.success || !parsed.data.ok || !parsed.data.stations) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Antwort der Quelle entsprach nicht dem dokumentierten Schema oder meldete einen Fehler. Es werden keine Ersatzwerte erzeugt.',
        retrievedAt: result.retrievedAt,
      };
    }

    const stations: FuelStation[] = parsed.data.stations.slice(0, MAX_STATIONS).map((s) => ({
      id: s.id,
      name: s.name ?? null,
      brand: s.brand ?? null,
      coordinates: { latitude: s.lat, longitude: s.lng },
      distanceMeters: Math.round((s.dist ?? 0) * 1000),
      isOpen: s.isOpen ?? null,
      e5: price(s.e5),
      e10: price(s.e10),
      diesel: price(s.diesel),
      mode: 'realtime' as const,
    }));

    const nearest = stations[0];
    const evidence = makeEvidence(provider, {
      mode: 'realtime',
      method:
        'Von den Betreibern an die MTS-K gemeldete Kraftstoffpreise (Tankerkönig-Zugangsschicht, Umkreisabfrage). Meldedaten — geringe Verzögerungen möglich.',
      spatial: nearest
        ? { kind: 'station', stationId: nearest.id, distanceMeters: nearest.distanceMeters }
        : { kind: 'unknown' },
      completeness: 'complete',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
    });

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: { stations, searchRadiusKm: SEARCH_RADIUS_KM },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(stations.length === 0
        ? {
            statusDetail: `Keine meldepflichtige Tankstelle im Umkreis von ${SEARCH_RADIUS_KM} km.`,
          }
        : {}),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<FuelContext>(err, provider.knownLimitations);
  }
}
