import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { importGtfs, gtfsTimeToSeconds } from '../src/gtfs/import.js';
import { GtfsStore, routeTypeLabel } from '../src/gtfs/query.js';
import { summarizeRealtime } from '../src/gtfs/realtime.js';

const tmp = mkdtempSync(join(tmpdir(), 'ic-gtfs-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function buildFeed(): Buffer {
  const zip = new AdmZip();
  const add = (name: string, content: string) => zip.addFile(name, Buffer.from(content, 'utf8'));
  add(
    'stops.txt',
    'stop_id,stop_name,stop_lat,stop_lon\n' +
      'S1,Rotes Rathaus,52.51930,13.40940\n' +
      'S2,Weit Weg,53.00000,14.00000\n',
  );
  add('routes.txt', 'route_id,route_short_name,route_long_name,route_type\nR1,U5,Linie U5,1\n');
  add('trips.txt', 'route_id,service_id,trip_id,trip_headsign\nR1,WK,T1,Hönow\n');
  add(
    'stop_times.txt',
    'trip_id,arrival_time,departure_time,stop_id,stop_sequence\n' +
      'T1,08:05:00,08:05:00,S1,1\n' +
      'T1,08:20:00,08:20:00,S2,2\n',
  );
  add(
    'calendar.txt',
    'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n' +
      'WK,1,1,1,1,1,0,0,20260101,20261231\n',
  );
  add('calendar_dates.txt', 'service_id,date,exception_type\n');
  add(
    'feed_info.txt',
    'feed_publisher_name,feed_publisher_url,feed_lang,feed_version\n' +
      'DELFI e.V.,https://www.opendata-oepnv.de,de,2026-07-13\n',
  );
  return zip.toBuffer();
}

describe('GTFS time parsing', () => {
  it('parses HH:MM:SS incl. after-midnight (>24h)', () => {
    expect(gtfsTimeToSeconds('08:05:00')).toBe(29100);
    expect(gtfsTimeToSeconds('25:30:00')).toBe(91800);
    expect(gtfsTimeToSeconds('nope')).toBeNull();
  });
});

describe('GTFS static import + query (real pipeline)', () => {
  const dbPath = join(tmp, 'feed.sqlite');
  const result = importGtfs(buildFeed(), dbPath);

  it('imports the documented tables and preserves feed metadata', () => {
    expect(result.stops).toBe(2);
    expect(result.trips).toBe(1);
    expect(result.stopTimes).toBe(2);
    expect(result.feedPublisher).toBe('DELFI e.V.');
    expect(result.feedVersion).toBe('2026-07-13');
  });

  it('finds the nearest stop by real distance, not the far one', () => {
    const store = new GtfsStore(dbPath);
    const stops = store.nearestStops({ latitude: 52.5201, longitude: 13.405 }, 800, 5);
    expect(stops[0]!.stopId).toBe('S1');
    expect(stops.find((s) => s.stopId === 'S2')).toBeUndefined();
    store.close();
  });

  it('returns scheduled departures only for services active on the date', () => {
    const store = new GtfsStore(dbPath);
    // 2026-07-17 is a Friday → service WK active.
    const friday = store.scheduledDepartures('S1', '20260717', 28800, 4);
    expect(friday).toHaveLength(1);
    expect(friday[0]!.departureTime).toBe('08:05:00');
    expect(friday[0]!.mode).toBe('U-Bahn');
    // 2026-07-19 is a Sunday → WK not active → no departures.
    const sunday = store.scheduledDepartures('S1', '20260719', 28800, 4);
    expect(sunday).toHaveLength(0);
    store.close();
  });

  it('excludes departures before the requested time', () => {
    const store = new GtfsStore(dbPath);
    const afterNine = store.scheduledDepartures('S1', '20260717', 9 * 3600, 4);
    expect(afterNine).toHaveLength(0);
    store.close();
  });
});

describe('GTFS route type labels', () => {
  it('maps common route types to German mode labels', () => {
    expect(routeTypeLabel(1)).toBe('U-Bahn');
    expect(routeTypeLabel(3)).toBe('Bus');
    expect(routeTypeLabel(109)).toBe('S-Bahn');
    expect(routeTypeLabel(999)).toBe('ÖPNV');
  });
});

describe('GTFS-Realtime summary (real protobuf decode)', () => {
  const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;

  it('summarizes trip-update delays and alerts for nearby stops', () => {
    const msg = FeedMessage.fromObject({
      header: { gtfsRealtimeVersion: '2.0', timestamp: 1_800_000_000 },
      entity: [
        {
          id: '1',
          tripUpdate: {
            trip: { routeId: 'R1' },
            stopTimeUpdate: [{ stopId: 'S1', departure: { delay: 180 } }],
          },
        },
        {
          id: '2',
          alert: {
            informedEntity: [{ stopId: 'S1' }],
            headerText: { translation: [{ text: 'Störung U5', language: 'de' }] },
          },
        },
        {
          id: '3',
          tripUpdate: {
            trip: { routeId: 'R9' },
            stopTimeUpdate: [{ stopId: 'OTHER', departure: { delay: 60 } }],
          },
        },
      ],
    });
    // Round-trip through encode/decode to exercise the real protobuf path.
    const decoded = FeedMessage.decode(FeedMessage.encode(msg).finish());
    const summary = summarizeRealtime(decoded, new Set(['S1']));
    expect(summary.updatesForStops).toHaveLength(1);
    expect(summary.updatesForStops[0]!.delaySeconds).toBe(180);
    expect(summary.alertsForStops[0]!.headerText).toBe('Störung U5');
    expect(summary.feedTimestamp).toBe(new Date(1_800_000_000 * 1000).toISOString());
  });

  it('does not report updates for stops outside the nearby set (absence ≠ normal)', () => {
    const msg = FeedMessage.fromObject({
      header: { gtfsRealtimeVersion: '2.0' },
      entity: [
        {
          id: '1',
          tripUpdate: { trip: {}, stopTimeUpdate: [{ stopId: 'FAR', departure: { delay: 300 } }] },
        },
      ],
    });
    const summary = summarizeRealtime(msg, new Set(['S1']));
    expect(summary.updatesForStops).toHaveLength(0);
  });
});
