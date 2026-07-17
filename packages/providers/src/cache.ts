/**
 * Source-aware response cache (§7.4).
 *
 * Stores retrieval time, provider ID, request fingerprint, schema version and
 * response hash. Cache age is always surfaced (never presented as live
 * freshness); a stale entry is only served visibly labelled. No user-location
 * history is stored — keys are request fingerprints of provider queries.
 */
import { createHash } from 'node:crypto';
import { openSqlite } from './sqlite.js';

export interface CacheEntry<T> {
  payload: T;
  retrievedAt: string;
  ageSeconds: number;
  stale: boolean;
  providerId: string;
  schemaVersion: string;
}

export interface ResponseCache {
  get<T>(providerId: string, fingerprint: string, ttlSeconds: number): CacheEntry<T> | null;
  set(providerId: string, fingerprint: string, schemaVersion: string, payload: unknown): void;
  close(): void;
}

export function requestFingerprint(parts: Record<string, string | number | undefined>): string {
  const canonical = Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k] ?? ''}`)
    .join('&');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

export function createSqliteCache(dbPath: string): ResponseCache {
  const db = openSqlite(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS response_cache (
      provider_id TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      response_hash TEXT NOT NULL,
      payload TEXT NOT NULL,
      retrieved_at TEXT NOT NULL,
      PRIMARY KEY (provider_id, fingerprint)
    );
  `);
  const getStmt = db.prepare(
    'SELECT payload, retrieved_at, schema_version FROM response_cache WHERE provider_id = ? AND fingerprint = ?',
  );
  const setStmt = db.prepare(`
    INSERT INTO response_cache (provider_id, fingerprint, schema_version, response_hash, payload, retrieved_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider_id, fingerprint) DO UPDATE SET
      schema_version = excluded.schema_version,
      response_hash = excluded.response_hash,
      payload = excluded.payload,
      retrieved_at = excluded.retrieved_at
  `);

  return {
    get<T>(providerId: string, fingerprint: string, ttlSeconds: number): CacheEntry<T> | null {
      const row = getStmt.get(providerId, fingerprint) as
        { payload: string; retrieved_at: string; schema_version: string } | undefined;
      if (!row) return null;
      const ageSeconds = Math.max(
        0,
        Math.round((Date.now() - new Date(row.retrieved_at).getTime()) / 1000),
      );
      return {
        payload: JSON.parse(row.payload) as T,
        retrievedAt: row.retrieved_at,
        ageSeconds,
        stale: ageSeconds > ttlSeconds,
        providerId,
        schemaVersion: row.schema_version,
      };
    },
    set(providerId, fingerprint, schemaVersion, payload) {
      const json = JSON.stringify(payload);
      const hash = createHash('sha256').update(json).digest('hex');
      setStmt.run(providerId, fingerprint, schemaVersion, hash, json, new Date().toISOString());
    },
    close() {
      db.close();
    },
  };
}

/** In-memory cache with identical semantics — used by tests. */
export function createMemoryCache(): ResponseCache {
  const store = new Map<string, { payload: unknown; retrievedAt: string; schemaVersion: string }>();
  return {
    get<T>(providerId: string, fingerprint: string, ttlSeconds: number): CacheEntry<T> | null {
      const row = store.get(`${providerId}:${fingerprint}`);
      if (!row) return null;
      const ageSeconds = Math.max(
        0,
        Math.round((Date.now() - new Date(row.retrievedAt).getTime()) / 1000),
      );
      return {
        payload: row.payload as T,
        retrievedAt: row.retrievedAt,
        ageSeconds,
        stale: ageSeconds > ttlSeconds,
        providerId,
        schemaVersion: row.schemaVersion,
      };
    },
    set(providerId, fingerprint, schemaVersion, payload) {
      store.set(`${providerId}:${fingerprint}`, {
        payload: JSON.parse(JSON.stringify(payload)),
        retrievedAt: new Date().toISOString(),
        schemaVersion,
      });
    },
    close() {
      store.clear();
    },
  };
}
