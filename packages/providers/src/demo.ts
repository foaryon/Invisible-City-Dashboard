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
import { type ModuleEnvelope, type Coordinates } from '@invisible-city/contracts';
import { DEMO_BANNER_TEXT } from '@invisible-city/evidence';
import {
  brightskyWeatherFixture,
  dwdWarningsFixture,
  ubaStationsFixture,
  ubaMeasuresFixture,
  overpassPoisFixture,
  photonSearchFixture,
  photonReverseFixture,
} from '@invisible-city/test-fixtures';
import { createMemoryCache } from './cache.js';
import { type AdapterContext } from './runner.js';
import { getWeatherContext } from './adapters/brightsky.js';
import { getWarningContext } from './adapters/dwdWarnings.js';
import { getAirStationContext } from './adapters/uba.js';
import { getPoiContext } from './adapters/overpass.js';
import { searchPlaces, reverseGeocode } from './adapters/photon.js';
import { getTransitAvailability } from './adapters/transit.js';

function fixtureFetch(url: string): Promise<Response> {
  const body = (() => {
    if (url.includes('api.brightsky.dev')) return brightskyWeatherFixture;
    if (url.includes('maps.dwd.de')) return dwdWarningsFixture;
    if (url.includes('stations/json')) return ubaStationsFixture;
    if (url.includes('measures/json')) return ubaMeasuresFixture;
    if (url.includes('overpass-api.de')) return overpassPoisFixture;
    if (url.includes('photon.komoot.io/reverse')) return photonReverseFixture;
    if (url.includes('photon.komoot.io')) return photonSearchFixture;
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
  return { cache: createMemoryCache(), fetchImpl: fixtureFetch };
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
  transit(coords: Coordinates, stopCount: number | null) {
    return stampDemo(getTransitAvailability(coords, stopCount));
  },
};
