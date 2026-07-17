/**
 * Thin SQLite layer over the Node built-in `node:sqlite` (DatabaseSync).
 *
 * Why: replacing the native better-sqlite3 module with the built-in engine
 * removes the project's only native dependency — faster installs, no build
 * toolchain in Docker, and it unlocks single-file standalone executables.
 * node:sqlite is stable-track since Node 24 (works on Node 22.13+ with an
 * ExperimentalWarning); see docs/decisions.md.
 *
 * The surface is intentionally tiny: exactly what the cache and the GTFS
 * store need (exec, prepared get/all/run, a transaction helper, close).
 */
import { DatabaseSync } from 'node:sqlite';

export type SqlValue = string | number | bigint | null;
export type SqlRow = Record<string, unknown>;

export interface Statement {
  run(...params: SqlValue[]): void;
  get(...params: SqlValue[]): SqlRow | undefined;
  all(...params: SqlValue[]): SqlRow[];
}

export interface SqliteDb {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  /** BEGIN … COMMIT around `fn`; ROLLBACK on throw. */
  transaction<T>(fn: () => T): T;
  close(): void;
}

export function openSqlite(path: string, opts?: { readonly?: boolean }): SqliteDb {
  const db = new DatabaseSync(path, opts?.readonly ? { readOnly: true } : {});
  return {
    exec: (sql) => db.exec(sql),
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        run: (...params) => void stmt.run(...params),
        get: (...params) => stmt.get(...params) as SqlRow | undefined,
        all: (...params) => stmt.all(...params) as SqlRow[],
      };
    },
    transaction<T>(fn: () => T): T {
      db.exec('BEGIN');
      try {
        const out = fn();
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    close: () => db.close(),
  };
}
