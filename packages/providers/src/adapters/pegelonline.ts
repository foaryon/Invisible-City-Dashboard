/**
 * PEGELONLINE water levels (WSV REST API v2, JSON, no API key).
 *
 * Gauge readings are POINT observations at the gauge on its waterway:
 * no interpolation, no transfer to other waters, no flood-warning claim
 * (official flood warnings are issued by the Länder Hochwasserzentralen).
 * Coverage is federal waterways only — a missing gauge never means
 * "no water nearby".
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type WaterLevelContext,
  type WaterStation,
  type WaterReading,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters, formatDistanceGerman } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const SEARCH_RADIUS_KM = 30;
const MAX_STATIONS = 3;

const CurrentMeasurement = z.object({
  timestamp: z.string(),
  value: z.number().nullable().optional(),
  stateMnwMhw: z.string().optional(),
});

const Timeseries = z.object({
  shortname: z.string(),
  longname: z.string().optional(),
  unit: z.string(),
  currentMeasurement: CurrentMeasurement.optional(),
});

const Station = z.object({
  uuid: z.string(),
  longname: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  water: z.object({ longname: z.string().optional(), shortname: z.string().optional() }).optional(),
  timeseries: z.array(Timeseries).optional(),
});

const StationsResponse = z.array(Station);

function toIsoOrNull(raw: string): string | null {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function getWaterLevelContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<WaterLevelContext>> {
  const provider = getEffectiveProvider('pegelonline-wsv', ctx.config);
  try {
    const url =
      `${ctx.config.pegelonlineUrl}/stations.json` +
      `?latitude=${coords.latitude.toFixed(4)}&longitude=${coords.longitude.toFixed(4)}` +
      `&radius=${SEARCH_RADIUS_KM}&includeTimeseries=true&includeCurrentMeasurement=true`;
    const fingerprint = requestFingerprint({
      resource: 'pegel-stations',
      lat: coords.latitude.toFixed(3),
      lon: coords.longitude.toFixed(3),
    });
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = StationsResponse.safeParse(result.raw);
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

    const stations: WaterStation[] = parsed.data
      .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map((s) => {
        const stationCoords = { latitude: s.latitude!, longitude: s.longitude! };
        const readings: WaterReading[] = (s.timeseries ?? [])
          .filter((t) => t.currentMeasurement)
          .map((t) => {
            const m = t.currentMeasurement!;
            return {
              parameter: t.shortname,
              parameterName: t.longname ?? null,
              value: typeof m.value === 'number' && Number.isFinite(m.value) ? m.value : null,
              unit: t.unit,
              mode: 'observed' as const,
              measuredAt: toIsoOrNull(m.timestamp),
              stateMnwMhw: m.stateMnwMhw ?? null,
            };
          });
        return {
          stationId: s.uuid,
          name: s.longname,
          waterBody: s.water?.longname ?? s.water?.shortname ?? null,
          coordinates: stationCoords,
          distanceMeters: Math.round(distanceMeters(coords, stationCoords)),
          readings,
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, MAX_STATIONS);

    const nearest = stations[0];
    const anyReading = stations.some((s) => s.readings.length > 0);

    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method:
        'Pegel-Rohmesswerte der WSV (PEGELONLINE REST-API, Umkreisabfrage). Punktdaten am Pegelstandort des jeweiligen Gewässers — keine Übertragung auf andere Orte oder Gewässer.',
      spatial: nearest
        ? { kind: 'station', stationId: nearest.stationId, distanceMeters: nearest.distanceMeters }
        : { kind: 'unknown' },
      completeness: 'provisional',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
      limitations: nearest
        ? [
            `Nächster Pegel ${formatDistanceGerman(nearest.distanceMeters)} entfernt (${nearest.waterBody ?? 'Gewässer unbekannt'}).`,
          ]
        : [],
    });

    if (stations.length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: { stations: [], searchRadiusMeters: SEARCH_RADIUS_KM * 1000 },
        evidence: [evidence],
        limitations: provider.knownLimitations,
        statusDetail: `Kein Pegel der Bundeswasserstraßen im Umkreis von ${SEARCH_RADIUS_KM} km. Das ist eine Abdeckungsaussage — Gewässer ohne Bundespegel werden hier nicht erfasst.`,
        retrievedAt: result.retrievedAt,
      };
    }

    return {
      status: result.stale ? 'stale' : anyReading ? 'ok' : 'partial',
      demo: false,
      data: { stations, searchRadiusMeters: SEARCH_RADIUS_KM * 1000 },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(anyReading
        ? {}
        : {
            statusDetail: 'Pegel im Umkreis gefunden, aber ohne aktuell abrufbaren Messwert.',
          }),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<WaterLevelContext>(err, provider.knownLimitations);
  }
}
