import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSqliteCache, createMemoryCache, requestFingerprint } from '../src/cache.js';

const tmp = mkdtempSync(join(tmpdir(), 'ic-cache-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('requestFingerprint', () => {
  it('is stable and order-independent', () => {
    expect(requestFingerprint({ a: 1, b: 'x' })).toBe(requestFingerprint({ b: 'x', a: 1 }));
  });
  it('changes with the parameters', () => {
    expect(requestFingerprint({ lat: 52.5 })).not.toBe(requestFingerprint({ lat: 52.6 }));
  });
});

describe.each([
  ['memory', () => createMemoryCache()],
  ['sqlite', () => createSqliteCache(join(tmp, `c-${Math.random().toString(36).slice(2)}.sqlite`))],
])('%s cache', (_name, make) => {
  it('round-trips a payload and reports a fresh entry within TTL', () => {
    const cache = make();
    cache.set('p1', 'fp1', 'v1', { hello: 'world' });
    const entry = cache.get<{ hello: string }>('p1', 'fp1', 600);
    expect(entry).not.toBeNull();
    expect(entry!.payload.hello).toBe('world');
    expect(entry!.schemaVersion).toBe('v1');
    expect(entry!.ageSeconds).toBeGreaterThanOrEqual(0);
    expect(entry!.stale).toBe(false);
    cache.close();
  });

  it('returns null for an unknown key', () => {
    const cache = make();
    expect(cache.get('p1', 'missing', 600)).toBeNull();
    cache.close();
  });

  it('marks an entry stale once age exceeds the TTL (ttl 0 = immediately stale after a second)', () => {
    const cache = make();
    cache.set('p1', 'fp2', 'v1', { n: 1 });
    // With a negative-equivalent check: age (>=0) > ttl (-1) is always true.
    const entry = cache.get('p1', 'fp2', -1);
    expect(entry!.stale).toBe(true);
    cache.close();
  });

  it('overwrites on repeated set (latest wins)', () => {
    const cache = make();
    cache.set('p1', 'fp3', 'v1', { n: 1 });
    cache.set('p1', 'fp3', 'v2', { n: 2 });
    const entry = cache.get<{ n: number }>('p1', 'fp3', 600);
    expect(entry!.payload.n).toBe(2);
    expect(entry!.schemaVersion).toBe('v2');
    cache.close();
  });
});
