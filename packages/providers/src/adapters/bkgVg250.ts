/**
 * BKG VG250 — official territorial assignment of a point (WFS, GeoJSON).
 *
 * Returns the Gemeinde the point lies in, including its official ARS
 * (Amtlicher Regionalschlüssel). Mapped administrative context; used by the
 * NINA civil-protection module to query the correct district dashboard.
 */
import { z } from 'zod';
import { type Coordinates } from '@invisible-city/contracts';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, type AdapterContext, type RawResult } from '../runner.js';

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

/**
 * Official Gemeinde assignment for a point, or null when the WFS response
 * carries no feature/ARS (e.g. point outside Germany). Errors propagate to the
 * caller, which renders an honest module state.
 */
export async function getTerritorialAssignment(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<TerritorialAssignment | null> {
  const provider = getEffectiveProvider('bkg-vg250', ctx.config);
  const point = `POINT(${coords.longitude.toFixed(5)} ${coords.latitude.toFixed(5)})`;
  const url =
    `${ctx.config.bkgWfsUrl}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=vg250_gem&outputFormat=application/json&count=1` +
    `&cql_filter=${encodeURIComponent(`INTERSECTS(geom,${point})`)}`;
  const fingerprint = requestFingerprint({
    resource: 'vg250-gem',
    lat: coords.latitude.toFixed(3),
    lon: coords.longitude.toFixed(3),
  });
  const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
  const parsed = Vg250Response.safeParse(result.raw);
  if (!parsed.success) return null;
  const props = parsed.data.features[0]?.properties;
  const ars = props?.ars ?? props?.ags;
  if (!ars || ars.length < 5) return null;
  // AGS is 8 digits; pad to the 12-digit ARS convention when needed.
  const fullArs = ars.length >= 12 ? ars : `${ars}${'0'.repeat(12 - ars.length)}`;
  return { ars: fullArs, municipalityName: props?.gen ?? null, raw: result };
}
