/**
 * Opt-in DEMO mode (§3.1.J).
 *
 * Demo responses are produced by running the REAL adapters against fixture
 * payloads (so normalization/validation code paths are identical), then
 * stamping the envelope: demo=true, status="demo", evidence mode "demo" and a
 * permanent demo limitation. Demo and live data can never coexist: the API
 * serves either demo or live per request, and every demo payload carries the
 * flag end-to-end.
 */
import {
  type ModuleEnvelope,
  type Coordinates,
  type AirModelContext,
} from '@invisible-city/contracts';
import { DEMO_BANNER_TEXT, makeEvidence, distanceMeters } from '@invisible-city/evidence';
import { getProvider } from './manifest.js';
import {
  brightskyWeatherFixture,
  dwdWarningsFixture,
  ubaStationsFixture,
  ubaMeasuresFixture,
  overpassPoisFixture,
  photonSearchFixture,
  photonReverseFixture,
  pegelonlineStationsFixture,
  odlLatestFixture,
  dwdPollenFixture,
  dwdUviFixture,
  brightskyRadarFixture,
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
} from '@invisible-city/test-fixtures';
import { createMemoryCache } from './cache.js';
import { demoConfig } from './config.js';
import { type AdapterContext } from './runner.js';
import { getWeatherContext } from './adapters/brightsky.js';
import { getWarningContext } from './adapters/dwdWarnings.js';
import { getAirStationContext } from './adapters/uba.js';
import { getPoiContext } from './adapters/overpass.js';
import { searchPlaces, reverseGeocode } from './adapters/photon.js';
import { getTransitContext, type MappedStop } from './adapters/transit.js';
import { getWaterLevelContext } from './adapters/pegelonline.js';
import { getRadiationContext } from './adapters/odl.js';
import { getPollenContext } from './adapters/pollen.js';
import { getUvContext } from './adapters/uvi.js';
import { getRadarContext } from './adapters/radar.js';
import { getCivilWarningContext } from './adapters/nina.js';
import { getAutobahnContext } from './adapters/autobahn.js';
import { getSeismicContext } from './adapters/geofon.js';
import { getClimateNormalsContext } from './adapters/cdcNormals.js';
import { getFuelContext } from './adapters/tankerkoenig.js';
import { getStationFacilityContext } from './adapters/dbFasta.js';

function fixtureFetch(url: string): Promise<Response> {
  // Documented plain-text interfaces (FDSN text, CDC tables) get raw text.
  const text = (() => {
    if (url.includes('geofon.gfz-potsdam.de')) return geofonEventTextFixture;
    if (url.includes('Temperatur_1991-2020_Stationsliste')) return cdcTemperatureStationsFixture;
    if (url.includes('Temperatur_1991-2020')) return cdcTemperatureValuesFixture;
    if (url.includes('Niederschlag_1991-2020_Stationsliste'))
      return cdcPrecipitationStationsFixture;
    if (url.includes('Niederschlag_1991-2020')) return cdcPrecipitationValuesFixture;
    return null;
  })();
  if (text !== null) {
    return Promise.resolve(
      new Response(text, { status: 200, headers: { 'Content-Type': 'text/plain' } }),
    );
  }
  const body = (() => {
    if (url.includes('/radar')) return brightskyRadarFixture;
    if (url.includes('api.brightsky.dev')) return brightskyWeatherFixture;
    if (url.includes('maps.dwd.de')) return dwdWarningsFixture;
    if (url.includes('stations/json')) return ubaStationsFixture;
    if (url.includes('measures/json')) return ubaMeasuresFixture;
    if (url.includes('overpass-api.de')) return overpassPoisFixture;
    if (url.includes('photon.komoot.io/reverse')) return photonReverseFixture;
    if (url.includes('photon.komoot.io')) return photonSearchFixture;
    if (url.includes('pegelonline.wsv.de')) return pegelonlineStationsFixture;
    if (url.includes('imis.bfs.de')) return odlLatestFixture;
    if (url.includes('s31fg.json')) return dwdPollenFixture;
    if (url.includes('uvi.json')) return dwdUviFixture;
    if (url.includes('sgx.geodatenzentrum.de')) return bkgVg250Fixture;
    if (url.includes('warnung.bund.de')) return ninaDashboardFixture;
    if (url.includes('/services/warning')) return autobahnWarningFixture;
    if (url.includes('/services/closure')) return { closure: [] };
    if (url.includes('/services/roadworks')) return { roadworks: [] };
    if (url.includes('verkehr.autobahn.de')) return autobahnRoadsFixture;
    if (url.includes('tankerkoenig.de')) return tankerkoenigListFixture;
    if (url.includes('apis.deutschebahn.com')) return dbFastaFixture;
    throw new Error(`No demo fixture for ${url}`);
  })();
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

export function demoContext(): AdapterContext {
  return { cache: createMemoryCache(), config: demoConfig(), fetchImpl: fixtureFetch };
}

/**
 * Demo context for the key-gated providers: dummy credentials activate the
 * REAL adapter code paths against fixtures. Demo only — live requests never
 * see these values.
 */
function demoContextWithKeys(): AdapterContext {
  return {
    cache: createMemoryCache(),
    config: {
      ...demoConfig(),
      tankerkoenigApiKey: 'demo',
      dbClientId: 'demo',
      dbApiKey: 'demo',
    },
    fetchImpl: fixtureFetch,
  };
}

export function stampDemo<T>(envelope: ModuleEnvelope<T>): ModuleEnvelope<T> {
  return {
    ...envelope,
    status: 'demo',
    demo: true,
    evidence: envelope.evidence.map((e) => ({
      ...e,
      mode: 'demo',
      limitations: [DEMO_BANNER_TEXT, ...e.limitations],
    })),
    limitations: [DEMO_BANNER_TEXT, ...envelope.limitations],
    statusDetail: DEMO_BANNER_TEXT,
  };
}

export const demoAdapters = {
  async weather(coords: Coordinates, fromIso: string, toIso: string) {
    return stampDemo(await getWeatherContext(coords, fromIso, toIso, demoContext()));
  },
  async warnings(coords: Coordinates) {
    return stampDemo(await getWarningContext(coords, demoContext()));
  },
  async airStations(coords: Coordinates) {
    return stampDemo(await getAirStationContext(coords, demoContext()));
  },
  async pois(coords: Coordinates) {
    return stampDemo(await getPoiContext(coords, demoContext()));
  },
  async search(query: string) {
    return stampDemo(await searchPlaces(query, demoContext()));
  },
  async reverse(coords: Coordinates) {
    return stampDemo(await reverseGeocode(coords, demoContext()));
  },
  async transit(coords: Coordinates, mappedStops: MappedStop[], selectedIso: string) {
    return stampDemo(await getTransitContext(coords, mappedStops, selectedIso, demoContext()));
  },
  async water(coords: Coordinates) {
    return stampDemo(await getWaterLevelContext(coords, demoContext()));
  },
  async radiation(coords: Coordinates) {
    return stampDemo(await getRadiationContext(coords, demoContext()));
  },
  async pollen(state: string | null) {
    return stampDemo(await getPollenContext(state ?? 'Berlin', demoContext()));
  },
  async uv(coords: Coordinates) {
    return stampDemo(await getUvContext(coords, demoContext()));
  },
  async radar(coords: Coordinates) {
    return stampDemo(await getRadarContext(coords, demoContext()));
  },
  async civilWarnings(coords: Coordinates) {
    return stampDemo(await getCivilWarningContext(coords, demoContext()));
  },
  async autobahn(coords: Coordinates) {
    return stampDemo(await getAutobahnContext(coords, demoContext()));
  },
  async quakes(coords: Coordinates) {
    return stampDemo(await getSeismicContext(coords, demoContext()));
  },
  async climateNormals(coords: Coordinates) {
    return stampDemo(await getClimateNormalsContext(coords, demoContext()));
  },
  async fuel(coords: Coordinates) {
    return stampDemo(await getFuelContext(coords, demoContextWithKeys()));
  },
  async stationFacilities(coords: Coordinates) {
    return stampDemo(await getStationFacilityContext(coords, demoContextWithKeys()));
  },
  /**
   * CAMS has no keyless live path, so its demo payload is constructed directly
   * (a real NetCDF retrieval is impossible without a key). It is stamped demo
   * end-to-end and snapped to a 0.1° grid cell to mirror the real behaviour —
   * a regional value, never address-level.
   */
  airModel(coords: Coordinates): ModuleEnvelope<AirModelContext> {
    const provider = getProvider('cams-eu-airquality');
    const cellLat = Math.round(coords.latitude * 10) / 10;
    const cellLon = Math.round(coords.longitude * 10) / 10;
    const validAt = new Date().toISOString();
    const offsetMeters = Math.round(
      distanceMeters(coords, { latitude: cellLat, longitude: cellLon }),
    );
    const data: AirModelContext = {
      cellLatitude: cellLat,
      cellLongitude: cellLon,
      resolutionKm: 11,
      offsetMeters,
      values: [
        { pollutant: 'PM2', value: 8.7, unit: 'µg/m³', mode: 'modelled', validAt },
        { pollutant: 'PM10', value: 15.4, unit: 'µg/m³', mode: 'modelled', validAt },
        { pollutant: 'NO2', value: 21.9, unit: 'µg/m³', mode: 'modelled', validAt },
        { pollutant: 'O3', value: 62.1, unit: 'µg/m³', mode: 'modelled', validAt },
      ],
    };
    return stampDemo({
      status: 'ok',
      demo: false,
      data,
      evidence: [
        makeEvidence(provider, {
          mode: 'modelled',
          method:
            'CAMS-Ensemble (Median aus 11 europäischen Modellen), nächstgelegene Rasterzelle. Regionaler modellierter Hintergrund — kein adressgenauer Wert; nicht mit Stationsmessungen zusammenführbar.',
          spatial: { kind: 'grid', resolutionKm: 11 },
          completeness: 'complete',
          retrievedAt: validAt,
          validAt,
          limitations: [
            `Rasterzelle ~11 km, Zellzentrum ${offsetMeters} m vom gewählten Punkt entfernt.`,
          ],
        }),
      ],
      limitations: provider.knownLimitations,
      retrievedAt: validAt,
    });
  },
};
