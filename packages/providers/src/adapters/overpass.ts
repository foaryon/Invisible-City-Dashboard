/**
 * OSM POI/geometry context via Overpass API (public instance; fair use: one
 * query at a time — enforced by the HTTP layer; results cached 6 h).
 * POIs are supplementary MAPPED context — never operational guarantees.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type PoiContext,
  type Poi,
  type PoiCategory,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const RawElement = z.object({
  type: z.enum(['node', 'way', 'relation']),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string()).optional(),
});

const OverpassResponse = z.object({
  elements: z.array(RawElement),
  osm3s: z.object({ timestamp_osm_base: z.string().optional() }).optional(),
});

function categorize(tags: Record<string, string>): PoiCategory | null {
  if (tags['emergency'] === 'defibrillator') return 'defibrillator';
  if (tags['amenity'] === 'hospital') return 'hospital';
  if (tags['amenity'] === 'fire_station') return 'fire-station';
  if (tags['leisure'] === 'park') return 'park';
  if (tags['amenity'] === 'pharmacy') return 'pharmacy';
  if (tags['amenity'] === 'toilets') return 'toilet';
  if (tags['amenity'] === 'drinking_water') return 'drinking-water';
  if (tags['public_transport'] === 'stop_position' || tags['highway'] === 'bus_stop')
    return 'transit-stop';
  return null;
}

export async function getPoiContext(
  coords: Coordinates,
  ctx: AdapterContext,
  radiusMeters = 1200,
): Promise<ModuleEnvelope<PoiContext>> {
  const provider = getEffectiveProvider('osm-overpass', ctx.config);
  const { latitude: lat, longitude: lon } = coords;
  const around = `around:${radiusMeters},${lat.toFixed(4)},${lon.toFixed(4)}`;
  const query = `
[out:json][timeout:25];
(
  node["amenity"="pharmacy"](${around});
  node["amenity"="toilets"](${around});
  node["amenity"="drinking_water"](${around});
  node["emergency"="defibrillator"](${around});
  node["amenity"="hospital"](${around});
  way["amenity"="hospital"](${around});
  node["amenity"="fire_station"](${around});
  way["amenity"="fire_station"](${around});
  node["public_transport"="stop_position"](${around});
  node["highway"="bus_stop"](${around});
  way["leisure"="park"](${around});
);
out center 200;`;
  const fingerprint = requestFingerprint({
    resource: 'pois',
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    radiusMeters,
  });
  const url = ctx.config.overpassUrl;

  try {
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    const parsed = OverpassResponse.safeParse(result.raw);
    if (!parsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Overpass-Antwort entsprach nicht dem dokumentierten Schema und wurde verworfen.',
        retrievedAt: new Date().toISOString(),
      };
    }

    const pois: Poi[] = [];
    for (const el of parsed.data.elements) {
      const tags = el.tags ?? {};
      const category = categorize(tags);
      if (!category) continue;
      const pLat = el.lat ?? el.center?.lat;
      const pLon = el.lon ?? el.center?.lon;
      if (pLat === undefined || pLon === undefined) continue;
      const c = { latitude: pLat, longitude: pLon };
      pois.push({
        id: `${el.type}/${el.id}`,
        category,
        name: tags['name'] ?? null,
        coordinates: c,
        distanceMeters: Math.round(distanceMeters(coords, c)),
        mode: 'mapped',
      });
    }
    pois.sort((a, b) => a.distanceMeters - b.distanceMeters);

    const osmBase = parsed.data.osm3s?.timestamp_osm_base;
    const evidence = makeEvidence(provider, {
      mode: 'mapped',
      method: `Kartierte OSM-Objekte im Umkreis von ${radiusMeters} m (Overpass QL). Kartierter Kontext — keine Aussage über Öffnung, Betrieb, Barrierefreiheit oder Sicherheit.`,
      spatial: { kind: 'geometry', geometryType: 'point' },
      completeness: 'unknown',
      retrievedAt: result.retrievedAt,
      cacheAgeSeconds: result.cacheAgeSeconds,
      ...(osmBase ? { publishedAt: new Date(osmBase).toISOString() } : {}),
      limitations: [
        'Vollständigkeit der Kartierung unbekannt; Datenstand siehe OSM-Basiszeitstempel.',
      ],
    });

    return {
      status: result.stale ? 'stale' : 'ok',
      demo: false,
      data: { pois },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(result.stale
        ? {
            statusDetail: `Quelle aktuell nicht erreichbar — letzte gültige Antwort (Alter: ${Math.round(
              result.cacheAgeSeconds / 3600,
            )} Std.) wird sichtbar gekennzeichnet angezeigt.`,
          }
        : {}),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<PoiContext>(err, provider.knownLimitations);
  }
}
