/**
 * Adapter tests for the V1.1 providers: PEGELONLINE water levels, BfS ODL
 * gamma dose rate, DWD pollen + UV forecasts and DWD radar (via Bright Sky).
 * Fixture-driven (egress-blocked build env); every negative path must stay
 * honest: source-error / unavailable — never invented data.
 */
import { describe, it, expect } from 'vitest';
import {
  pegelonlineStationsFixture,
  odlLatestFixture,
  dwdPollenFixture,
  dwdUviFixture,
  brightskyRadarFixture,
  malformedFixtures,
  DEMO_PLACE,
} from '@invisible-city/test-fixtures';
import { createMemoryCache } from '../src/cache.js';
import { loadConfig } from '../src/config.js';
import { type AdapterContext } from '../src/runner.js';
import { getWaterLevelContext } from '../src/adapters/pegelonline.js';
import { getRadiationContext } from '../src/adapters/odl.js';
import { getPollenContext, parseLegend, regionMatchesState } from '../src/adapters/pollen.js';
import { getUvContext } from '../src/adapters/uvi.js';
import { getRadarContext, centerCellValue } from '../src/adapters/radar.js';

const coords = DEMO_PLACE.coordinates;
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

describe('PEGELONLINE (WSV) adapter', () => {
  it('normalizes gauges with readings, sorted by distance, with WSV attribution', async () => {
    const env = await getWaterLevelContext(coords, ctxWith(pegelonlineStationsFixture));
    expect(env.status).toBe('ok');
    expect(env.demo).toBe(false);
    const stations = env.data!.stations;
    expect(stations.length).toBe(2);
    expect(stations[0]!.name).toContain('Berlin Schleuse');
    expect(stations[0]!.waterBody).toBe('Spree');
    expect(stations[0]!.readings[0]!.value).toBe(312);
    expect(stations[0]!.readings[0]!.mode).toBe('observed');
    expect(stations[0]!.distanceMeters).toBeLessThan(stations[1]!.distanceMeters);
    expect(env.evidence[0]!.attribution).toContain('PEGELONLINE');
  });

  it('reports an empty radius honestly as coverage statement, not as error', async () => {
    const env = await getWaterLevelContext(coords, ctxWith([]));
    expect(env.status).toBe('unavailable');
    expect(env.statusDetail).toContain('Bundeswasserstraßen');
    expect(env.data!.stations).toEqual([]);
  });

  it('rejects malformed responses as source-error', async () => {
    const env = await getWaterLevelContext(coords, ctxWith(malformedFixtures.pegelonline));
    expect(env.status).toBe('source-error');
    expect(env.data).toBeNull();
  });
});

describe('BfS ODL adapter', () => {
  it('selects nearest probes from the full layer and keeps µSv/h values', async () => {
    const env = await getRadiationContext(coords, ctxWith(odlLatestFixture));
    expect(env.status).toBe('ok');
    const s = env.data!.stations[0]!;
    expect(s.name).toContain('Berlin-Mitte');
    expect(s.doseRate).toBe(0.078);
    expect(s.unit).toBe('µSv/h');
    expect(s.mode).toBe('observed');
    expect(env.evidence[0]!.attribution).toContain('Strahlenschutz');
  });

  it('labels a distant nearest probe as regional reference', async () => {
    const far = { latitude: 52.9, longitude: 13.9 };
    const env = await getRadiationContext(far, ctxWith(odlLatestFixture));
    expect(env.status).toBe('ok');
    expect(env.evidence[0]!.limitations.join(' ')).toContain('regionale Referenz');
  });

  it('rejects malformed responses as source-error', async () => {
    const env = await getRadiationContext(coords, ctxWith(malformedFixtures.odl));
    expect(env.status).toBe('source-error');
    expect(env.data).toBeNull();
  });
});

describe('DWD pollen adapter', () => {
  it('assigns via Bundesland and keeps index strings + legend verbatim', async () => {
    const env = await getPollenContext('Berlin', ctxWith(dwdPollenFixture));
    expect(env.status).toBe('ok');
    expect(env.data!.partregions.length).toBe(1);
    expect(env.data!.partregions[0]!.regionName).toBe('Brandenburg und Berlin');
    const graeser = env.data!.partregions[0]!.values.find((v) => v.allergen === 'Graeser')!;
    expect(graeser.today).toBe('2');
    expect(graeser.mode).toBe('forecast');
    expect(env.data!.legend['2']).toBe('mittlere Belastung');
  });

  it('returns ALL partregions when a Bundesland spans several — no silent pick', async () => {
    const env = await getPollenContext('Bayern', ctxWith(dwdPollenFixture));
    expect(env.status).toBe('ok');
    expect(env.data!.partregions.length).toBe(2);
    expect(env.evidence[0]!.limitations.join(' ')).toContain('Teilregionen');
  });

  it('is honestly unavailable without a Bundesland', async () => {
    const env = await getPollenContext(null, ctxWith(dwdPollenFixture));
    expect(env.status).toBe('unavailable');
    expect(env.data).toBeNull();
  });

  it('is honestly unavailable for an unknown region', async () => {
    const env = await getPollenContext('Atlantis', ctxWith(dwdPollenFixture));
    expect(env.status).toBe('unavailable');
  });

  it('rejects malformed responses as source-error', async () => {
    const env = await getPollenContext('Berlin', ctxWith(malformedFixtures.pollen));
    expect(env.status).toBe('source-error');
  });

  it('legend parsing pairs idN with idN_desc', () => {
    expect(parseLegend({ id1: '0', id1_desc: 'keine Belastung', junk: 'x' })).toEqual({
      '0': 'keine Belastung',
    });
    expect(regionMatchesState('Brandenburg und Berlin', 'berlin')).toBe(true);
    expect(regionMatchesState('Bayern', 'Berlin')).toBe(false);
  });
});

describe('DWD UV index adapter', () => {
  it('picks the nearest mappable reference location with distance evidence', async () => {
    const env = await getUvContext(coords, ctxWith(dwdUviFixture));
    expect(env.status).toBe('ok');
    expect(env.data!.cityName).toBe('Berlin');
    expect(env.data!.days[0]!.value).toBe(6);
    expect(env.data!.days[0]!.mode).toBe('forecast');
    expect(env.evidence[0]!.spatial).toMatchObject({ kind: 'station', stationId: 'Berlin' });
  });

  it('skips source locations without documented coordinates instead of guessing', async () => {
    const onlyUnknown = { content: [{ city: 'Ort-ohne-Koordinate', forecast: { today: 5 } }] };
    const env = await getUvContext(coords, ctxWith(onlyUnknown));
    expect(env.status).toBe('unavailable');
    expect(env.data).toBeNull();
  });

  it('rejects malformed responses as source-error', async () => {
    const env = await getUvContext(coords, ctxWith(malformedFixtures.uvi));
    expect(env.status).toBe('source-error');
  });
});

describe('DWD radar adapter (via Bright Sky)', () => {
  it('extracts the cell at the source pixel position and converts by documented factor', async () => {
    const env = await getRadarContext(coords, ctxWith(brightskyRadarFixture));
    expect(env.status).toBe('ok');
    const frames = env.data!.frames;
    expect(frames.length).toBe(2);
    // latlon_position {x:1.2,y:1.4} → cell [1][1] = 12 and 25 hundredths of mm.
    expect(frames[0]!.precipitationMm).toBe(0.12);
    expect(frames[1]!.precipitationMm).toBe(0.25);
    expect(env.data!.resolutionKm).toBe(1);
    expect(env.evidence[0]!.attribution).toBe('Quelle: Deutscher Wetterdienst');
  });

  it('discriminates nowcast frames after retrieval time as forecast', async () => {
    const future = new Date(Date.now() + 30 * 60_000).toISOString();
    const past = new Date(Date.now() - 5 * 60_000).toISOString();
    const payload = {
      radar: [
        { timestamp: past, precipitation_5: [[7]] },
        { timestamp: future, precipitation_5: [[3]] },
      ],
    };
    const env = await getRadarContext(coords, ctxWith(payload));
    expect(env.data!.frames[0]!.mode).toBe('observed');
    expect(env.data!.frames[1]!.mode).toBe('forecast');
  });

  it('rejects malformed responses as source-error', async () => {
    const env = await getRadarContext(coords, ctxWith(malformedFixtures.radar));
    expect(env.status).toBe('source-error');
  });

  it('centerCellValue clamps positions and handles empty grids', () => {
    expect(centerCellValue([], undefined)).toBeNull();
    expect(
      centerCellValue(
        [
          [1, 2],
          [3, 4],
        ],
        { x: 99, y: 99 },
      ),
    ).toBe(4);
    expect(centerCellValue([[5]], undefined)).toBe(5);
  });
});
