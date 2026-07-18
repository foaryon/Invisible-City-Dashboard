/**
 * Offline tests for the live-endpoint fixes (session: diagnostic harness work).
 *
 * These lock in the parts that DON'T need network: the BKG deegree-compatible
 * point-in-polygon assignment (incl. axis-order robustness), the CDC directory
 * -index filename discovery, the Photon coordinate/id mapping (search-jump
 * characterization), and the corrected UBA base host. The live request shapes
 * remain TO VERIFY via `npm run diagnose` on a networked machine.
 */
import { describe, it, expect } from 'vitest';
import { createMemoryCache } from '../src/cache.js';
import { loadConfig } from '../src/config.js';
import { type AdapterContext } from '../src/runner.js';
import { getTerritorialAssignment } from '../src/adapters/bkgVg250.js';
import { parseDirectoryIndex, resolveParameterFiles } from '../src/adapters/cdcNormals.js';
import { searchPlaces } from '../src/adapters/photon.js';
import { getAutobahnContext } from '../src/adapters/autobahn.js';
import { getAirStationContext } from '../src/adapters/uba.js';

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

/** A square polygon (GeoJSON [lon,lat]) around a centre point. */
function squareLonLat(lon: number, lat: number, half = 0.15): number[][][] {
  return [
    [
      [lon - half, lat - half],
      [lon + half, lat - half],
      [lon + half, lat + half],
      [lon - half, lat + half],
      [lon - half, lat - half],
    ],
  ];
}

function feature(ars: string, gen: string, coordinates: number[][][], type = 'Polygon') {
  return { properties: { ars, gen }, geometry: { type, coordinates } };
}

describe('BKG VG250 — deegree-compatible point-in-polygon assignment', () => {
  const trier = { latitude: 49.7596, longitude: 6.6439 };

  it('returns the Gemeinde whose polygon contains the point', async () => {
    const body = { features: [feature('072110000000', 'Trier', squareLonLat(6.6439, 49.7596))] };
    const res = await getTerritorialAssignment(trier, ctxWith(body));
    expect(res?.ars).toBe('072110000000');
    expect(res?.municipalityName).toBe('Trier');
  });

  it('picks the containing feature, not merely the first returned', async () => {
    const body = {
      features: [
        feature('07000000000', 'Woanders', squareLonLat(8.0, 50.0)), // does NOT contain Trier
        feature('072110000000', 'Trier', squareLonLat(6.6439, 49.7596)), // contains Trier
      ],
    };
    const res = await getTerritorialAssignment(trier, ctxWith(body));
    expect(res?.ars).toBe('072110000000');
  });

  it('normalizes a [lat,lon] axis order in the returned geometry', async () => {
    // Same square but every pair swapped to [lat,lon] as some WFS emit.
    const swapped = squareLonLat(6.6439, 49.7596).map((ring) => ring.map((p) => [p[1]!, p[0]!]));
    const body = { features: [feature('072110000000', 'Trier', swapped)] };
    const res = await getTerritorialAssignment(trier, ctxWith(body));
    expect(res?.ars).toBe('072110000000');
  });

  it('returns null when several features are returned but none contains the point', async () => {
    const body = {
      features: [
        feature('07000000000', 'A', squareLonLat(8.0, 50.0)),
        feature('08000000000', 'B', squareLonLat(9.0, 48.0)),
      ],
    };
    expect(await getTerritorialAssignment(trier, ctxWith(body))).toBeNull();
  });

  it('pads an 8-digit AGS to the 12-digit ARS convention', async () => {
    const body = {
      features: [{ properties: { ags: '07211000', gen: 'Trier' }, geometry: null }],
    };
    // No geometry + single feature → fallback to the lone feature.
    const res = await getTerritorialAssignment(trier, ctxWith(body));
    expect(res?.ars).toBe('072110000000');
  });
});

describe('CDC normals — directory-index filename discovery', () => {
  const APACHE_INDEX = `
    <html><head><title>Index of /.../mean_91-20</title></head><body>
    <a href="?C=N;O=D">Name</a>
    <a href="/climate_environment/">Parent Directory</a>
    <a href="Temperatur_1991-2020_Stationsliste_aktStandort.txt">Temperatur…Stationsliste</a>
    <a href="Temperatur_1991-2020_aktStandort.txt">Temperatur…werte</a>
    <a href="Niederschlag_1991-2020_Stationsliste_aktStandort.txt">Niederschlag…Stationsliste</a>
    <a href="Niederschlag_1991-2020_aktStandort.txt">Niederschlag…werte</a>
    <a href="beschreibung.pdf">Beschreibung</a>
    <a href="subdir/">subdir/</a>
    </body></html>`;

  it('extracts only the bare file names from an Apache autoindex', () => {
    const names = parseDirectoryIndex(APACHE_INDEX);
    expect(names).toContain('Temperatur_1991-2020_aktStandort.txt');
    expect(names).toContain('Niederschlag_1991-2020_Stationsliste_aktStandort.txt');
    // No parent links, sort links or subdirectories.
    expect(names.some((n) => n.includes('/') || n.startsWith('?'))).toBe(false);
    expect(names).not.toContain('subdir');
  });

  it('resolves the stations list and value table for both parameters', () => {
    const files = resolveParameterFiles(parseDirectoryIndex(APACHE_INDEX));
    expect(files).not.toBeNull();
    const temp = files!.find((f) => f.parameter === 'temperature')!;
    expect(temp.stationsFile).toBe('Temperatur_1991-2020_Stationsliste_aktStandort.txt');
    expect(temp.valuesFile).toBe('Temperatur_1991-2020_aktStandort.txt');
    const precip = files!.find((f) => f.parameter === 'precipitation')!;
    expect(precip.valuesFile).toBe('Niederschlag_1991-2020_aktStandort.txt');
  });

  it('returns null when a required file is missing (never guesses a URL)', () => {
    const onlyStations = ['Temperatur_1991-2020_Stationsliste_aktStandort.txt'];
    expect(resolveParameterFiles(onlyStations)).toBeNull();
  });
});

describe('Photon geocoding — coordinate & id mapping (search-jump guard)', () => {
  function phFeature(name: string, lon: number, lat: number, osmId: number, osmType = 'N') {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        countrycode: 'DE',
        name,
        state: 'Rheinland-Pfalz',
        osm_id: osmId,
        osm_type: osmType,
      },
    };
  }

  it('maps GeoJSON [lon,lat] to the correct latitude/longitude (no swap)', async () => {
    const body = { features: [phFeature('Trier', 6.6439, 49.7596, 111)] };
    const env = await searchPlaces('Trier', ctxWith(body));
    const place = env.data![0]!.place;
    expect(place.coordinates.latitude).toBeCloseTo(49.7596, 4);
    expect(place.coordinates.longitude).toBeCloseTo(6.6439, 4);
  });

  it('gives distinct ids to distinct features (no cache-key collision)', async () => {
    const body = {
      features: [
        phFeature('Trier', 6.6439, 49.7596, 111),
        phFeature('Trier-Süd', 6.65, 49.74, 222),
      ],
    };
    const env = await searchPlaces('Trier', ctxWith(body));
    const ids = env.data!.map((r) => r.place.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('UBA base host', () => {
  it('defaults to the documented www.umweltbundesamt.de Air Data API base', () => {
    expect(loadConfig({} as NodeJS.ProcessEnv).ubaBaseUrl).toBe(
      'https://www.umweltbundesamt.de/api/air_data/v3',
    );
  });
});

/** Route-by-URL fetch stub for multi-endpoint adapters. */
function ctxRouting(routes: Array<[string, unknown]>): AdapterContext {
  return {
    cache: createMemoryCache(),
    config: testConfig,
    fetchImpl: (url: string) => {
      for (const [needle, body] of routes) {
        if (url.includes(needle)) {
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

describe('Autobahn — live-verified response shape (2026-07-18)', () => {
  it('accepts NUMERIC coordinate lat/long as the live API returns them', async () => {
    const ctx = ctxRouting([
      [
        '/services/roadworks',
        {
          roadworks: [
            {
              identifier: '2026-021338--vi',
              title: 'A4 | Köln-Heumar - Köln-Süd',
              subtitle: 'Baustelle',
              // Live shape: numbers, NOT strings (bund.dev docs showed strings).
              coordinate: { lat: 50.93, long: 6.95 },
              startTimestamp: '2026-05-04T00:00:00+02:00',
            },
          ],
        },
      ],
      ['/services/', { warning: [] }],
      ['autobahn', { roads: ['A4'] }],
    ]);
    const env = await getAutobahnContext({ latitude: 50.938, longitude: 6.96 }, ctx);
    expect(env.status).toBe('ok');
    expect(env.data!.events.length).toBe(1);
    expect(env.data!.events[0]!.roadId).toBe('A4');
    expect(env.data!.events[0]!.coordinates!.latitude).toBeCloseTo(50.93, 2);
  });

  it('still accepts the documented string coordinates', async () => {
    const ctx = ctxRouting([
      [
        '/services/warning',
        {
          warning: [
            {
              identifier: 'w1',
              title: 'A4 | Stau',
              coordinate: { lat: '50.93', long: '6.95' },
            },
          ],
        },
      ],
      ['/services/', { roadworks: [] }],
      ['autobahn', { roads: ['A4'] }],
    ]);
    const env = await getAutobahnContext({ latitude: 50.938, longitude: 6.96 }, ctx);
    expect(env.data!.events.length).toBe(1);
  });
});

describe('UBA — decommissioned & dormant station handling (live-verified 2026-07-18)', () => {
  // Directory: [1]=code, [2]=name, [5]=activity start, [6]=activity end,
  // [7]=lon, [8]=lat, [13]=type. Station 1: decommissioned 1990 (nearest).
  // Station 2: no end date but returns no measurements ("zDDR" data-quality
  // case). Station 3: active and measuring, slightly further away.
  const coords = { latitude: 52.52, longitude: 13.405 };
  const directory = {
    data: {
      '1': [
        '1',
        'DEBE073',
        'zDDR_B Alex_MD',
        'Berlin',
        null,
        '1971-01-01',
        '1990-12-31',
        '13.405',
        '52.52',
        '1',
        'Berlin',
        '',
        '',
        'Hintergrund',
      ],
      '2': [
        '2',
        'DEBE137',
        'zDDR_Kraftf.-IMM',
        'Berlin',
        null,
        '1981-01-01',
        null,
        '13.410',
        '52.522',
        '1',
        'Berlin',
        '',
        '',
        'Hintergrund',
      ],
      '3': [
        '3',
        'DEBE068',
        'Berlin Mitte',
        'Berlin',
        null,
        '2010-01-01',
        null,
        '13.418',
        '52.524',
        '1',
        'Berlin',
        '',
        '',
        'Hintergrund',
      ],
    },
  };
  const measured = {
    data: { '3': { '2026-07-18 11:00:00': [1, 2, 21.5, '2026-07-18 12:00:00', null] } },
  };

  it('skips decommissioned stations and reports the nearest MEASURING station first', async () => {
    const ctx = ctxRouting([
      ['stations/json', directory],
      ['station=3&component=1', measured],
      ['station=', { data: {} }], // every other station/component: no values
    ]);
    const env = await getAirStationContext(coords, ctx);
    const codes = env.data!.stations.map((s) => s.stationCode);
    // The 1990-decommissioned station never appears.
    expect(codes).not.toContain('DEBE073');
    // The measuring station leads the list although a silent one is nearer.
    expect(env.data!.stations[0]!.stationCode).toBe('DEBE068');
    expect(env.data!.stations[0]!.measurements.length).toBeGreaterThan(0);
    expect(env.status).toBe('partial'); // one pollutant of six → partial, honest
  });

  it('reports unavailable honestly when NO station in the pool measures', async () => {
    const ctx = ctxRouting([
      ['stations/json', directory],
      ['station=', { data: {} }],
    ]);
    const env = await getAirStationContext(coords, ctx);
    expect(env.status).toBe('unavailable');
    expect(env.data!.stations.every((s) => s.measurements.length === 0)).toBe(true);
  });
});

describe('Photon — city-state Bundesland fallback (live-verified 2026-07-18)', () => {
  it("derives state 'Berlin' when Photon omits state for the city-state", async () => {
    const body = {
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [13.405, 52.52] },
          properties: { countrycode: 'DE', name: 'Berlin', osm_id: 1, osm_type: 'R' },
        },
      ],
    };
    const env = await searchPlaces('Berlin', ctxWith(body));
    expect(env.data![0]!.place.state).toBe('Berlin');
  });

  it('leaves a provided state untouched (non-city-state)', async () => {
    const body = {
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [6.6439, 49.7596] },
          properties: {
            countrycode: 'DE',
            name: 'Trier',
            state: 'Rheinland-Pfalz',
            osm_id: 2,
            osm_type: 'R',
          },
        },
      ],
    };
    const env = await searchPlaces('Trier', ctxWith(body));
    expect(env.data![0]!.place.state).toBe('Rheinland-Pfalz');
  });
});
