/**
 * BfS ODL network — gamma ambient dose rate (odlinfo.bfs.de open data,
 * WFS GeoJSON, no API key; license dl-de/by-2-0).
 *
 * The full "latest 1-h mean" layer (~1,700 probes) is fetched once and cached;
 * the nearest probes are selected locally. This avoids WFS bbox axis-order
 * pitfalls entirely and makes every place share one cached response.
 *
 * Reality rules: probe values are POINT observations; dose rate fluctuates
 * naturally (geology, altitude, rain washout) — an elevated single value is
 * never presented as a hazard statement.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type RadiationContext,
  type RadiationStation,
  type Coordinates,
} from '@invisible-city/contracts';
import {
  makeEvidence,
  distanceMeters,
  formatDistanceGerman,
  stationSpatialRole,
} from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const MAX_STATIONS = 3;

const Feature = z.object({
  geometry: z
    .object({ type: z.string(), coordinates: z.array(z.number()).min(2) })
    .nullable()
    .optional(),
  properties: z
    .object({
      kenn: z.string().optional(),
      name: z.string().optional(),
      value: z.number().nullable().optional(),
      unit: z.string().optional(),
      end_measure: z.string().nullable().optional(),
      site_status_text: z.string().nullable().optional(),
    })
    .passthrough(),
});

const OdlResponse = z.object({
  type: z.string(),
  features: z.array(Feature),
});

function toIsoOrNull(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function getRadiationContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<RadiationContext>> {
  const provider = getEffectiveProvider('bfs-odl', ctx.config);
  try {
    const url =
      `${ctx.config.odlUrl}?service=WFS&version=1.1.0&request=GetFeature` +
      `&typeName=opendata:odlinfo_odl_1h_latest&outputFormat=application/json`;
    // One shared fingerprint for the whole layer — every place reuses the cache.
    const fingerprint = requestFingerprint({ resource: 'odl-1h-latest' });
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = OdlResponse.safeParse(result.raw);
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

    const stations: RadiationStation[] = parsed.data.features
      .flatMap((f) => {
        const lon = f.geometry?.coordinates[0];
        const lat = f.geometry?.coordinates[1];
        if (typeof lat !== 'number' || typeof lon !== 'number') return [];
        const p = f.properties;
        if (!p.kenn && !p.name) return [];
        const stationCoords = { latitude: lat, longitude: lon };
        const station: RadiationStation = {
          stationId: p.kenn ?? p.name ?? 'unbekannt',
          name: p.name ?? p.kenn ?? 'unbekannt',
          coordinates: stationCoords,
          distanceMeters: Math.round(distanceMeters(coords, stationCoords)),
          doseRate: typeof p.value === 'number' && Number.isFinite(p.value) ? p.value : null,
          unit: p.unit ?? 'µSv/h',
          mode: 'observed',
          measuredAt: toIsoOrNull(p.end_measure),
          siteStatus: p.site_status_text ?? null,
        };
        return [station];
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, MAX_STATIONS);

    const nearest = stations[0];
    const anyValue = stations.some((s) => s.doseRate !== null);
    const role = nearest ? stationSpatialRole(nearest.distanceMeters) : 'regional';

    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method:
        'Gamma-Ortsdosisleistung (1-h-Mittelwert) des BfS-ODL-Messnetzes. Punktmessung am Sondenstandort — keine Interpolation zwischen Sonden.',
      spatial: nearest
        ? { kind: 'station', stationId: nearest.stationId, distanceMeters: nearest.distanceMeters }
        : { kind: 'unknown' },
      completeness: 'provisional',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
      ...(nearest?.measuredAt ? { observedAt: nearest.measuredAt } : {}),
      limitations:
        role === 'regional' && nearest
          ? [
              `Nächste Sonde ist ${formatDistanceGerman(nearest.distanceMeters)} entfernt — regionale Referenz, kein lokaler Wert.`,
            ]
          : [],
    });

    if (stations.length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: { stations: [] },
        evidence: [evidence],
        limitations: provider.knownLimitations,
        statusDetail: 'Keine ODL-Sonde im Datensatz gefunden.',
        retrievedAt: result.retrievedAt,
      };
    }

    return {
      status: result.stale ? 'stale' : anyValue ? 'ok' : 'partial',
      demo: false,
      data: { stations },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(anyValue
        ? {}
        : {
            statusDetail:
              'Sonden im Umkreis gefunden, aber ohne aktuell abrufbaren Messwert (z. B. Ausfall/Wartung).',
          }),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<RadiationContext>(err, provider.knownLimitations);
  }
}
