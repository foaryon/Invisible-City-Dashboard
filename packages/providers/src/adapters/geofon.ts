/**
 * GFZ GEOFON earthquakes — FDSN event web service, documented `format=text`
 * (pipe-separated). Catalogued events within a radius/time window around the
 * selected place. "Keine Ereignisse" is the normal, honest outcome for most of
 * Germany; catalogue entries state epicentre + magnitude — never local shaking.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type SeismicContext,
  type SeismicEvent,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchTextWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const SEARCH_RADIUS_KM = 200;
const WINDOW_DAYS = 90;
const MAX_EVENTS = 8;

const ParsedRow = z.object({
  id: z.string().min(1),
  time: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  depthKm: z.number().nullable(),
  magType: z.string().nullable(),
  magnitude: z.number().nullable(),
  locationName: z.string().nullable(),
});

/**
 * Parse FDSN event `format=text`:
 * #EventID|Time|Latitude|Longitude|Depth/km|Author|Catalog|Contributor|ContributorID|MagType|Magnitude|MagAuthor|EventLocationName
 * Malformed lines are rejected (null), never repaired.
 */
export function parseFdsnEventText(text: string): Array<z.infer<typeof ParsedRow>> | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  const out: Array<z.infer<typeof ParsedRow>> = [];
  for (const line of lines) {
    const cols = line.split('|').map((c) => c.trim());
    if (cols.length < 13) return null;
    const num = (s: string | undefined): number | null => {
      if (s === undefined || s.length === 0) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };
    const lat = num(cols[2]);
    const lon = num(cols[3]);
    if (lat === null || lon === null) return null;
    const row = ParsedRow.safeParse({
      id: cols[0] ?? '',
      time: cols[1] && cols[1].length > 0 ? cols[1] : null,
      latitude: lat,
      longitude: lon,
      depthKm: num(cols[4]),
      magType: cols[9] && cols[9].length > 0 ? cols[9] : null,
      magnitude: num(cols[10]),
      locationName: cols[12] && cols[12].length > 0 ? cols[12] : null,
    });
    if (!row.success) return null;
    out.push(row.data);
  }
  return out;
}

export async function getSeismicContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<SeismicContext>> {
  const provider = getEffectiveProvider('gfz-geofon', ctx.config);
  try {
    const start = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
    const url =
      `${ctx.config.geofonUrl}/query?format=text&latitude=${coords.latitude.toFixed(3)}` +
      `&longitude=${coords.longitude.toFixed(3)}&maxradius=${(SEARCH_RADIUS_KM / 111.32).toFixed(3)}` +
      `&starttime=${start}&orderby=time&limit=50`;
    const fingerprint = requestFingerprint({
      resource: 'geofon-events',
      lat: coords.latitude.toFixed(2),
      lon: coords.longitude.toFixed(2),
      start,
    });
    const result = await fetchTextWithCache(provider, fingerprint, url, ctx);
    // FDSN: HTTP 204/empty body = no matching events — a normal outcome.
    const rows = result.raw.trim().length === 0 ? [] : parseFdsnEventText(result.raw);
    if (rows === null) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Antwort der Quelle entsprach nicht dem dokumentierten FDSN-Textformat und wurde verworfen.',
        retrievedAt: result.retrievedAt,
      };
    }

    const events: SeismicEvent[] = rows
      .map((r) => {
        const eventCoords = { latitude: r.latitude, longitude: r.longitude };
        return {
          id: r.id,
          time: r.time,
          magnitude: r.magnitude,
          magType: r.magType,
          depthKm: r.depthKm,
          coordinates: eventCoords,
          distanceMeters: Math.round(distanceMeters(coords, eventCoords)),
          locationName: r.locationName,
          mode: 'observed' as const,
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, MAX_EVENTS);

    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method: `Katalogereignisse des GEOFON-Erdbebendienstes (FDSN event web service) im Umkreis von ${SEARCH_RADIUS_KM} km, letzte ${WINDOW_DAYS} Tage. Epizentrum und Magnitude — keine Aussage über Erschütterungen am gewählten Ort.`,
      spatial: { kind: 'geometry', geometryType: 'point' },
      completeness: 'complete',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
    });

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: { events, searchRadiusKm: SEARCH_RADIUS_KM, windowDays: WINDOW_DAYS },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(events.length === 0
        ? {
            statusDetail: `Keine katalogisierten Ereignisse im Umkreis von ${SEARCH_RADIUS_KM} km in den letzten ${WINDOW_DAYS} Tagen — der Normalfall und ein ehrliches Ergebnis.`,
          }
        : {}),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<SeismicContext>(err, provider.knownLimitations);
  }
}
