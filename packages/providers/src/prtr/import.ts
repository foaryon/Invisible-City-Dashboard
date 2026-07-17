/**
 * Thru.de / PRTR CSV importer (§ reported industrial releases).
 *
 * Reads a downloaded Thru.de data export (CSV) into SQLite for local radius
 * queries. Column detection is documented and DETERMINISTIC: each logical field
 * has a list of accepted header patterns; if a required field cannot be
 * identified the import fails VISIBLY, listing the headers found — the importer
 * never guesses silently. German decimal commas are normalized by documented
 * rule; rows with implausible coordinates are rejected, not repaired.
 */
import { readFileSync, statSync, existsSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { openSqlite, type SqliteDb } from '../sqlite.js';

export interface PrtrImportResult {
  facilities: number;
  releases: number;
  reportingYears: number[];
  importedAt: string;
}

type Row = Record<string, string>;

/** Accepted header patterns per logical field (documented in docs/data-sources.md). */
const COLUMN_PATTERNS: Record<string, RegExp[]> = {
  name: [/betriebseinrichtung/i, /^name/i, /facility.*name/i, /betriebsst/i],
  lat: [/breite/i, /latitude/i, /^lat$/i],
  lon: [/l[äa]nge/i, /longitude/i, /^lon$/i, /^lng$/i],
  year: [/berichtsjahr/i, /^jahr$/i, /year/i],
  pollutant: [/schadstoff/i, /pollutant/i],
  amount: [/menge/i, /freisetzung.*(kg|menge)/i, /gesamt.*kg/i, /amount/i, /quantity/i],
  medium: [/medium/i, /kompartiment/i, /umweltmedium/i],
  activity: [/t[äa]tigkeit/i, /branche/i, /activity/i, /haupttätigkeit/i],
  id: [/betriebs.*(id|nr|nummer)/i, /facility.*id/i, /^id$/i, /kennnummer/i],
};

function findColumn(headers: string[], field: string): string | null {
  for (const pattern of COLUMN_PATTERNS[field] ?? []) {
    const hit = headers.find((h) => pattern.test(h));
    if (hit) return hit;
  }
  return null;
}

/** German decimal comma → dot; returns null for non-numeric input (never 0). */
export function parseGermanNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const cleaned = raw.trim().replace(/\./g, (m, off: number, s: string) =>
    // Keep a dot only when it is already the decimal separator (no comma present).
    s.includes(',') ? '' : m,
  );
  const normalized = cleaned.replace(',', '.');
  if (normalized.length === 0) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function createSchema(db: SqliteDb): void {
  db.exec(`
    DROP TABLE IF EXISTS facilities;
    DROP TABLE IF EXISTS releases;
    DROP TABLE IF EXISTS prtr_meta;
    CREATE TABLE facilities (
      facility_id TEXT PRIMARY KEY, name TEXT, activity TEXT, lat REAL, lon REAL
    );
    CREATE TABLE releases (
      facility_id TEXT, year INTEGER, pollutant TEXT, amount_kg REAL, medium TEXT
    );
    CREATE TABLE prtr_meta (key TEXT PRIMARY KEY, value TEXT);
  `);
}

export class PrtrImportError extends Error {
  constructor(
    message: string,
    public readonly headersFound: string[],
  ) {
    super(message);
    this.name = 'PrtrImportError';
  }
}

/**
 * Import a Thru.de CSV export into SQLite at `dbPath`. When the CSV came from
 * a configured download URL, pass it as `sourceUrl` so the refresh policy can
 * detect URL changes and import age.
 */
export function importPrtr(
  source: string | Buffer,
  dbPath: string,
  sourceUrl?: string,
): PrtrImportResult {
  const text = (typeof source === 'string' ? readFileSync(source) : source).toString('utf8');
  // Thru.de exports use semicolons; fall back to comma when none are present.
  const firstLine = text.slice(0, text.indexOf('\n'));
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= 1 ? ';' : ',';
  const rows = parse(text, {
    columns: true,
    delimiter,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    trim: true,
  }) as Row[];
  if (rows.length === 0) throw new PrtrImportError('CSV enthält keine Datenzeilen.', []);

  const headers = Object.keys(rows[0]!);
  const col = {
    name: findColumn(headers, 'name'),
    lat: findColumn(headers, 'lat'),
    lon: findColumn(headers, 'lon'),
    year: findColumn(headers, 'year'),
    pollutant: findColumn(headers, 'pollutant'),
    amount: findColumn(headers, 'amount'),
    medium: findColumn(headers, 'medium'),
    activity: findColumn(headers, 'activity'),
    id: findColumn(headers, 'id'),
  };
  const missing = (['name', 'lat', 'lon', 'year', 'pollutant', 'amount'] as const).filter(
    (f) => !col[f],
  );
  if (missing.length > 0) {
    throw new PrtrImportError(
      `Pflichtspalten nicht erkannt: ${missing.join(', ')}. Gefundene Spalten: ${headers.join(' | ')}`,
      headers,
    );
  }

  const db = openSqlite(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  createSchema(db);
  const insertFacility = db.prepare(
    'INSERT OR REPLACE INTO facilities (facility_id, name, activity, lat, lon) VALUES (?, ?, ?, ?, ?)',
  );
  const insertRelease = db.prepare(
    'INSERT INTO releases (facility_id, year, pollutant, amount_kg, medium) VALUES (?, ?, ?, ?, ?)',
  );
  const insertMeta = db.prepare('INSERT OR REPLACE INTO prtr_meta (key, value) VALUES (?, ?)');

  const facilityIds = new Set<string>();
  const years = new Set<number>();
  let releases = 0;

  db.transaction(() => {
    for (const r of rows) {
      const name = r[col.name!]?.trim();
      const lat = parseGermanNumber(r[col.lat!]);
      const lon = parseGermanNumber(r[col.lon!]);
      const year = parseGermanNumber(r[col.year!]);
      const pollutant = r[col.pollutant!]?.trim();
      if (!name || !pollutant || lat === null || lon === null || year === null) continue;
      // Plausibility bounds for Germany; out-of-range rows are rejected, not repaired.
      if (lat < 47 || lat > 55.2 || lon < 5.5 || lon > 15.2) continue;
      const facilityId =
        (col.id ? r[col.id]?.trim() : undefined) || `${name}@${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (!facilityIds.has(facilityId)) {
        insertFacility.run(
          facilityId,
          name,
          (col.activity ? r[col.activity]?.trim() : undefined) || null,
          lat,
          lon,
        );
        facilityIds.add(facilityId);
      }
      insertRelease.run(
        facilityId,
        Math.trunc(year),
        pollutant,
        parseGermanNumber(r[col.amount!]),
        (col.medium ? r[col.medium]?.trim() : undefined) || 'unbekannt',
      );
      years.add(Math.trunc(year));
      releases++;
    }
    insertMeta.run('imported_at', new Date().toISOString());
    insertMeta.run('source_url', sourceUrl ?? '');
  });
  db.exec('CREATE INDEX idx_facilities_lat ON facilities (lat);');
  db.exec('CREATE INDEX idx_releases_facility ON releases (facility_id);');
  db.close();

  return {
    facilities: facilityIds.size,
    releases,
    reportingYears: [...years].sort((a, b) => a - b),
    importedAt: new Date().toISOString(),
  };
}

/** True when the SQLite import is missing or older than the CSV export. */
export function prtrImportNeeded(csvPath: string, dbPath: string): boolean {
  if (!existsSync(dbPath)) return true;
  try {
    return statSync(csvPath).mtimeMs > statSync(dbPath).mtimeMs;
  } catch {
    return true;
  }
}

/**
 * Refresh policy for URL-sourced imports: re-download when the import is
 * missing, was built from a different URL, or is older than `maxAgeDays`
 * (PRTR is an ANNUAL dataset — a monthly re-check is more than enough).
 */
export function prtrUrlImportNeeded(dbPath: string, url: string, maxAgeDays = 30): boolean {
  if (!existsSync(dbPath)) return true;
  try {
    const db = openSqlite(dbPath, { readonly: true });
    try {
      const meta = (key: string): string | undefined =>
        (
          db.prepare('SELECT value FROM prtr_meta WHERE key = ?').get(key) as
            { value: string } | undefined
        )?.value;
      const importedAt = meta('imported_at');
      if (!importedAt || meta('source_url') !== url) return true;
      return Date.now() - new Date(importedAt).getTime() > maxAgeDays * 86_400_000;
    } finally {
      db.close();
    }
  } catch {
    return true;
  }
}

export interface PrtrFacilityRow {
  facility_id: string;
  name: string;
  activity: string | null;
  lat: number;
  lon: number;
}

export interface PrtrReleaseRow {
  year: number;
  pollutant: string;
  amount_kg: number | null;
  medium: string;
}

/** Facilities inside a bounding box (radius filtering happens in the adapter). */
export function queryFacilities(
  dbPath: string,
  bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number },
): Array<PrtrFacilityRow & { releases: PrtrReleaseRow[] }> {
  const db = openSqlite(dbPath, { readonly: true });
  try {
    const facilities = db
      .prepare(
        'SELECT facility_id, name, activity, lat, lon FROM facilities WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?',
      )
      .all(
        bounds.latMin,
        bounds.latMax,
        bounds.lonMin,
        bounds.lonMax,
      ) as unknown as PrtrFacilityRow[];
    const releaseStmt = db.prepare(
      'SELECT year, pollutant, amount_kg, medium FROM releases WHERE facility_id = ? ORDER BY year DESC, pollutant',
    );
    return facilities.map((f) => ({
      ...f,
      releases: releaseStmt.all(f.facility_id) as unknown as PrtrReleaseRow[],
    }));
  } finally {
    db.close();
  }
}
