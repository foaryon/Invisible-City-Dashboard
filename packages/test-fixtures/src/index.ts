/**
 * @invisible-city/test-fixtures
 *
 * Raw provider-shaped fixtures for adapter tests and for the opt-in DEMO mode.
 * DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN. These payloads are invented
 * test data in the *shape* of the documented provider interfaces; they must
 * never be served without the demo flag and permanent demo labelling.
 */

export const DEMO_PLACE = {
  id: 'demo:berlin-mitte',
  label: 'Berlin-Mitte (Demo)',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  locality: 'Mitte',
  municipality: 'Berlin',
  state: 'Berlin',
  country: 'DE' as const,
};

/** Raw shape of the Bright Sky `/weather` JSON endpoint. */
export const brightskyWeatherFixture = {
  weather: [
    {
      timestamp: '2026-07-16T10:00:00+00:00',
      source_id: 6007,
      precipitation: 0.0,
      temperature: 24.3,
      wind_speed: 11.2,
      wind_gust_speed: 27.0,
      relative_humidity: 48,
      condition: 'dry',
      icon: 'partly-cloudy-day',
    },
    {
      timestamp: '2026-07-16T11:00:00+00:00',
      source_id: 6008,
      precipitation: 0.2,
      temperature: 25.1,
      wind_speed: 13.0,
      wind_gust_speed: 31.0,
      relative_humidity: 45,
      condition: 'rain',
      icon: 'rain',
    },
    {
      timestamp: '2026-07-16T12:00:00+00:00',
      source_id: 6008,
      precipitation: null,
      temperature: 26.0,
      wind_speed: null,
      wind_gust_speed: null,
      relative_humidity: 44,
      condition: null,
      icon: null,
    },
  ],
  sources: [
    {
      id: 6007,
      dwd_station_id: '00433',
      observation_type: 'current',
      lat: 52.4675,
      lon: 13.4021,
      height: 48,
      station_name: 'Berlin-Tempelhof',
      distance: 6100,
    },
    {
      id: 6008,
      dwd_station_id: '00433',
      observation_type: 'forecast',
      lat: 52.4675,
      lon: 13.4021,
      height: 48,
      station_name: 'Berlin-Tempelhof',
      distance: 6100,
    },
  ],
};

/** Raw shape of a DWD GeoServer WFS GeoJSON response (dwd:Warnungen_Gemeinden). */
export const dwdWarningsFixture = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'Warnungen_Gemeinden.demo.1',
      properties: {
        WARNCELLID: 811000000,
        NAME: 'Stadt Berlin',
        EVENT: 'HITZE',
        SEVERITY: 'Moderate',
        HEADLINE: 'Amtliche WARNUNG vor HITZE',
        DESCRIPTION:
          'Am Donnerstag wird eine starke Wärmebelastung erwartet. (Demo-Fixture, kein reales Ereignis.)',
        EFFECTIVE: '2026-07-16T08:00:00Z',
        ONSET: '2026-07-16T09:00:00Z',
        EXPIRES: '2026-07-16T17:00:00Z',
        EC_LICENSE: '© GeoBasis-DE / BKG 2026 (Daten modifiziert)',
      },
      geometry: null,
    },
  ],
  totalFeatures: 1,
};

/**
 * Raw shape of UBA Air Data API v3 `stations/json`.
 * Station rows are positional arrays; positions per API `indices` metadata
 * (re-verification recorded in docs/data-sources.md).
 */
export const ubaStationsFixture = {
  request: { datetime_from: '2026-07-16 09:00:00', datetime_to: '2026-07-16 12:00:00' },
  data: {
    '145': [
      '145',
      'DEBE065',
      'Berlin Nansenstraße',
      'Berlin',
      null,
      '1997-01-01',
      null,
      '13.431944',
      '52.489444',
      '1',
      'Berlin',
      '',
      '',
      'Hintergrund',
      'städtisches Gebiet',
    ],
    '171': [
      '171',
      'DEBE010',
      'Berlin Wedding',
      'Berlin',
      null,
      '1986-10-01',
      null,
      '13.349722',
      '52.542778',
      '1',
      'Berlin',
      '',
      '',
      'Hintergrund',
      'städtisches Gebiet',
    ],
  },
};

/**
 * Raw shape of UBA Air Data API v3 `measures/json` for one station+component.
 * data[stationId] maps "start timestamp" (CET/MEZ) to a positional array
 * [componentId, scopeId, value, dateEnd, index].
 */
export const ubaMeasuresFixture = {
  request: { station: '145', component: '9' },
  data: {
    '145': {
      '2026-07-16 11:00:00': [9, 2, 8.4, '2026-07-16 12:00:00', null],
      '2026-07-16 12:00:00': [9, 2, 9.1, '2026-07-16 13:00:00', null],
    },
  },
};

/** Raw shape of an Overpass API JSON response. */
export const overpassPoisFixture = {
  version: 0.6,
  generator: 'Overpass API (demo fixture)',
  osm3s: { timestamp_osm_base: '2026-07-16T09:00:00Z' },
  elements: [
    {
      type: 'way',
      id: 38018261,
      center: { lat: 52.5163, lon: 13.3777 },
      tags: { leisure: 'park', name: 'Tiergarten (Demo)' },
    },
    {
      type: 'node',
      id: 29220982,
      lat: 52.5219,
      lon: 13.4132,
      tags: { amenity: 'pharmacy', name: 'Demo-Apotheke' },
    },
    {
      type: 'node',
      id: 29220999,
      lat: 52.5215,
      lon: 13.4095,
      tags: { amenity: 'toilets' },
    },
    {
      type: 'node',
      id: 29221042,
      lat: 52.5228,
      lon: 13.401,
      tags: { amenity: 'drinking_water' },
    },
    {
      type: 'node',
      id: 662771986,
      lat: 52.5208,
      lon: 13.4094,
      tags: { public_transport: 'stop_position', name: 'U Rotes Rathaus (Demo)' },
    },
  ],
};

/** Raw shape of a Photon search response (GeoJSON). */
export const photonSearchFixture = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [13.405, 52.52] },
      properties: {
        osm_id: 240109189,
        osm_type: 'N',
        osm_key: 'place',
        osm_value: 'city',
        name: 'Berlin',
        state: 'Berlin',
        country: 'Deutschland',
        countrycode: 'DE',
        type: 'city',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10.8978, 48.3705] },
      properties: {
        osm_id: 2919840,
        osm_type: 'R',
        osm_key: 'place',
        osm_value: 'city',
        name: 'Augsburg',
        state: 'Bayern',
        country: 'Deutschland',
        countrycode: 'DE',
        type: 'city',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.3514, 48.8575] },
      properties: {
        osm_id: 71525,
        osm_type: 'R',
        osm_key: 'place',
        osm_value: 'city',
        name: 'Paris',
        country: 'France',
        countrycode: 'FR',
        type: 'city',
      },
    },
  ],
};

/** Raw shape of a Photon reverse-geocoding response (GeoJSON). */
export const photonReverseFixture = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [13.4049, 52.5201] },
      properties: {
        osm_id: 240109189,
        osm_type: 'N',
        osm_key: 'place',
        osm_value: 'neighbourhood',
        name: 'Mitte',
        city: 'Berlin',
        state: 'Berlin',
        country: 'Deutschland',
        countrycode: 'DE',
      },
    },
  ],
};

/** Malformed payloads for negative tests (schema rejection paths). */
export const malformedFixtures = {
  brightsky: { wetter: [] },
  dwdWarnings: { type: 'FeatureCollection', features: [{ properties: 'not-an-object' }] },
  ubaMeasures: { data: 'not-a-record' },
  overpass: { elements: 'nope' },
  photon: { features: [{ geometry: { coordinates: ['x'] } }] },
};
