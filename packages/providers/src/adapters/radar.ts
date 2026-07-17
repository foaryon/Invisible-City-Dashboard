/**
 * DWD precipitation radar (RADOLAN 1-km composite incl. 2-h nowcast), accessed
 * via the Bright Sky /radar endpoint (unofficial access layer, labelled as
 * such; attribution: Deutscher Wetterdienst).
 *
 * Reality rules:
 *  - the value is the 1-km GRID CELL containing the selected point — never a
 *    point measurement at the pin;
 *  - frames after retrieval time are nowcast and mode-discriminated 'forecast';
 *  - the documented unit (hundredths of mm per 5-minute frame) is converted to
 *    mm/5 min by the documented factor — conversion stated in the method.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type RadarContext,
  type RadarFrame,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

/** Half-width of the requested crop around the point, meters (small on purpose). */
const CROP_DISTANCE_M = 2000;

const RadarRecord = z.object({
  timestamp: z.string(),
  source: z.string().optional(),
  precipitation_5: z.array(z.array(z.number())),
});

const RadarResponse = z.object({
  radar: z.array(RadarRecord),
  latlon_position: z.object({ x: z.number(), y: z.number() }).optional(),
});

/** Pick the cell containing the point: source-provided pixel position, else crop centre. */
export function centerCellValue(
  grid: number[][],
  position: { x: number; y: number } | undefined,
): number | null {
  if (grid.length === 0) return null;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (cols === 0) return null;
  const y = Math.min(rows - 1, Math.max(0, Math.round(position?.y ?? (rows - 1) / 2)));
  const x = Math.min(cols - 1, Math.max(0, Math.round(position?.x ?? (cols - 1) / 2)));
  const value = grid[y]?.[x];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function getRadarContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<RadarContext>> {
  const provider = getEffectiveProvider('dwd-radar', ctx.config);
  try {
    const url =
      `${ctx.config.brightskyUrl}/radar?lat=${coords.latitude.toFixed(4)}` +
      `&lon=${coords.longitude.toFixed(4)}&distance=${CROP_DISTANCE_M}&format=plain`;
    const fingerprint = requestFingerprint({
      resource: 'radar',
      lat: coords.latitude.toFixed(2),
      lon: coords.longitude.toFixed(2),
    });
    const result = await fetchJsonWithCache(provider, fingerprint, url, ctx);
    const parsed = RadarResponse.safeParse(result.raw);
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

    const retrievedMs = new Date(result.retrievedAt).getTime();
    const frames: RadarFrame[] = parsed.data.radar.map((rec) => {
      const raw = centerCellValue(rec.precipitation_5, parsed.data.latlon_position);
      const frameMs = new Date(rec.timestamp).getTime();
      return {
        validAt: rec.timestamp,
        // Frames after retrieval time are RADOLAN nowcast → forecast, not observation.
        mode:
          Number.isFinite(frameMs) && frameMs > retrievedMs
            ? ('forecast' as const)
            : ('observed' as const),
        // Documented unit: hundredths of mm per 5-minute frame.
        precipitationMm: raw === null ? null : Math.round(raw) / 100,
      };
    });

    const source = parsed.data.radar.find((r) => r.source)?.source ?? null;
    const anyValue = frames.some((f) => f.precipitationMm !== null);

    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method:
        'DWD-Radarkomposit (RADOLAN, 1 km), Wert der Rasterzelle am gewählten Punkt; Quellwerte (Hundertstel mm je 5 min) per dokumentiertem Faktor in mm/5 min umgerechnet. Frames nach dem Abrufzeitpunkt sind Nowcast-PROGNOSE.',
      spatial: { kind: 'grid', resolutionKm: 1 },
      completeness: anyValue ? 'complete' : 'partial',
      retrievedAt: result.retrievedAt,
      ...(result.cacheAgeSeconds > 0 ? { cacheAgeSeconds: result.cacheAgeSeconds } : {}),
    });

    if (frames.length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: { source, resolutionKm: 1, frames: [] },
        evidence: [evidence],
        limitations: provider.knownLimitations,
        statusDetail: 'Die Quelle lieferte keine Radar-Frames für diesen Ausschnitt.',
        retrievedAt: result.retrievedAt,
      };
    }

    return {
      status: result.stale ? 'stale' : anyValue ? 'ok' : 'partial',
      demo: false,
      data: { source, resolutionKm: 1, frames },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(anyValue
        ? {}
        : { statusDetail: 'Radar-Frames vorhanden, aber ohne auswertbaren Zellwert.' }),
      retrievedAt: result.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<RadarContext>(err, provider.knownLimitations);
  }
}
