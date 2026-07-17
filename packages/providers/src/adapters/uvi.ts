/**
 * DWD UV index forecast (opendata.dwd.de uvi.json, CC BY 4.0).
 *
 * The source publishes daily UV-index maxima for a SMALL set of named
 * reference locations (no coordinates in the payload). We assign the nearest
 * reference location via a documented, product-side coordinate table and label
 * it as a regional reference with its distance. Locations not present in the
 * table are skipped — never guessed.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type UvContext,
  type UvDay,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters, formatDistanceGerman } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

/**
 * Documented product-side coordinates for DWD UV forecast locations (the
 * source delivers names only). Unmatched source locations are skipped; the
 * table is tracked as TO VERIFY in the manifest. Keys are lowercase.
 */
export const UV_CITY_COORDS: Record<string, Coordinates> = {
  berlin: { latitude: 52.52, longitude: 13.405 },
  hamburg: { latitude: 53.551, longitude: 9.994 },
  muenchen: { latitude: 48.137, longitude: 11.575 },
  münchen: { latitude: 48.137, longitude: 11.575 },
  koeln: { latitude: 50.938, longitude: 6.96 },
  köln: { latitude: 50.938, longitude: 6.96 },
  'frankfurt/main': { latitude: 50.11, longitude: 8.682 },
  frankfurt: { latitude: 50.11, longitude: 8.682 },
  stuttgart: { latitude: 48.776, longitude: 9.182 },
  duesseldorf: { latitude: 51.226, longitude: 6.773 },
  düsseldorf: { latitude: 51.226, longitude: 6.773 },
  leipzig: { latitude: 51.34, longitude: 12.375 },
  dresden: { latitude: 51.05, longitude: 13.738 },
  hannover: { latitude: 52.375, longitude: 9.732 },
  nuernberg: { latitude: 49.454, longitude: 11.077 },
  nürnberg: { latitude: 49.454, longitude: 11.077 },
  bremen: { latitude: 53.079, longitude: 8.801 },
  saarbruecken: { latitude: 49.234, longitude: 6.994 },
  saarbrücken: { latitude: 49.234, longitude: 6.994 },
  kiel: { latitude: 54.323, longitude: 10.123 },
  rostock: { latitude: 54.092, longitude: 12.099 },
  magdeburg: { latitude: 52.131, longitude: 11.64 },
  erfurt: { latitude: 50.978, longitude: 11.029 },
  mainz: { latitude: 49.999, longitude: 8.273 },
  potsdam: { latitude: 52.396, longitude: 13.058 },
  schwerin: { latitude: 53.635, longitude: 11.415 },
  wiesbaden: { latitude: 50.078, longitude: 8.24 },
  freiburg: { latitude: 47.999, longitude: 7.842 },
  'westerland/sylt': { latitude: 54.908, longitude: 8.303 },
  zugspitze: { latitude: 47.421, longitude: 10.985 },
};

const CityEntry = z.object({
  city: z.string(),
  forecast: z
    .object({
      today: z.number().nullable().optional(),
      tomorrow: z.number().nullable().optional(),
      dayafter_to: z.number().nullable().optional(),
    })
    .optional(),
});

const UviResponse = z.object({
  last_update: z.string().optional(),
  content: z.array(CityEntry),
});

/** Berlin-calendar date string (YYYY-MM-DD) for now + N days. */
function berlinDatePlus(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export async function getUvContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<UvContext>> {
  const provider = getEffectiveProvider('dwd-uvi', ctx.config);
  try {
    const url = `${ctx.config.dwdHealthUrl}/uvi.json`;
    const fingerprint = requestFingerprint({ resource: 'uvi' });
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = UviResponse.safeParse(result.raw);
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

    // Nearest reference location among those we can place on the map.
    let best: {
      city: string;
      coords: Coordinates;
      distance: number;
      entry: (typeof parsed.data.content)[number];
    } | null = null;
    for (const entry of parsed.data.content) {
      const cityCoords = UV_CITY_COORDS[entry.city.trim().toLowerCase()];
      if (!cityCoords) continue;
      const d = distanceMeters(coords, cityCoords);
      if (!best || d < best.distance)
        best = { city: entry.city, coords: cityCoords, distance: d, entry };
    }

    if (!best) {
      return {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Keiner der Vorhersageorte der Quelle konnte einer dokumentierten Koordinate zugeordnet werden.',
        retrievedAt: result.retrievedAt,
      };
    }

    const f = best.entry.forecast;
    const days: UvDay[] = [
      { validOn: berlinDatePlus(0), value: f?.today ?? null, mode: 'forecast' as const },
      { validOn: berlinDatePlus(1), value: f?.tomorrow ?? null, mode: 'forecast' as const },
      { validOn: berlinDatePlus(2), value: f?.dayafter_to ?? null, mode: 'forecast' as const },
    ];

    const distance = Math.round(best.distance);
    const evidence = makeEvidence(provider, {
      mode: 'forecast',
      method:
        'DWD UV-Index-Vorhersage (Tagesmaximum) für den nächstgelegenen Vorhersageort. Regionale Referenz — kein Wert am gewählten Pin.',
      spatial: { kind: 'station', stationId: best.city, distanceMeters: distance },
      completeness: 'partial',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
      ...(parsed.data.last_update ? { sourceTimeRaw: parsed.data.last_update } : {}),
      limitations: [
        `Vorhersageort „${best.city}“ ist ${formatDistanceGerman(distance)} entfernt — regionale Referenz.`,
      ],
    });

    const anyValue = days.some((d) => d.value !== null);
    return {
      status: result.stale ? 'stale' : anyValue ? 'ok' : 'partial',
      demo: false,
      data: { cityName: best.city, coordinates: best.coords, distanceMeters: distance, days },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(anyValue ? {} : { statusDetail: 'Der Vorhersageort liefert derzeit keine Werte.' }),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<UvContext>(err, provider.knownLimitations);
  }
}
