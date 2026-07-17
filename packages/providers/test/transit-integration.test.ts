import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { importGtfs } from '../src/gtfs/import.js';
import { loadConfig } from '../src/config.js';
import { createMemoryCache } from '../src/cache.js';
import { getTransitContext } from '../src/adapters/transit.js';

const tmp = mkdtempSync(join(tmpdir(), 'ic-transit-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function feed(): Buffer {
  const zip = new AdmZip();
  const add = (n: string, c: string) => zip.addFile(n, Buffer.from(c, 'utf8'));
  add('stops.txt', 'stop_id,stop_name,stop_lat,stop_lon\nS1,Alexanderplatz,52.52130,13.41250\n');
  add('routes.txt', 'route_id,route_short_name,route_long_name,route_type\nR1,U8,Linie U8,1\n');
  add('trips.txt', 'route_id,service_id,trip_id,trip_headsign\nR1,DAILY,T1,Wittenau\n');
  add(
    'stop_times.txt',
    'trip_id,arrival_time,departure_time,stop_id,stop_sequence\nT1,23:55:00,23:55:00,S1,1\n',
  );
  add(
    'calendar.txt',
    'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n' +
      'DAILY,1,1,1,1,1,1,1,20260101,20261231\n',
  );
  add('feed_info.txt', 'feed_publisher_name,feed_version\nDELFI e.V.,2026-07-13\n');
  return zip.toBuffer();
}

describe('transit integration: GTFS import → scheduled departures', () => {
  const dbPath = join(tmp, 'gtfs.sqlite');
  const feedPath = join(tmp, 'feed.zip');

  it('serves real scheduled departures once a feed is configured', async () => {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(feedPath, feed());
    const result = importGtfs(feedPath, dbPath);
    expect(result.stops).toBe(1);

    const config = loadConfig({
      GTFS_STATIC_PATH: feedPath,
      GTFS_DB: dbPath,
    } as unknown as NodeJS.ProcessEnv);
    const ctx = { cache: createMemoryCache(), config };

    const env = await getTransitContext(
      { latitude: 52.5213, longitude: 13.4125 },
      [],
      '2026-07-17T21:00:00Z', // ~23:00 Berlin
      ctx,
    );
    expect(env.status).toBe('ok');
    expect(env.data!.scheduled.coverage).toBe('confirmed');
    const stop = env.data!.stops[0]!;
    expect(stop.name).toBe('Alexanderplatz');
    expect(stop.source).toBe('scheduled');
    expect(stop.scheduledDepartures[0]!.departureTime).toBe('23:55:00');
    expect(stop.scheduledDepartures[0]!.mode).toBe('U-Bahn');
    // DELFI attribution is carried into evidence.
    expect(env.evidence.some((e) => e.attribution?.includes('DELFI'))).toBe(true);
  });

  it('reports honest "not configured" when no feed is present', async () => {
    const config = loadConfig({} as NodeJS.ProcessEnv);
    const env = await getTransitContext(
      { latitude: 52.5213, longitude: 13.4125 },
      [
        {
          name: 'Kartierter Halt',
          coordinates: { latitude: 52.5213, longitude: 13.4125 },
          distanceMeters: 10,
        },
      ],
      '2026-07-17T21:00:00Z',
      { cache: createMemoryCache(), config },
    );
    expect(env.data!.scheduled.coverage).toBe('unknown');
    expect(env.data!.stops[0]!.source).toBe('mapped');
    expect(env.data!.realtime.detail).toContain('NICHT Normalbetrieb');
  });
});
