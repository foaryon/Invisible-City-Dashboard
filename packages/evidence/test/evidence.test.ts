import { describe, it, expect } from 'vitest';
import { makeEvidence, isStale, withCacheAge } from '../src/evidence.js';
import { distanceMeters, formatDistanceGerman, stationSpatialRole } from '../src/geo.js';
import { type ProviderManifestEntry } from '@invisible-city/contracts';

const provider: ProviderManifestEntry = {
  providerId: 'test-provider',
  displayName: 'Testquelle',
  institution: 'Testinstitut',
  sourceCategory: 'federal-authority',
  originalSourceUrl: 'https://example.org',
  technicalEndpoint: 'https://example.org/api',
  accessMethod: 'HTTPS GET',
  license: 'CC BY 4.0',
  attributionText: 'Quelle: Testinstitut',
  coverage: 'Deutschland',
  updateCadence: 'stündlich',
  supportedDataModes: ['observed'],
  geographicSemantics: ['station'],
  validationSchemaVersion: 'test-v1',
  cachePolicy: { ttlSeconds: 600, rationale: 'Test' },
  status: 'verified',
  reviewDate: '2026-07-16',
  knownLimitations: ['Bekannte Grenze der Quelle.'],
  toVerify: [],
};

describe('makeEvidence', () => {
  it('carries provider identity, license and attribution from the manifest', () => {
    const e = makeEvidence(provider, {
      mode: 'observed',
      method: 'Testmethode',
      spatial: { kind: 'station', stationId: 'S1', distanceMeters: 1400 },
      completeness: 'provisional',
    });
    expect(e.providerId).toBe('test-provider');
    expect(e.attribution).toBe('Quelle: Testinstitut');
    expect(e.license).toBe('CC BY 4.0');
    expect(e.limitations).toContain('Bekannte Grenze der Quelle.');
    expect(e.schemaVersion).toBe('test-v1');
  });

  it('merges provider limitations with call-specific limitations (never drops them)', () => {
    const e = makeEvidence(provider, {
      mode: 'observed',
      method: 'Testmethode',
      spatial: { kind: 'unknown' },
      completeness: 'unknown',
      limitations: ['Zusätzliche Einschränkung.'],
    });
    expect(e.limitations).toEqual(['Bekannte Grenze der Quelle.', 'Zusätzliche Einschränkung.']);
  });

  it('preserves the raw source time string when provided', () => {
    const e = makeEvidence(provider, {
      mode: 'observed',
      method: 'Testmethode',
      spatial: { kind: 'unknown' },
      completeness: 'unknown',
      sourceTimeRaw: '2026-07-16 12:00:00',
    });
    expect(e.sourceTimeRaw).toBe('2026-07-16 12:00:00');
  });
});

describe('cache staleness (stale only shown visibly labelled)', () => {
  it('is stale strictly beyond TTL', () => {
    expect(isStale(599, 600)).toBe(false);
    expect(isStale(600, 600)).toBe(false);
    expect(isStale(601, 600)).toBe(true);
    expect(isStale(undefined, 600)).toBe(false);
  });

  it('withCacheAge annotates without mutating', () => {
    const e = makeEvidence(provider, {
      mode: 'observed',
      method: 'm',
      spatial: { kind: 'unknown' },
      completeness: 'unknown',
    });
    const aged = withCacheAge(e, 120);
    expect(aged.cacheAgeSeconds).toBe(120);
    expect(e.cacheAgeSeconds).toBeUndefined();
  });
});

describe('station distance logic', () => {
  it('computes plausible distances (Berlin Mitte → Tempelhof ≈ 6 km)', () => {
    const d = distanceMeters(
      { latitude: 52.52, longitude: 13.405 },
      { latitude: 52.4675, longitude: 13.4021 },
    );
    expect(d).toBeGreaterThan(5500);
    expect(d).toBeLessThan(6500);
  });

  it('formats German distance labels', () => {
    expect(formatDistanceGerman(350)).toBe('350 m');
    expect(formatDistanceGerman(1400)).toBe('1,4 km');
    expect(formatDistanceGerman(18000)).toBe('18 km');
  });

  it('labels stations beyond 5 km as regional reference, never local', () => {
    expect(stationSpatialRole(1400)).toBe('nearby');
    expect(stationSpatialRole(18000)).toBe('regional');
  });
});
