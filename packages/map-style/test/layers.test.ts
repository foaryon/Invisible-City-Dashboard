import { describe, it, expect } from 'vitest';
import {
  analyticalLayers,
  BASE_MAP_STYLE_URL,
  BASE_MAP_ATTRIBUTION,
  INITIAL_VIEW,
  GERMANY_BOUNDS,
  tokens,
} from '../src/index.js';

describe('analytical layer registry (§4.3)', () => {
  it('registers exactly the six V1 layers with unique ids', () => {
    const ids = analyticalLayers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(
      new Set(['weather', 'air-stations', 'air-model', 'transit', 'places', 'availability']),
    );
  });

  it('every layer declares source, spatial meaning, time, limitations and a legend', () => {
    for (const layer of analyticalLayers) {
      expect(layer.title.length).toBeGreaterThan(0);
      expect(layer.sourceNote.length).toBeGreaterThan(0);
      expect(layer.spatialMeaning.length).toBeGreaterThan(0);
      expect(layer.timeApplicability.length).toBeGreaterThan(0);
      expect(layer.limitations.length).toBeGreaterThan(0);
      expect(layer.legend.length).toBeGreaterThan(0);
      for (const item of layer.legend) {
        expect(item.swatch).toMatch(/^#/);
        expect(['circle', 'square', 'ring']).toContain(item.shape);
        expect(item.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('every V1 layer is enabled (CAMS is integrated, config-gated at runtime)', () => {
    for (const layer of analyticalLayers) expect(layer.enabled).toBe(true);
  });
});

describe('base map', () => {
  it('uses an advertising-free OSM base map with attribution', () => {
    expect(BASE_MAP_STYLE_URL).toContain('openfreemap.org');
    expect(BASE_MAP_ATTRIBUTION).toContain('OpenStreetMap');
  });

  it('centres on Germany with sane bounds', () => {
    expect(INITIAL_VIEW.center[0]).toBeGreaterThan(5);
    expect(INITIAL_VIEW.center[0]).toBeLessThan(16);
    expect(GERMANY_BOUNDS[0][1]).toBeLessThan(GERMANY_BOUNDS[1][1]);
  });
});

describe('design tokens', () => {
  it('exposes the pin, station and status colours', () => {
    for (const key of ['pinA', 'pinB', 'pinC', 'station', 'stationRegional', 'warning']) {
      expect(tokens[key as keyof typeof tokens]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
