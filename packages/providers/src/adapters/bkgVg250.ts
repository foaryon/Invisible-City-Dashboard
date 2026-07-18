/**
 * BKG VG250 — official territorial assignment of a point (WFS 2.0, GeoJSON).
 *
 * Returns the Gemeinde the point lies in, including its official ARS
 * (Amtlicher Regionalschlüssel). Mapped administrative context; used by the
 * NINA civil-protection module to query the correct district dashboard.
 *
 * The BKG VG250 WFS runs on deegree (sgx.geodatenzentrum.de), which does NOT
 * support GeoServer's `cql_filter` vendor parameter. We therefore use a
 * standard WFS 2.0 `bbox` KVP request for a small box around the point and do
 * the exact point-in-polygon test locally on the returned GeoJSON — no vendor
 * extension, no server-side spatial predicate. The returned geometry's axis
 * order is normalized defensively (see `ringContains`).
 *
 * TO VERIFY (live, on the user's machine — see docs/data-sources.md): the exact
 * typeName, the WFS 2.0 bbox axis convention for EPSG:4326, and the property
 * names (`ars`/`ags`/`gen`).
 */
import { z } from 'zod';
import { type Coordinates } from '@invisible-city/contracts';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, type AdapterContext, type RawResult } from '../runner.js';

/** GeoJSON Polygon/MultiPolygon feature with the VG250 Gemeinde properties. */
const Vg250Response = z.object({
  features: z.array(
    z.object({
      properties: z
        .object({
          ars: z.string().optional(),
          ags: z.string().optional(),
          gen: z.string().optional(),
          bez: z.string().optional(),
        })
        .passthrough(),
      geometry: z
        .object({
          type: z.enum(['Polygon', 'MultiPolygon']),
          // Polygon: number[][][]; MultiPolygon: number[][][][]. Kept loose and
          // validated structurally in the ring walk below.
          coordinates: z.array(z.unknown()),
        })
        .nullable()
        .optional(),
    }),
  ),
});

export interface TerritorialAssignment {
  /** 12-digit Amtlicher Regionalschlüssel of the Gemeinde. */
  ars: string;
  municipalityName: string | null;
  raw: RawResult<unknown>;
}

/** District-level ARS (Kreis): first 5 digits + 7 zeros, per NINA convention. */
export function districtArs(gemeindeArs: string): string {
  return `${gemeindeArs.slice(0, 5)}0000000`;
}

type Ring = Array<[number, number]>;

/** Germany bounds — used to normalize the returned geometry's axis order. */
const DE_LAT: [number, number] = [47, 55.2];
const DE_LON: [number, number] = [5.5, 15.2];

/**
 * Coerce a raw coordinate pair to GeoJSON [lon, lat]. WFS 2.0 with an
 * EPSG:4326 srsName may emit [lat, lon]; we detect that by range (a value in
 * the German latitude band paired with one in the longitude band) and swap.
 */
function toLonLat(pair: [number, number]): [number, number] {
  const [a, b] = pair;
  const looksLatLon = a >= DE_LAT[0] && a <= DE_LAT[1] && b >= DE_LON[0] && b <= DE_LON[1];
  const looksLonLat = a >= DE_LON[0] && a <= DE_LON[1] && b >= DE_LAT[0] && b <= DE_LAT[1];
  // If it is unambiguously [lat, lon], swap; otherwise trust GeoJSON [lon, lat].
  return looksLatLon && !looksLonLat ? [b, a] : [a, b];
}

/** Ray-casting point-in-ring on GeoJSON [lon, lat] coordinates. */
function ringContains(ring: Ring, lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Parse a raw ring (array of coordinate pairs) into normalized [lon, lat]. */
function parseRing(raw: unknown): Ring | null {
  if (!Array.isArray(raw)) return null;
  const ring: Ring = [];
  for (const pt of raw) {
    if (!Array.isArray(pt) || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') continue;
    ring.push(toLonLat([pt[0], pt[1]]));
  }
  return ring.length >= 3 ? ring : null;
}

/**
 * True when the point lies in the polygon/multipolygon. Only outer rings are
 * tested — the VG250 Gemeinden tessellate, so an outer-ring hit is sufficient
 * to identify the containing municipality (holes would only matter for exclaves
 * that another feature's outer ring already covers).
 */
function geometryContains(
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] },
  coords: Coordinates,
): boolean {
  const { longitude: lon, latitude: lat } = coords;
  const polygons: unknown[] =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon)) continue;
    const outer = parseRing(polygon[0]);
    if (outer && ringContains(outer, lon, lat)) return true;
  }
  return false;
}

/**
 * Official Gemeinde assignment for a point, or null when the WFS returns no
 * feature whose polygon contains the point (e.g. a point outside Germany, or a
 * schema/endpoint mismatch). Errors propagate to the caller, which renders an
 * honest module state.
 */
export async function getTerritorialAssignment(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<TerritorialAssignment | null> {
  const provider = getEffectiveProvider('bkg-vg250', ctx.config);
  // A small box around the point. The containing Gemeinde necessarily overlaps
  // any box around a point inside it; neighbours may also come back and are
  // disambiguated by the local point-in-polygon test. WFS 2.0 EPSG:4326 uses
  // lat,lon axis order (lower corner first).
  const eps = 0.02;
  const minLat = (coords.latitude - eps).toFixed(5);
  const minLon = (coords.longitude - eps).toFixed(5);
  const maxLat = (coords.latitude + eps).toFixed(5);
  const maxLon = (coords.longitude + eps).toFixed(5);
  const url =
    `${ctx.config.bkgWfsUrl}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(ctx.config.bkgWfsTypeName)}` +
    `&outputFormat=${encodeURIComponent('application/json')}&count=10` +
    `&srsName=${encodeURIComponent('urn:ogc:def:crs:EPSG::4326')}` +
    `&bbox=${minLat},${minLon},${maxLat},${maxLon},${encodeURIComponent('urn:ogc:def:crs:EPSG::4326')}`;
  const fingerprint = requestFingerprint({
    resource: 'vg250-gem',
    lat: coords.latitude.toFixed(3),
    lon: coords.longitude.toFixed(3),
  });
  const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
  const parsed = Vg250Response.safeParse(result.raw);
  if (!parsed.success) return null;

  // Prefer the feature whose polygon actually contains the point; fall back to
  // the single returned feature only when exactly one came back (a tight bbox
  // with one municipality), never guessing among several.
  const withGeom = parsed.data.features.filter(
    (
      f,
    ): f is typeof f & { geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] } } =>
      f.geometry != null,
  );
  const containing =
    withGeom.find((f) => geometryContains(f.geometry, coords)) ??
    (parsed.data.features.length === 1 ? parsed.data.features[0] : undefined);
  const props = containing?.properties;
  const ars = props?.ars ?? props?.ags;
  if (!ars || ars.length < 5) return null;
  // AGS is 8 digits; pad to the 12-digit ARS convention when needed.
  const fullArs = ars.length >= 12 ? ars : `${ars}${'0'.repeat(12 - ars.length)}`;
  return { ars: fullArs, municipalityName: props?.gen ?? null, raw: result };
}
