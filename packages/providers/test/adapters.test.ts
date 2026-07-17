import { describe, it, expect } from 'vitest';
import {
  brightskyWeatherFixture,
  dwdWarningsFixture,
  ubaStationsFixture,
  ubaMeasuresFixture,
  overpassPoisFixture,
  photonSearchFixture,
  malformedFixtures,
  DEMO_PLACE,
} from '@invisible-city/test-fixtures';
import { createMemoryCache } from '../src/cache.js';
import { loadConfig } from '../src/config.js';
import { type AdapterContext } from '../src/runner.js';
import { getWeatherContext } from '../src/adapters/brightsky.js';
import { getWarningContext } from '../src/adapters/dwdWarnings.js';
import { getAirStationContext } from '../src/adapters/uba.js';
import { getPoiContext } from '../src/adapters/overpass.js';
import { searchPlaces } from '../src/adapters/photon.js';
import { getTransitContext, type MappedStop } from '../src/adapters/transit.js';
import { demoAdapters } from '../src/demo.js';

const coords = DEMO_PLACE.coordinates;
const FROM = '2026-07-16T08:00:00Z';
const TO = '2026-07-16T14:00:00Z';
const testConfig = loadConfig({} as NodeJS.ProcessEnv);

function ctxWith(body: unknown, status = 200): AdapterContext {
  return {
    cache: createMemoryCache(),
    config: testConfig,
    fetchImpl: () =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
  };
}

function failingCtx(kind: 'network' | 'http500' | 'rate-limit'): AdapterContext {
  return {
    cache: createMemoryCache(),
    config: testConfig,
    fetchImpl: () => {
      if (kind === 'network') return Promise.reject(new TypeError('fetch failed'));
      return Promise.resolve(new Response('err', { status: kind === 'http500' ? 500 : 429 }));
    },
  };
}

describe('Bright Sky (DWD) adapter', () => {
  it('normalizes valid responses and separates observed from forecast per hour', async () => {
    const env = await getWeatherContext(coords, FROM, TO, ctxWith(brightskyWeatherFixture));
    expect(env.status).toBe('ok');
    expect(env.demo).toBe(false);
    const modes = new Set(env.data!.hours.map((h) => h.mode));
    expect(modes).toEqual(new Set(['observed', 'forecast']));
    expect(env.evidence[0]!.attribution).toBe('Quelle: Deutscher Wetterdienst');
  });

  it('keeps missing values null — no numeric defaults', async () => {
    const env = await getWeatherContext(coords, FROM, TO, ctxWith(brightskyWeatherFixture));
    const lastHour = env.data!.hours.at(-1)!;
    const wind = lastHour.values.find((v) => v.parameter === 'windSpeed')!;
    expect(wind.value).toBeNull();
  });

  it('rejects malformed responses as source-error with null data', async () => {
    const env = await getWeatherContext(coords, FROM, TO, ctxWith(malformedFixtures.brightsky));
    expect(env.status).toBe('source-error');
    expect(env.data).toBeNull();
  });

  it('surfaces outages as source-error instead of inventing values', async () => {
    const env = await getWeatherContext(coords, FROM, TO, failingCtx('network'));
    expect(env.status).toBe('source-error');
    expect(env.data).toBeNull();
    expect(env.statusDetail).toContain('keine Ersatzwerte');
  });

  it('serves fresh cache without re-fetching within TTL', async () => {
    const cache = createMemoryCache();
    let calls = 0;
    const ctx: AdapterContext = {
      cache,
      config: testConfig,
      fetchImpl: () => {
        calls++;
        return Promise.resolve(
          new Response(JSON.stringify(brightskyWeatherFixture), { status: 200 }),
        );
      },
    };
    await getWeatherContext(coords, FROM, TO, ctx);
    const second = await getWeatherContext(coords, FROM, TO, ctx);
    expect(calls).toBe(1);
    expect(second.status).toBe('ok');
    expect(second.evidence[0]!.cacheAgeSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe('DWD warnings adapter', () => {
  it('extracts official warnings and preserves embedded geometry license', async () => {
    const env = await getWarningContext(coords, ctxWith(dwdWarningsFixture));
    expect(env.status).toBe('ok');
    expect(env.data!.warnings).toHaveLength(1);
    expect(env.data!.warnings[0]!.event).toBe('HITZE');
    expect(env.evidence[0]!.limitations.join(' ')).toContain('GeoBasis-DE / BKG');
  });

  it('an empty feature list means "no official warning", not an error', async () => {
    const env = await getWarningContext(
      coords,
      ctxWith({ type: 'FeatureCollection', features: [] }),
    );
    expect(env.status).toBe('ok');
    expect(env.data!.warnings).toHaveLength(0);
  });

  it('rejects malformed WFS payloads', async () => {
    const env = await getWarningContext(coords, ctxWith(malformedFixtures.dwdWarnings));
    expect(env.status).toBe('source-error');
  });
});

describe('UBA air-quality adapter', () => {
  function ubaCtx(): AdapterContext {
    return {
      cache: createMemoryCache(),
      config: testConfig,
      fetchImpl: (url: string) => {
        const body = url.includes('stations/json') ? ubaStationsFixture : ubaMeasuresFixture;
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      },
    };
  }

  it('finds nearest stations, normalizes CET timestamps and keeps the raw source time', async () => {
    const env = await getAirStationContext(coords, ubaCtx(), 2);
    expect(['ok', 'partial']).toContain(env.status);
    const station = env.data!.stations[0]!;
    expect(station.stationCode).toMatch(/^DEBE/);
    expect(station.distanceMeters).toBeGreaterThan(0);
    const pm2 = station.measurements.find((m) => m.pollutant === 'PM2');
    expect(pm2).toBeDefined();
    // Fixture dateEnd "2026-07-16 13:00:00" CET → 12:00 UTC.
    expect(pm2!.measuredAt).toBe('2026-07-16T12:00:00.000Z');
    expect(pm2!.sourceTimeRaw).toBe('2026-07-16 13:00:00');
  });

  it('marks data as provisional (current-year UBA rule)', async () => {
    const env = await getAirStationContext(coords, ubaCtx(), 1);
    expect(env.evidence[0]!.completeness).toBe('provisional');
  });

  it('reports partial when not all pollutants are measured', async () => {
    const env = await getAirStationContext(coords, ubaCtx(), 1);
    expect(env.status).toBe('partial');
    expect(env.statusDetail).toBeTruthy();
  });

  it('labels a distant selection as regional reference', async () => {
    const far = { latitude: 47.7, longitude: 12.9 }; // ~600 km from the fixture stations
    const env = await getAirStationContext(far, ubaCtx(), 1);
    expect(env.evidence[0]!.limitations.join(' ')).toContain('regionale Referenz');
  });

  it('rejects a malformed station directory', async () => {
    const env = await getAirStationContext(coords, ctxWith({ data: 'nope' }), 1);
    expect(env.status).toBe('source-error');
  });
});

describe('Overpass POI adapter', () => {
  it('maps categories, computes distances and labels everything as mapped', async () => {
    const env = await getPoiContext(coords, ctxWith(overpassPoisFixture));
    expect(env.status).toBe('ok');
    const categories = new Set(env.data!.pois.map((p) => p.category));
    expect(categories).toEqual(
      new Set(['park', 'pharmacy', 'toilet', 'drinking-water', 'transit-stop']),
    );
    expect(env.data!.pois.every((p) => p.mode === 'mapped')).toBe(true);
    expect(env.evidence[0]!.attribution).toContain('OpenStreetMap contributors');
    expect(env.evidence[0]!.completeness).toBe('unknown');
  });

  it('surfaces Overpass rate limiting (429) explicitly', async () => {
    const env = await getPoiContext(coords, failingCtx('rate-limit'));
    expect(env.status).toBe('source-error');
    expect(env.statusDetail).toContain('429');
  });

  it('rejects malformed Overpass payloads', async () => {
    const env = await getPoiContext(coords, ctxWith(malformedFixtures.overpass));
    expect(env.status).toBe('source-error');
  });
});

describe('Photon geocoding adapter', () => {
  it('filters results to Germany and produces the SelectedPlace contract', async () => {
    const env = await searchPlaces('berlin', ctxWith(photonSearchFixture));
    expect(env.status).toBe('ok');
    const labels = env.data!.map((r) => r.place.label);
    expect(labels.some((l) => l.includes('Berlin'))).toBe(true);
    expect(labels.some((l) => l.includes('Paris'))).toBe(false);
    for (const r of env.data!) {
      expect(r.place.country).toBe('DE');
      expect(r.place.id).toMatch(/^osm:/);
    }
  });

  it('handles HTTP errors as source-error', async () => {
    const env = await searchPlaces('berlin', failingCtx('http500'));
    expect(env.status).toBe('source-error');
  });
});

describe('transit context (no false operation claims)', () => {
  const mapped: MappedStop[] = [
    { name: 'U Demo', coordinates: { latitude: 52.5208, longitude: 13.4094 }, distanceMeters: 120 },
  ];

  it('provides mapped stop context but never fakes scheduled/realtime when unconfigured', async () => {
    const env = await getTransitContext(coords, mapped, FROM, ctxWith({}));
    expect(env.data!.stopContext.coverage).toBe('confirmed');
    expect(env.data!.stops[0]!.source).toBe('mapped');
    // No GTFS / GTFS-RT configured → honest "not configured" states.
    expect(env.data!.scheduled.coverage).toBe('unknown');
    expect(env.data!.realtime.coverage).toBe('unknown');
    expect(env.data!.realtime.detail).toContain('NICHT Normalbetrieb');
  });

  it('reports unknown stop context when no mapped stops are available', async () => {
    const env = await getTransitContext(coords, [], FROM, ctxWith({}));
    expect(env.data!.stopContext.coverage).toBe('unknown');
    expect(env.data!.stops).toHaveLength(0);
  });
});

describe('demo mode separation (§3.1.J)', () => {
  it('stamps every demo envelope and every evidence record as demo', async () => {
    const env = await demoAdapters.weather(coords, FROM, TO);
    expect(env.status).toBe('demo');
    expect(env.demo).toBe(true);
    expect(env.evidence.every((e) => e.mode === 'demo')).toBe(true);
    expect(env.limitations[0]).toBe('DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN');
  });

  it('demo air data flows through the same normalization as live data', async () => {
    const env = await demoAdapters.airStations(coords);
    expect(env.demo).toBe(true);
    expect(env.data!.stations.length).toBeGreaterThan(0);
  });
});
