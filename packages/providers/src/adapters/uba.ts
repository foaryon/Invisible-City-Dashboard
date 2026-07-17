/**
 * UBA/Länder observed air quality (Air Data API, luftdaten.umweltbundesamt.de,
 * JSON, no API key; license dl-de/by-2-0; attribution "Umweltbundesamt").
 *
 * Reality rules enforced here:
 *  - station observations are POINT data; no interpolation, no "local air value";
 *  - stations beyond 5 km are labelled as REGIONAL reference;
 *  - current-year data are provisional ("nicht endgültig geprüft");
 *  - source timestamps are CET/MEZ (no DST) — normalized deliberately, the
 *    original string is preserved in the payload and Evidence.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type AirStationContext,
  type AirStation,
  type AirMeasurement,
  type Coordinates,
  type Pollutant,
} from '@invisible-city/contracts';
import {
  makeEvidence,
  distanceMeters,
  formatDistanceGerman,
  stationSpatialRole,
  ubaCetToIso,
} from '@invisible-city/evidence';
import { getProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const BASE = 'https://luftdaten.umweltbundesamt.de/api/air_data/v3';

/**
 * Component IDs per UBA API documentation (re-verification tracked in the
 * manifest): PM10=1, CO=2, O3=3, SO2=4, NO2=5, PM2 (PM2.5)=9.
 */
const COMPONENTS: Array<{ id: number; pollutant: Pollutant; unit: string }> = [
  { id: 1, pollutant: 'PM10', unit: 'µg/m³' },
  { id: 2, pollutant: 'CO', unit: 'mg/m³' },
  { id: 3, pollutant: 'O3', unit: 'µg/m³' },
  { id: 4, pollutant: 'SO2', unit: 'µg/m³' },
  { id: 5, pollutant: 'NO2', unit: 'µg/m³' },
  { id: 9, pollutant: 'PM2', unit: 'µg/m³' },
];

const StationsResponse = z.object({ data: z.record(z.array(z.unknown())) });
const MeasuresResponse = z.object({
  data: z.record(z.record(z.array(z.unknown()))),
});

interface StationRow {
  stationId: string;
  code: string;
  name: string;
  coordinates: Coordinates;
  stationType: string | null;
}

/** Positional extraction per documented stations/json layout; invalid rows are rejected. */
function parseStationRow(id: string, row: unknown[]): StationRow | null {
  const code = row[1];
  const name = row[2];
  const lon = Number(row[7]);
  const lat = Number(row[8]);
  const stationType = row[13];
  if (typeof code !== 'string' || typeof name !== 'string') return null;
  // Plausibility bounds for Germany; out-of-range rows are rejected, not repaired.
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < 47 || lat > 55.2 || lon < 5.5 || lon > 15.2) return null;
  return {
    stationId: id,
    code,
    name,
    coordinates: { latitude: lat, longitude: lon },
    stationType: typeof stationType === 'string' && stationType ? stationType : null,
  };
}

async function fetchStations(ctx: AdapterContext) {
  const provider = getProvider('uba-airdata');
  const url = `${BASE}/stations/json?lang=de`;
  const fingerprint = requestFingerprint({ resource: 'stations' });
  const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
  const parsed = StationsResponse.safeParse(result.raw);
  if (!parsed.success) return { stations: null as StationRow[] | null, result };
  const stations: StationRow[] = [];
  for (const [id, row] of Object.entries(parsed.data.data)) {
    const s = parseStationRow(id, row);
    if (s) stations.push(s);
  }
  return { stations, result };
}

function parseMeasure(
  componentId: number,
  pollutant: Pollutant,
  unit: string,
  data: Record<string, Record<string, unknown[]>>,
  stationId: string,
): AirMeasurement | null {
  const byTime = data[stationId];
  if (!byTime) return null;
  // Take the most recent entry whose row matches [component, scope, value, dateEnd, ...].
  const timestamps = Object.keys(byTime).sort();
  for (let i = timestamps.length - 1; i >= 0; i--) {
    const ts = timestamps[i]!;
    const row = byTime[ts];
    if (!Array.isArray(row)) continue;
    if (Number(row[0]) !== componentId) continue;
    const value = row[2];
    const dateEnd = typeof row[3] === 'string' ? row[3] : ts;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    return {
      pollutant,
      value,
      unit,
      mode: 'observed',
      measuredAt: ubaCetToIso(dateEnd),
      sourceTimeRaw: dateEnd,
    };
  }
  return null;
}

export async function getAirStationContext(
  coords: Coordinates,
  ctx: AdapterContext,
  maxStations = 3,
): Promise<ModuleEnvelope<AirStationContext>> {
  const provider = getProvider('uba-airdata');
  try {
    const { stations, result: stationsResult } = await fetchStations(ctx);
    if (!stations) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Das Stationsverzeichnis der Quelle entsprach nicht dem dokumentierten Schema und wurde verworfen.',
        retrievedAt: new Date().toISOString(),
      };
    }

    const nearest = stations
      .map((s) => ({ ...s, distance: distanceMeters(coords, s.coordinates) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxStations);

    if (nearest.length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail: 'Keine Messstation im Stationsverzeichnis gefunden.',
        retrievedAt: stationsResult.retrievedAt,
      };
    }

    // Measurement window: last 24 h in the API's CET clock (defensively wide).
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 3600 * 1000);
    const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

    const outStations: AirStation[] = [];
    let anyMeasurement = false;
    let anyStale = stationsResult.stale;

    for (const station of nearest) {
      const measurements: AirMeasurement[] = [];
      for (const comp of COMPONENTS) {
        const url =
          `${BASE}/measures/json?date_from=${fmtDate(from)}&time_from=1&date_to=${fmtDate(now)}&time_to=24` +
          `&station=${station.stationId}&component=${comp.id}&scope=2`;
        const fingerprint = requestFingerprint({
          resource: 'measures',
          station: station.stationId,
          component: comp.id,
          date: fmtDate(now),
        });
        try {
          const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
          anyStale = anyStale || result.stale;
          const parsed = MeasuresResponse.safeParse(result.raw);
          if (!parsed.success) continue; // malformed component response → omitted, never invented
          const m = parseMeasure(
            comp.id,
            comp.pollutant,
            comp.unit,
            parsed.data.data,
            station.stationId,
          );
          if (m) {
            measurements.push(m);
            anyMeasurement = true;
          }
        } catch {
          // Single-component failure → that pollutant is simply absent (partial).
        }
      }
      outStations.push({
        stationId: station.stationId,
        stationCode: station.code,
        name: station.name,
        coordinates: station.coordinates,
        stationType: station.stationType,
        distanceMeters: Math.round(station.distance),
        measurements,
      });
    }

    const nearestStation = outStations[0];
    const role = nearestStation ? stationSpatialRole(nearestStation.distanceMeters) : 'regional';
    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method:
        'Stationsmessungen der UBA-/Länder-Messnetze (Air Data API). Punktdaten der jeweiligen Station — keine Interpolation, keine Aussage über die Luftqualität an anderen Orten.',
      spatial: nearestStation
        ? {
            kind: 'station',
            stationId: nearestStation.stationCode,
            distanceMeters: nearestStation.distanceMeters,
            ...(nearestStation.stationType ? { stationType: nearestStation.stationType } : {}),
          }
        : { kind: 'unknown' },
      completeness: 'provisional',
      retrievedAt: stationsResult.retrievedAt,
      limitations: [
        ...(role === 'regional' && nearestStation
          ? [
              `Nächste Station ist ${formatDistanceGerman(nearestStation.distanceMeters)} entfernt — regionale Referenz, kein lokaler Wert.`,
            ]
          : []),
        'Zeitstempel von MEZ/CET (Quelle) nach Europe/Berlin normalisiert; Originalzeit je Messwert erhalten.',
      ],
    });

    const partial =
      outStations.some(
        (s) => s.measurements.length > 0 && s.measurements.length < COMPONENTS.length,
      ) || !anyMeasurement;

    return {
      status: anyStale ? 'stale' : anyMeasurement ? (partial ? 'partial' : 'ok') : 'unavailable',
      demo: false,
      data: { stations: outStations },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(anyMeasurement
        ? partial
          ? {
              statusDetail:
                'Nicht alle Schadstoffe werden an jeder Station gemessen oder waren abrufbar.',
            }
          : {}
        : {
            statusDetail:
              'Für die nächstgelegenen Stationen liegen im Abfragezeitraum keine abrufbaren Messwerte vor.',
          }),
      retrievedAt: stationsResult.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<AirStationContext>(err, provider.knownLimitations);
  }
}
