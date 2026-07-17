/**
 * Read-only GTFS query layer over the imported SQLite database.
 * Provides nearest-stop lookup and calendar-aware scheduled departures.
 * Everything here is "scheduled" context — never presented as realtime.
 */
import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import { type Coordinates } from '@invisible-city/contracts';
import { distanceMeters } from '@invisible-city/evidence';

export interface GtfsStop {
  stopId: string;
  name: string;
  coordinates: Coordinates;
  distanceMeters: number;
}

export interface ScheduledDeparture {
  departureTime: string;
  routeName: string;
  headsign: string;
  mode: string;
}

export interface GtfsMeta {
  feedPublisher: string | null;
  feedVersion: string | null;
  feedStartDate: string | null;
  feedEndDate: string | null;
  importedAt: string | null;
}

/** GTFS route_type → German mode label (base + common extended types). */
export function routeTypeLabel(routeType: number | null): string {
  switch (routeType) {
    case 0:
    case 900:
      return 'Straßenbahn';
    case 1:
    case 400:
    case 401:
      return 'U-Bahn';
    case 2:
    case 100:
    case 106:
      return 'Zug';
    case 3:
    case 700:
    case 704:
      return 'Bus';
    case 4:
    case 1000:
      return 'Fähre';
    case 109:
      return 'S-Bahn';
    default:
      return 'ÖPNV';
  }
}

export class GtfsStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    if (!existsSync(dbPath)) throw new Error(`GTFS database not found at ${dbPath}`);
    this.db = new Database(dbPath, { readonly: true });
  }

  meta(): GtfsMeta {
    const get = (key: string): string | null => {
      const row = this.db.prepare('SELECT value FROM gtfs_meta WHERE key = ?').get(key) as
        { value: string } | undefined;
      return row && row.value.length > 0 ? row.value : null;
    };
    return {
      feedPublisher: get('feed_publisher'),
      feedVersion: get('feed_version'),
      feedStartDate: get('feed_start_date'),
      feedEndDate: get('feed_end_date'),
      importedAt: get('imported_at'),
    };
  }

  /** Nearest stops within a bounding box, ranked by great-circle distance. */
  nearestStops(coords: Coordinates, radiusMeters: number, limit: number): GtfsStop[] {
    const dLat = radiusMeters / 111_320;
    const dLon = radiusMeters / (111_320 * Math.cos((coords.latitude * Math.PI) / 180) || 1);
    const rows = this.db
      .prepare(
        `SELECT stop_id, stop_name, stop_lat, stop_lon FROM stops
         WHERE stop_lat BETWEEN ? AND ? AND stop_lon BETWEEN ? AND ?`,
      )
      .all(
        coords.latitude - dLat,
        coords.latitude + dLat,
        coords.longitude - dLon,
        coords.longitude + dLon,
      ) as Array<{ stop_id: string; stop_name: string; stop_lat: number; stop_lon: number }>;
    return rows
      .map((r) => {
        const c = { latitude: r.stop_lat, longitude: r.stop_lon };
        return {
          stopId: r.stop_id,
          name: r.stop_name,
          coordinates: c,
          distanceMeters: Math.round(distanceMeters(coords, c)),
        };
      })
      .filter((s) => s.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);
  }

  /** Service IDs active on a given YYYYMMDD date (calendar + calendar_dates). */
  activeServiceIds(yyyymmdd: string): Set<string> {
    const dow = new Date(
      Number(yyyymmdd.slice(0, 4)),
      Number(yyyymmdd.slice(4, 6)) - 1,
      Number(yyyymmdd.slice(6, 8)),
    ).getDay(); // 0=Sun
    const dowColumn = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ][dow];
    const active = new Set<string>();
    const calRows = this.db
      .prepare(
        `SELECT service_id FROM calendar
         WHERE ${dowColumn} = 1 AND start_date <= ? AND end_date >= ?`,
      )
      .all(yyyymmdd, yyyymmdd) as Array<{ service_id: string }>;
    for (const r of calRows) active.add(r.service_id);
    const exceptions = this.db
      .prepare('SELECT service_id, exception_type FROM calendar_dates WHERE date = ?')
      .all(yyyymmdd) as Array<{ service_id: string; exception_type: number }>;
    for (const e of exceptions) {
      if (e.exception_type === 1) active.add(e.service_id);
      else if (e.exception_type === 2) active.delete(e.service_id);
    }
    return active;
  }

  /**
   * Scheduled departures at a stop at/after `afterSeconds` (seconds since local
   * midnight) for services active on `yyyymmdd`.
   */
  scheduledDepartures(
    stopId: string,
    yyyymmdd: string,
    afterSeconds: number,
    limit: number,
  ): ScheduledDeparture[] {
    const active = [...this.activeServiceIds(yyyymmdd)];
    if (active.length === 0) return [];
    const placeholders = active.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT st.departure_time AS departure_time, r.route_short_name AS route_name,
                r.route_long_name AS route_long, r.route_type AS route_type,
                t.trip_headsign AS headsign
         FROM stop_times st
         JOIN trips t ON st.trip_id = t.trip_id
         JOIN routes r ON t.route_id = r.route_id
         WHERE st.stop_id = ? AND st.departure_seconds >= ? AND t.service_id IN (${placeholders})
         ORDER BY st.departure_seconds ASC
         LIMIT ?`,
      )
      .all(stopId, afterSeconds, ...active, limit) as Array<{
      departure_time: string;
      route_name: string | null;
      route_long: string | null;
      route_type: number | null;
      headsign: string | null;
    }>;
    return rows.map((r) => ({
      departureTime: r.departure_time,
      routeName: r.route_name || r.route_long || '',
      headsign: r.headsign ?? '',
      mode: routeTypeLabel(r.route_type),
    }));
  }

  close(): void {
    this.db.close();
  }
}
