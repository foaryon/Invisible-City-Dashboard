/**
 * Adapter tests for the Tier-1/Tier-2 expansion: NINA civil-protection
 * warnings (via BKG VG250 territorial assignment), Autobahn events, GEOFON
 * earthquakes (FDSN text), DWD CDC climate normals, Tankerkönig fuel prices
 * and DB FaSta facilities. Fixture-driven; every negative path stays honest:
 * source-error / unavailable / configuration-required — never invented data.
 */
import { describe, it, expect } from 'vitest';
import {
  bkgVg250Fixture,
  ninaDashboardFixture,
  autobahnRoadsFixture,
  autobahnWarningFixture,
  geofonEventTextFixture,
  cdcTemperatureStationsFixture,
  cdcTemperatureValuesFixture,
  cdcPrecipitationStationsFixture,
  cdcPrecipitationValuesFixture,
  tankerkoenigListFixture,
  dbFastaFixture,
  malformedFixtures,
  DEMO_PLACE,
} from '@invisible-city/test-fixtures';
import { createMemoryCache } from '../src/cache.js';
import { loadConfig } from '../src/config.js';
import { type AdapterContext } from '../src/runner.js';
import { getCivilWarningContext } from '../src/adapters/nina.js';
import { districtArs } from '../src/adapters/bkgVg250.js';
import { getAutobahnContext } from '../src/adapters/autobahn.js';
import { getSeismicContext, parseFdsnEventText } from '../src/adapters/geofon.js';
import { getClimateNormalsContext } from '../src/adapters/cdcNormals.js';
import { parseCdcTable } from '../src/adapters/cdcNormals.js';
import { getFuelContext } from '../src/adapters/tankerkoenig.js';
import { getStationFacilityContext } from '../src/adapters/dbFasta.js';

const coords = DEMO_PLACE.coordinates;
const testConfig = loadConfig({} as NodeJS.ProcessEnv);

/** Route-by-URL fetch stub (text responses passed as { __text }). */
function ctxRouting(routes: Array<[string, unknown]>): AdapterContext {
  return {
    cache: createMemoryCache(),
    config: testConfig,
    fetchImpl: (url: string) => {
      for (const [needle, body] of routes) {
        if (url.includes(needle)) {
          if (typeof body === 'object' && body !== null && '__text' in body) {
            return Promise.resolve(
              new Response((body as { __text: string }).__text, { status: 200 }),
            );
          }
          return Promise.resolve(
            new Response(JSON.stringify(body), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
      }
      return Promise.reject(new TypeError(`no stub for ${url}`));
    },
  };
}

describe('BKG VG250 + NINA civil-protection warnings', () => {
  it('derives the district ARS via the official assignment and lists warnings with dual evidence', async () => {
    const ctx = ctxRouting([
      ['sgx.geodatenzentrum.de', bkgVg250Fixture],
      ['warnung.bund.de', ninaDashboardFixture],
    ]);
    const env = await getCivilWarningContext(coords, ctx);
    expect(env.status).toBe('ok');
    expect(env.data!.ars).toBe('110000000000');
    expect(env.data!.municipalityName).toBe('Berlin');
    expect(env.data!.warnings[0]!.provider).toBe('MOWAS');
    const providers = env.evidence.map((e) => e.providerId).sort();
    expect(providers).toEqual(['bkg-vg250', 'nina-bbk']);
  });

  it('is honestly unavailable when the territorial assignment yields no ARS', async () => {
    const ctx = ctxRouting([
      ['sgx.geodatenzentrum.de', { type: 'FeatureCollection', features: [] }],
    ]);
    const env = await getCivilWarningContext(coords, ctx);
    expect(env.status).toBe('unavailable');
    expect(env.statusDetail).toContain('ARS');
  });

  it('rejects malformed dashboard payloads as source-error', async () => {
    const ctx = ctxRouting([
      ['sgx.geodatenzentrum.de', bkgVg250Fixture],
      ['warnung.bund.de', malformedFixtures.nina],
    ]);
    const env = await getCivilWarningContext(coords, ctx);
    expect(env.status).toBe('source-error');
  });

  it('district ARS convention: first 5 digits + seven zeros', () => {
    expect(districtArs('110000000000')).toBe('110000000000');
    expect(districtArs('053340002002')).toBe('053340000000');
  });
});

describe('Autobahn events adapter', () => {
  it('aggregates per-road kinds, filters by distance, labels motorway-only coverage', async () => {
    const ctx = ctxRouting([
      ['/services/warning', autobahnWarningFixture],
      ['/services/closure', { closure: [] }],
      ['/services/roadworks', { roadworks: [] }],
      ['verkehr.autobahn.de', autobahnRoadsFixture],
    ]);
    const env = await getAutobahnContext(coords, ctx);
    expect(env.status).toBe('ok');
    // Same warning fixture served for both roads; both within 30 km of Berlin-Mitte.
    expect(env.data!.events.length).toBeGreaterThan(0);
    expect(env.data!.events[0]!.kind).toBe('warning');
    expect(env.data!.events[0]!.distanceMeters).toBeLessThan(30_000);
    expect(env.limitations.join(' ')).toContain('Bundesautobahnen');
  });

  it('rejects a malformed road list as source-error', async () => {
    const ctx = ctxRouting([['verkehr.autobahn.de', malformedFixtures.autobahnRoads]]);
    const env = await getAutobahnContext(coords, ctx);
    expect(env.status).toBe('source-error');
  });
});

describe('GEOFON earthquakes adapter (FDSN text)', () => {
  it('parses the documented text format and sorts by distance', async () => {
    const ctx = ctxRouting([['geofon.gfz-potsdam.de', { __text: geofonEventTextFixture }]]);
    const env = await getSeismicContext(coords, ctx);
    expect(env.status).toBe('ok');
    expect(env.data!.events.length).toBe(2);
    expect(env.data!.events[0]!.locationName).toContain('Brandenburg');
    expect(env.data!.events[0]!.magnitude).toBe(2.1);
    expect(env.data!.events[0]!.distanceMeters).toBeLessThan(env.data!.events[1]!.distanceMeters);
  });

  it('treats an empty body (FDSN 204 semantics) as the honest "no events" outcome', async () => {
    const ctx = ctxRouting([['geofon.gfz-potsdam.de', { __text: '' }]]);
    const env = await getSeismicContext(coords, ctx);
    expect(env.status).toBe('ok');
    expect(env.data!.events).toEqual([]);
    expect(env.statusDetail).toContain('ehrliches Ergebnis');
  });

  it('rejects malformed lines as source-error, never repairing them', async () => {
    const ctx = ctxRouting([['geofon.gfz-potsdam.de', { __text: malformedFixtures.geofonText }]]);
    const env = await getSeismicContext(coords, ctx);
    expect(env.status).toBe('source-error');
  });

  it('parseFdsnEventText handles comments and empty input', () => {
    expect(parseFdsnEventText('# only a comment\n')).toEqual([]);
    expect(parseFdsnEventText('a|b|c')).toBeNull();
  });
});

describe('DWD CDC climate normals adapter', () => {
  // The adapter first reads the directory autoindex to discover current
  // filenames; this stub lists them (matched by the file routes below). The
  // 'mean_91-20' route is placed LAST so only the index URL (no filename)
  // falls through to it.
  const CDC_INDEX_HTML = `<html><body>
    <a href="../">Parent</a>
    <a href="Temperatur_1991-2020_Stationsliste_aktStandort.txt">t-stations</a>
    <a href="Temperatur_1991-2020_aktStandort.txt">t-values</a>
    <a href="Niederschlag_1991-2020_Stationsliste_aktStandort.txt">n-stations</a>
    <a href="Niederschlag_1991-2020_aktStandort.txt">n-values</a>
  </body></html>`;

  it('resolves the nearest climate station and reports current-month + annual normals', async () => {
    const ctx = ctxRouting([
      ['Temperatur_1991-2020_Stationsliste', { __text: cdcTemperatureStationsFixture }],
      ['Temperatur_1991-2020', { __text: cdcTemperatureValuesFixture }],
      ['Niederschlag_1991-2020_Stationsliste', { __text: cdcPrecipitationStationsFixture }],
      ['Niederschlag_1991-2020', { __text: cdcPrecipitationValuesFixture }],
      ['mean_91-20', { __text: CDC_INDEX_HTML }],
    ]);
    const env = await getClimateNormalsContext(coords, ctx);
    expect(env.status).toBe('ok');
    expect(env.data!.stationName).toContain('Tempelhof');
    expect(env.data!.referencePeriod).toBe('1991–2020');
    const temp = env.data!.values.find((v) => v.parameter === 'temperature')!;
    expect(temp.monthValue).not.toBeNull();
    expect(temp.yearValue).toBe(10.4);
    const precip = env.data!.values.find((v) => v.parameter === 'precipitation')!;
    expect(precip.yearValue).toBe(570);
  });

  it('rejects malformed tables as source-error', async () => {
    const ctx = ctxRouting([
      ['Temperatur_1991-2020_Stationsliste', { __text: malformedFixtures.cdcTable }],
      ['Temperatur_1991-2020', { __text: malformedFixtures.cdcTable }],
      ['Niederschlag_1991-2020_Stationsliste', { __text: malformedFixtures.cdcTable }],
      ['Niederschlag_1991-2020', { __text: malformedFixtures.cdcTable }],
      ['mean_91-20', { __text: CDC_INDEX_HTML }],
    ]);
    const env = await getClimateNormalsContext(coords, ctx);
    expect(env.status).toBe('source-error');
  });

  it('parseCdcTable strips leading zeros from station ids and keys by header', () => {
    const rows = parseCdcTable('Stations_id;Jan.\n 00433;1.2');
    expect(rows).not.toBeNull();
    expect(rows![0]!.stationId).toBe('433');
    expect(rows![0]!.columns['Jan.']).toBe('1.2');
  });
});

describe('Tankerkönig fuel prices adapter (config-gated)', () => {
  it('is configuration-required without an API key — never demo, never invented', async () => {
    const env = await getFuelContext(coords, {
      cache: createMemoryCache(),
      config: testConfig,
    });
    expect(env.status).toBe('configuration-required');
    expect(env.statusDetail).toContain('TANKERKOENIG_API_KEY');
  });

  it('normalizes stations with the documented false→null price semantics', async () => {
    const config = loadConfig({ TANKERKOENIG_API_KEY: 'k' } as unknown as NodeJS.ProcessEnv);
    const ctx: AdapterContext = {
      ...ctxRouting([['tankerkoenig.de', tankerkoenigListFixture]]),
      config,
    };
    const env = await getFuelContext(coords, ctx);
    expect(env.status).toBe('ok');
    expect(env.data!.stations.length).toBe(2);
    expect(env.data!.stations[0]!.e5).toBe(1.789);
    // Source delivers `false` for unavailable fuels — normalized to null.
    expect(env.data!.stations[1]!.e5).toBeNull();
    expect(env.data!.stations[1]!.isOpen).toBe(false);
  });

  it('surfaces a source-side error response as source-error', async () => {
    const config = loadConfig({ TANKERKOENIG_API_KEY: 'k' } as unknown as NodeJS.ProcessEnv);
    const ctx: AdapterContext = {
      ...ctxRouting([['tankerkoenig.de', malformedFixtures.tankerkoenig]]),
      config,
    };
    const env = await getFuelContext(coords, ctx);
    expect(env.status).toBe('source-error');
  });
});

describe('DB FaSta facilities adapter (config-gated)', () => {
  it('is configuration-required without credentials', async () => {
    const env = await getStationFacilityContext(coords, {
      cache: createMemoryCache(),
      config: testConfig,
    });
    expect(env.status).toBe('configuration-required');
    expect(env.statusDetail).toContain('DB_CLIENT_ID');
  });

  it('filters the nationwide snapshot by distance and keeps UNKNOWN semantics', async () => {
    const config = loadConfig({
      DB_CLIENT_ID: 'id',
      DB_API_KEY: 'key',
    } as unknown as NodeJS.ProcessEnv);
    const ctx: AdapterContext = {
      ...ctxRouting([['apis.deutschebahn.com', dbFastaFixture]]),
      config,
    };
    const env = await getStationFacilityContext(coords, ctx);
    expect(env.status).toBe('ok');
    // The far-away UNKNOWN escalator (≈300 km) is filtered out by radius.
    expect(env.data!.facilities.length).toBe(2);
    expect(env.data!.facilities.map((f) => f.state).sort()).toEqual(['ACTIVE', 'INACTIVE']);
    expect(env.limitations.join(' ')).toContain('UNKNOWN');
  });

  it('rejects malformed payloads as source-error', async () => {
    const config = loadConfig({
      DB_CLIENT_ID: 'id',
      DB_API_KEY: 'key',
    } as unknown as NodeJS.ProcessEnv);
    const ctx: AdapterContext = {
      ...ctxRouting([['apis.deutschebahn.com', malformedFixtures.fasta]]),
      config,
    };
    const env = await getStationFacilityContext(coords, ctx);
    expect(env.status).toBe('source-error');
  });
});
