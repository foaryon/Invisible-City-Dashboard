/**
 * CAMS grid extraction (pure, testable core).
 *
 * Selects the nearest grid cell to a target point from a regular lat/lon grid.
 * The value is a REGIONAL grid value (~10 km cell), never downscaled or
 * interpolated to an address (§2.2, §8.2). The returned cell centre and its
 * distance from the target are surfaced so the UI can show the grid offset.
 */
export interface GridCell {
  value: number;
  cellLat: number;
  cellLon: number;
  latIndex: number;
  lonIndex: number;
}

function nearestIndex(coords: number[], target: number): number {
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const diff = Math.abs(coords[i]! - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

/**
 * Extract the nearest cell value from a flattened grid.
 * `values` is row-major over [latitude][longitude] (time/level already sliced).
 * Longitudes may be given in 0..360; the target is normalized to match.
 */
export function nearestGridValue(
  lats: number[],
  lons: number[],
  values: number[],
  target: { latitude: number; longitude: number },
): GridCell | null {
  if (lats.length === 0 || lons.length === 0) return null;
  if (values.length < lats.length * lons.length) return null;

  const lonIs0to360 = lons.some((l) => l > 180);
  const targetLon = lonIs0to360 && target.longitude < 0 ? target.longitude + 360 : target.longitude;

  const latIndex = nearestIndex(lats, target.latitude);
  const lonIndex = nearestIndex(lons, targetLon);
  const flat = latIndex * lons.length + lonIndex;
  const value = values[flat];
  if (value === undefined || !Number.isFinite(value)) return null;

  const cellLon = lons[lonIndex]!;
  return {
    value,
    cellLat: lats[latIndex]!,
    cellLon: cellLon > 180 ? cellLon - 360 : cellLon,
    latIndex,
    lonIndex,
  };
}

/** Approximate grid resolution in km from the latitude spacing (0.1° ≈ 11 km). */
export function gridResolutionKm(lats: number[]): number | null {
  if (lats.length < 2) return null;
  const deltaDeg = Math.abs(lats[1]! - lats[0]!);
  return Math.round(deltaDeg * 111.32);
}
