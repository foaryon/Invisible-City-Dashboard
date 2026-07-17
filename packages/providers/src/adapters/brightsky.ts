/**
 * DWD weather via Bright Sky (documented, unofficial JSON access layer over
 * DWD Open Data; MIT; no API key; DWD Terms of Use apply to the data).
 * Labelled as unofficial access layer in every Evidence record; direct
 * opendata.dwd.de (MOSMIX_L) remains the documented fallback path.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type WeatherContext,
  type WeatherHour,
  type WeatherValue,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const RawWeatherRecord = z.object({
  timestamp: z.string(),
  source_id: z.number(),
  temperature: z.number().nullable().optional(),
  precipitation: z.number().nullable().optional(),
  wind_speed: z.number().nullable().optional(),
  wind_gust_speed: z.number().nullable().optional(),
  relative_humidity: z.number().nullable().optional(),
});

const RawSource = z.object({
  id: z.number(),
  dwd_station_id: z.string().nullable().optional(),
  observation_type: z.enum(['historical', 'current', 'synop', 'forecast']),
  lat: z.number(),
  lon: z.number(),
  station_name: z.string().nullable().optional(),
  distance: z.number().nullable().optional(),
});

const BrightSkyResponse = z.object({
  weather: z.array(RawWeatherRecord),
  sources: z.array(RawSource),
});

const PARAMETERS: Array<{
  key: keyof z.infer<typeof RawWeatherRecord>;
  parameter: WeatherValue['parameter'];
  unit: string;
}> = [
  { key: 'temperature', parameter: 'temperature', unit: '°C' },
  { key: 'precipitation', parameter: 'precipitation', unit: 'mm' },
  { key: 'wind_speed', parameter: 'windSpeed', unit: 'km/h' },
  { key: 'wind_gust_speed', parameter: 'windGust', unit: 'km/h' },
  { key: 'relative_humidity', parameter: 'relativeHumidity', unit: '%' },
];

export async function getWeatherContext(
  coords: Coordinates,
  fromIso: string,
  toIso: string,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<WeatherContext>> {
  const provider = getEffectiveProvider('dwd-brightsky', ctx.config);
  const lat = coords.latitude.toFixed(3);
  const lon = coords.longitude.toFixed(3);
  const url = `${ctx.config.brightskyUrl}/weather?lat=${lat}&lon=${lon}&date=${encodeURIComponent(
    fromIso,
  )}&last_date=${encodeURIComponent(toIso)}&units=dwd`;
  const fingerprint = requestFingerprint({ lat, lon, fromIso, toIso });

  try {
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = BrightSkyResponse.safeParse(result.raw);
    if (!parsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Antwort der Quelle entsprach nicht dem dokumentierten Schema und wurde verworfen. Es werden keine Ersatzwerte erzeugt.',
        retrievedAt: new Date().toISOString(),
      };
    }

    const sources = new Map(parsed.data.sources.map((s) => [s.id, s]));
    const hours: WeatherHour[] = [];
    for (const rec of parsed.data.weather) {
      const source = sources.get(rec.source_id);
      if (!source) continue; // record without declared source is rejected, not guessed
      const mode = source.observation_type === 'forecast' ? 'forecast' : 'observed';
      const values: WeatherValue[] = PARAMETERS.map(({ key, parameter, unit }) => ({
        parameter,
        value: (rec[key] as number | null | undefined) ?? null,
        unit,
        mode,
        validAt: rec.timestamp,
      }));
      const stationDistance =
        source.distance ??
        Math.round(distanceMeters(coords, { latitude: source.lat, longitude: source.lon }));
      hours.push({
        validAt: rec.timestamp,
        mode,
        values,
        ...(source.dwd_station_id ? { sourceStationId: source.dwd_station_id } : {}),
        sourceStationDistanceMeters: stationDistance,
      });
    }

    const anyForecast = hours.some((h) => h.mode === 'forecast');
    const anyObserved = hours.some((h) => h.mode === 'observed');
    const nearest = parsed.data.sources[0];
    const evidence = makeEvidence(provider, {
      mode: anyObserved && !anyForecast ? 'observed' : 'forecast',
      method:
        'DWD-Beobachtungen und MOSMIX-Vorhersage der nächstgelegenen Station/Vorhersagepunkte, abgerufen über die inoffizielle Bright-Sky-JSON-Schicht. Beobachtet und Prognose sind pro Stunde getrennt ausgewiesen.',
      spatial: nearest?.dwd_station_id
        ? {
            kind: 'station',
            stationId: nearest.dwd_station_id,
            ...(nearest.distance != null ? { distanceMeters: nearest.distance } : {}),
          }
        : { kind: 'unknown' },
      completeness: hours.length > 0 ? 'complete' : 'unknown',
      retrievedAt: result.retrievedAt,
      cacheAgeSeconds: result.cacheAgeSeconds,
      validAt: fromIso,
      limitations: [
        'Eine MOSMIX-Prognose ist keine Messung am gewählten Pin.',
        ...(anyForecast ? [] : ['Für den gewählten Zeitraum liegen nur Beobachtungswerte vor.']),
      ],
    });

    if (hours.length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [evidence],
        limitations: provider.knownLimitations,
        statusDetail: 'Für diesen Ort und Zeitraum liegen keine Wetterdaten der Quelle vor.',
        retrievedAt: result.retrievedAt,
      };
    }

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: { hours },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(result.stale
        ? {
            statusDetail: `Quelle aktuell nicht erreichbar — letzte gültige Antwort (Alter: ${Math.round(
              result.cacheAgeSeconds / 60,
            )} Min.) wird sichtbar gekennzeichnet angezeigt.`,
          }
        : {}),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<WeatherContext>(err, provider.knownLimitations);
  }
}
