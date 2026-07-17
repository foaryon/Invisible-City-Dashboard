/**
 * Geocoding via Photon (komoot public demo instance; Apache-2.0 code, ODbL
 * data; no availability guarantee — throttled and cached; self-hosting is the
 * documented production path). Search and reverse produce the SAME
 * SelectedPlace contract as map clicks.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type GeocodeResult,
  type SelectedPlace,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence } from '@invisible-city/evidence';
import { getProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const PhotonFeature = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]).rest(z.number()) }),
  properties: z.record(z.unknown()),
});
const PhotonResponse = z.object({ features: z.array(PhotonFeature) });

function prop(props: Record<string, unknown>, key: string): string | undefined {
  const v = props[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function toPlace(f: z.infer<typeof PhotonFeature>): SelectedPlace | null {
  const props = f.properties;
  if (prop(props, 'countrycode') !== 'DE') return null; // product scope: Germany
  const [lon, lat] = f.geometry.coordinates;
  const name = prop(props, 'name');
  const city = prop(props, 'city');
  const state = prop(props, 'state');
  const labelParts = [name, city && city !== name ? city : undefined, state].filter(Boolean);
  if (labelParts.length === 0) return null;
  const osmId = prop(props, 'osm_id') ?? String(props['osm_id'] ?? `${lat},${lon}`);
  const osmType = prop(props, 'osm_type') ?? String(props['osm_type'] ?? 'X');
  return {
    id: `osm:${osmType}:${osmId}`,
    label: labelParts.join(', '),
    coordinates: { latitude: lat, longitude: lon },
    ...(city ? { locality: city } : name ? { locality: name } : {}),
    ...(city ? { municipality: city } : {}),
    ...(state ? { state } : {}),
    country: 'DE',
  };
}

async function runGeocode(
  url: string,
  fingerprint: string,
  method: string,
  ctx: AdapterContext,
  limit: number,
): Promise<ModuleEnvelope<GeocodeResult[]>> {
  const provider = getProvider('photon-geocoding');
  try {
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = PhotonResponse.safeParse(result.raw);
    if (!parsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Geokodierungs-Antwort entsprach nicht dem dokumentierten Schema und wurde verworfen.',
        retrievedAt: new Date().toISOString(),
      };
    }
    const places = parsed.data.features
      .map(toPlace)
      .filter((p): p is SelectedPlace => p !== null)
      .slice(0, limit);
    const evidence = makeEvidence(provider, {
      mode: 'mapped',
      method,
      spatial: { kind: 'geometry', geometryType: 'point' },
      completeness: 'unknown',
      retrievedAt: result.retrievedAt,
      cacheAgeSeconds: result.cacheAgeSeconds,
    });
    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: places.map((place) => ({ place, mode: 'mapped' as const })),
      evidence: [evidence],
      limitations: provider.knownLimitations,
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<GeocodeResult[]>(err, provider.knownLimitations);
  }
}

export async function searchPlaces(
  query: string,
  ctx: AdapterContext,
  limit = 8,
): Promise<ModuleEnvelope<GeocodeResult[]>> {
  const q = query.trim();
  const url = `https://photon.komoot.io/api?q=${encodeURIComponent(q)}&limit=${limit + 4}&lang=de`;
  const fingerprint = requestFingerprint({ resource: 'search', q: q.toLowerCase(), limit });
  return runGeocode(
    url,
    fingerprint,
    'Ortssuche über Photon (OSM-Daten), gefiltert auf Deutschland (countrycode DE).',
    ctx,
    limit,
  );
}

export async function reverseGeocode(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<GeocodeResult[]>> {
  const lat = coords.latitude.toFixed(5);
  const lon = coords.longitude.toFixed(5);
  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=de`;
  const fingerprint = requestFingerprint({ resource: 'reverse', lat, lon });
  return runGeocode(
    url,
    fingerprint,
    'Reverse-Geokodierung über Photon (OSM-Daten) für einen Kartenklick-Punkt.',
    ctx,
    1,
  );
}
