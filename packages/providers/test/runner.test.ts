import { describe, it, expect } from 'vitest';
import { type ProviderManifestEntry } from '@invisible-city/contracts';
import {
  createMemoryCache,
  requestFingerprint,
  type ResponseCache,
  type CacheEntry,
} from '../src/cache.js';
import { fetchJsonWithCache, ProviderNotLiveError, errorEnvelope } from '../src/runner.js';
import { getProvider, providerManifest, isLiveAllowed } from '../src/manifest.js';

function testProvider(overrides: Partial<ProviderManifestEntry> = {}): ProviderManifestEntry {
  return {
    ...getProvider('dwd-brightsky'),
    providerId: 'test-runner-provider',
    cachePolicy: { ttlSeconds: 0, rationale: 'test' },
    ...overrides,
  };
}

describe('provider manifest gate (§5.2)', () => {
  it('non-verified providers cannot serve live data', async () => {
    const provider = testProvider({ status: 'proposed' });
    await expect(
      fetchJsonWithCache(provider, 'fp', 'https://example.org', { cache: createMemoryCache() }),
    ).rejects.toBeInstanceOf(ProviderNotLiveError);
  });

  it('CAMS and DELFI are proposed (not live) in this build', () => {
    expect(isLiveAllowed('cams-eu-airquality')).toBe(false);
    expect(isLiveAllowed('delfi-gtfs')).toBe(false);
    expect(isLiveAllowed('delfi-gtfs-rt')).toBe(false);
  });

  it('every manifest entry validates and carries attribution + review date', () => {
    for (const p of providerManifest) {
      expect(p.attributionText.length).toBeGreaterThan(3);
      expect(p.reviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('maps the not-live error to a configuration-required envelope', () => {
    const env = errorEnvelope(new ProviderNotLiveError('cams-eu-airquality', 'proposed'));
    expect(env.status).toBe('configuration-required');
    expect(env.data).toBeNull();
  });
});

describe('stale-cache policy (§3.1.J: last good response only visibly labelled)', () => {
  it('serves the last good response flagged stale when the source fails', async () => {
    const provider = testProvider();
    // A cache that always reports its entry as stale — isolates the runner's
    // stale-serving decision from real-clock rounding at TTL boundaries.
    const staleCache: ResponseCache = {
      get<T>(): CacheEntry<T> | null {
        return {
          payload: { hello: 'world' } as unknown as T,
          retrievedAt: new Date(Date.now() - 3600_000).toISOString(),
          ageSeconds: 3600,
          stale: true,
          providerId: provider.providerId,
          schemaVersion: provider.validationSchemaVersion,
        };
      },
      set() {},
      close() {},
    };
    const second = await fetchJsonWithCache<{ hello: string }>(
      provider,
      'fp1',
      'https://example.org/x',
      { cache: staleCache, fetchImpl: () => Promise.reject(new TypeError('source down')) },
    );
    expect(second.stale).toBe(true);
    expect(second.raw.hello).toBe('world');
    expect(second.cacheAgeSeconds).toBe(3600);
  });

  it('throws (→ source-error envelope) when the source fails and no cache exists', async () => {
    const provider = testProvider();
    await expect(
      fetchJsonWithCache(provider, 'fp2', 'https://example.org/y', {
        cache: createMemoryCache(),
        fetchImpl: () => Promise.reject(new TypeError('down')),
      }),
    ).rejects.toThrow();
  });
});

describe('request fingerprints', () => {
  it('are order-independent and stable', () => {
    expect(requestFingerprint({ a: 1, b: 'x' })).toBe(requestFingerprint({ b: 'x', a: 1 }));
    expect(requestFingerprint({ a: 1 })).not.toBe(requestFingerprint({ a: 2 }));
  });
});
