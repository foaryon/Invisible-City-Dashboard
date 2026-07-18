/**
 * DELFI GTFS static importer (§3.1.F, Stage 6).
 *
 * Reads a documented GTFS feed (a .zip of the standard *.txt tables) and loads
 * the columns needed for stop context and scheduled departures into SQLite.
 * This is a real GTFS ingestion, not a placeholder: the feed publisher/version
 * and validity window are preserved for Evidence, and service-calendar tables
 * are imported so "scheduled" departures respect the active service on a date.
 *
 * For the full nationwide DELFI feed a regional/filtered extract is recommended
 * (memory); see docs/decisions.md.
 */
import { readFileSync } from 'node:fs';
import AdmZip from 'adm-zip';
import { openSqlite, type SqliteDb } from '../sqlite.js';

export interface GtfsImportResult {
  stops: number;
  trips: number;
  stopTimes: number;
  routes: number;
  feedPublisher: string | null;
  feedVersion: string | null;
  feedStartDate: string | null;
  feedEndDate: string | null;
  importedAt: string;
}

type Row = Record<string, string>;

/**
 * Parse ONE RFC-4180 CSV record into fields (quotes, embedded commas, doubled
 * quote escapes). Embedded newlines are handled by the caller via
 * `hasOpenQuote` line joining.
 */
export function parseCsvRecord(record: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < record.length; i++) {
    const ch = record[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (record[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

/** True while a record continues on the next line (odd number of quotes so far). */
function hasOpenQuote(s: string): boolean {
  let quotes = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === '"') quotes++;
  return quotes % 2 === 1;
}

/**
 * Iterate the CSV rows of a zip entry WITHOUT materializing the whole table.
 *
 * The nationwide GTFS feed's `stop_times.txt` exceeds Node's maximum string
 * length (~512 MB) when decoded at once — `getData().toString()` threw
 * "Cannot create a string longer than 0x1fffffe8 characters", and a sync CSV
 * parse would additionally materialize millions of row objects. Lines are
 * therefore decoded individually from the decompressed buffer (constant
 * memory beyond the buffer itself); quoted embedded newlines are joined.
 */
function* iterateTable(zip: AdmZip, name: string): Generator<Row> {
  const entry = zip.getEntry(name);
  if (!entry) return;
  const buf = entry.getData();
  let pos = 0;
  const nextLine = (): string | null => {
    if (pos >= buf.length) return null;
    let nl = buf.indexOf(0x0a, pos);
    if (nl === -1) nl = buf.length;
    let end = nl;
    if (end > pos && buf[end - 1] === 0x0d) end--; // CRLF
    const line = buf.toString('utf8', pos, end);
    pos = nl + 1;
    return line;
  };
  const nextRecord = (): string | null => {
    let record = nextLine();
    if (record === null) return null;
    // RFC 4180: a quoted field may contain a line break — join until balanced.
    while (hasOpenQuote(record)) {
      const cont = nextLine();
      if (cont === null) break;
      record += '\n' + cont;
    }
    return record;
  };
  let headerLine = nextRecord();
  if (headerLine === null) return;
  if (headerLine.charCodeAt(0) === 0xfeff) headerLine = headerLine.slice(1); // BOM
  const header = parseCsvRecord(headerLine).map((h) => h.trim());
  let record: string | null;
  while ((record = nextRecord()) !== null) {
    if (record.length === 0) continue;
    const cols = parseCsvRecord(record);
    const row: Row = {};
    for (let i = 0; i < header.length; i++) row[header[i]!] = (cols[i] ?? '').trim();
    yield row;
  }
}

/** Small tables (feed_info) — convenience array form of iterateTable. */
function readTable(zip: AdmZip, name: string): Row[] {
  return [...iterateTable(zip, name)];
}

function createSchema(db: SqliteDb): void {
  db.exec(`
    DROP TABLE IF EXISTS stops;
    DROP TABLE IF EXISTS routes;
    DROP TABLE IF EXISTS trips;
    DROP TABLE IF EXISTS stop_times;
    DROP TABLE IF EXISTS calendar;
    DROP TABLE IF EXISTS calendar_dates;
    DROP TABLE IF EXISTS gtfs_meta;
    CREATE TABLE stops (
      stop_id TEXT PRIMARY KEY, stop_name TEXT, stop_lat REAL, stop_lon REAL
    );
    CREATE TABLE routes (
      route_id TEXT PRIMARY KEY, route_short_name TEXT, route_long_name TEXT, route_type INTEGER
    );
    CREATE TABLE trips (
      trip_id TEXT PRIMARY KEY, route_id TEXT, service_id TEXT, trip_headsign TEXT
    );
    CREATE TABLE stop_times (
      trip_id TEXT, stop_id TEXT, departure_time TEXT, departure_seconds INTEGER, stop_sequence INTEGER
    );
    CREATE TABLE calendar (
      service_id TEXT PRIMARY KEY,
      monday INTEGER, tuesday INTEGER, wednesday INTEGER, thursday INTEGER,
      friday INTEGER, saturday INTEGER, sunday INTEGER,
      start_date TEXT, end_date TEXT
    );
    CREATE TABLE calendar_dates (service_id TEXT, date TEXT, exception_type INTEGER);
    CREATE TABLE gtfs_meta (key TEXT PRIMARY KEY, value TEXT);
  `);
}

/** "HH:MM:SS" (GTFS times may exceed 24:00:00) → seconds since service midnight. */
export function gtfsTimeToSeconds(t: string): number | null {
  const m = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/**
 * Import a GTFS zip into a fresh SQLite database at `dbPath`.
 * `source` is either a filesystem path or a Buffer of the zip.
 */
export function importGtfs(source: string | Buffer, dbPath: string): GtfsImportResult {
  const buffer = typeof source === 'string' ? readFileSync(source) : source;
  const zip = new AdmZip(buffer);
  const db = openSqlite(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  createSchema(db);

  const insertStop = db.prepare(
    'INSERT OR REPLACE INTO stops (stop_id, stop_name, stop_lat, stop_lon) VALUES (?, ?, ?, ?)',
  );
  const insertRoute = db.prepare(
    'INSERT OR REPLACE INTO routes (route_id, route_short_name, route_long_name, route_type) VALUES (?, ?, ?, ?)',
  );
  const insertTrip = db.prepare(
    'INSERT OR REPLACE INTO trips (trip_id, route_id, service_id, trip_headsign) VALUES (?, ?, ?, ?)',
  );
  const insertStopTime = db.prepare(
    'INSERT INTO stop_times (trip_id, stop_id, departure_time, departure_seconds, stop_sequence) VALUES (?, ?, ?, ?, ?)',
  );
  const insertCalendar = db.prepare(
    `INSERT OR REPLACE INTO calendar
     (service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertCalDate = db.prepare(
    'INSERT INTO calendar_dates (service_id, date, exception_type) VALUES (?, ?, ?)',
  );
  const insertMeta = db.prepare('INSERT OR REPLACE INTO gtfs_meta (key, value) VALUES (?, ?)');

  const counts = { stops: 0, routes: 0, trips: 0, stopTimes: 0 };

  db.transaction(() => {
    for (const r of iterateTable(zip, 'stops.txt')) {
      const lat = Number(r['stop_lat']);
      const lon = Number(r['stop_lon']);
      if (!r['stop_id'] || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      insertStop.run(r['stop_id'], r['stop_name'] ?? '', lat, lon);
      counts.stops++;
    }
    for (const r of iterateTable(zip, 'routes.txt')) {
      if (!r['route_id']) continue;
      insertRoute.run(
        r['route_id'],
        r['route_short_name'] ?? '',
        r['route_long_name'] ?? '',
        Number.isFinite(Number(r['route_type'])) ? Number(r['route_type']) : null,
      );
      counts.routes++;
    }
    for (const r of iterateTable(zip, 'trips.txt')) {
      if (!r['trip_id']) continue;
      insertTrip.run(
        r['trip_id'],
        r['route_id'] ?? '',
        r['service_id'] ?? '',
        r['trip_headsign'] ?? '',
      );
      counts.trips++;
    }
    for (const r of iterateTable(zip, 'stop_times.txt')) {
      if (!r['trip_id'] || !r['stop_id']) continue;
      const dep = r['departure_time'] ?? '';
      insertStopTime.run(
        r['trip_id'],
        r['stop_id'],
        dep,
        gtfsTimeToSeconds(dep),
        Number.isFinite(Number(r['stop_sequence'])) ? Number(r['stop_sequence']) : null,
      );
      counts.stopTimes++;
    }
    for (const r of iterateTable(zip, 'calendar.txt')) {
      if (!r['service_id']) continue;
      insertCalendar.run(
        r['service_id'],
        Number(r['monday'] ?? 0),
        Number(r['tuesday'] ?? 0),
        Number(r['wednesday'] ?? 0),
        Number(r['thursday'] ?? 0),
        Number(r['friday'] ?? 0),
        Number(r['saturday'] ?? 0),
        Number(r['sunday'] ?? 0),
        r['start_date'] ?? '',
        r['end_date'] ?? '',
      );
    }
    for (const r of iterateTable(zip, 'calendar_dates.txt')) {
      if (!r['service_id'] || !r['date']) continue;
      insertCalDate.run(r['service_id'], r['date'], Number(r['exception_type'] ?? 0));
    }
    const feed = readTable(zip, 'feed_info.txt')[0] ?? {};
    insertMeta.run('feed_publisher', feed['feed_publisher_name'] ?? 'DELFI e.V.');
    insertMeta.run('feed_version', feed['feed_version'] ?? '');
    insertMeta.run('feed_start_date', feed['feed_start_date'] ?? '');
    insertMeta.run('feed_end_date', feed['feed_end_date'] ?? '');
    insertMeta.run('imported_at', new Date().toISOString());
  });

  db.exec('CREATE INDEX idx_stop_times_stop ON stop_times (stop_id);');
  db.exec('CREATE INDEX idx_stops_lat ON stops (stop_lat);');

  const meta = (key: string): string | null => {
    const row = db.prepare('SELECT value FROM gtfs_meta WHERE key = ?').get(key) as
      { value: string } | undefined;
    return row && row.value.length > 0 ? row.value : null;
  };
  const result: GtfsImportResult = {
    ...counts,
    feedPublisher: meta('feed_publisher'),
    feedVersion: meta('feed_version'),
    feedStartDate: meta('feed_start_date'),
    feedEndDate: meta('feed_end_date'),
    importedAt: meta('imported_at') ?? new Date().toISOString(),
  };
  db.close();
  return result;
}
