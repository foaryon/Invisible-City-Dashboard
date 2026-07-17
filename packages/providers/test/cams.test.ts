import { describe, it, expect } from 'vitest';
import { nearestGridValue, gridResolutionKm } from '../src/cams/extract.js';

describe('CAMS grid extraction (regional cell, never address-level)', () => {
  // 3x3 grid, 0.1° spacing around Berlin.
  const lats = [52.4, 52.5, 52.6];
  const lons = [13.3, 13.4, 13.5];
  // row-major [lat][lon]
  const values = [
    10,
    11,
    12, // lat 52.4
    13,
    14,
    15, // lat 52.5
    16,
    17,
    18, // lat 52.6
  ];

  it('selects the nearest cell to the target point', () => {
    const cell = nearestGridValue(lats, lons, values, { latitude: 52.52, longitude: 13.41 });
    expect(cell).not.toBeNull();
    expect(cell!.cellLat).toBe(52.5);
    expect(cell!.cellLon).toBe(13.4);
    expect(cell!.value).toBe(14);
  });

  it('handles 0..360 longitude grids by normalizing the target', () => {
    const lons360 = [349.9, 350.0, 350.1];
    const cell = nearestGridValue(lats, lons360, values, { latitude: 52.5, longitude: -9.92 });
    expect(cell).not.toBeNull();
    // -9.92 → 350.08 → nearest 350.1 (index 2); returned lon normalized back to <180.
    expect(cell!.cellLon).toBeCloseTo(-9.9, 5);
  });

  it('returns null on a non-finite cell value instead of inventing one', () => {
    const withNaN = [...values];
    withNaN[4] = NaN;
    expect(nearestGridValue(lats, lons, withNaN, { latitude: 52.5, longitude: 13.4 })).toBeNull();
  });

  it('rejects a grid smaller than declared', () => {
    expect(nearestGridValue(lats, lons, [1, 2, 3], { latitude: 52.5, longitude: 13.4 })).toBeNull();
  });

  it('derives an approximate resolution in km from latitude spacing', () => {
    expect(gridResolutionKm(lats)).toBe(11); // 0.1° ≈ 11 km
    expect(gridResolutionKm([52.5])).toBeNull();
  });
});
