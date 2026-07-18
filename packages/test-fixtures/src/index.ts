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
    {
      type: 'node',
      id: 771100001,
      lat: 52.5205,
      lon: 13.4088,
      tags: { emergency: 'defibrillator', name: 'AED Rathaus-Passage (Demo)' },
    },
    {
      type: 'way',
      id: 771100002,
      center: { lat: 52.5188, lon: 13.3765 },
      tags: { amenity: 'hospital', name: 'Demo-Klinikum Mitte' },
    },
    {
      type: 'node',
      id: 771100003,
      lat: 52.5241,
      lon: 13.4159,
      tags: { amenity: 'fire_station', name: 'Feuerwache Mitte (Demo)' },
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

/** Raw shape of PEGELONLINE `stations.json` (radius query, current measurements). */
export const pegelonlineStationsFixture = [
  {
    uuid: 'demo-pegel-1',
    number: '5803200',
    shortname: 'BERLIN SCHLEUSE UW',
    longname: 'Berlin Schleuse Unterwasser (Demo)',
    km: 12.5,
    agency: 'WSA SPREE-HAVEL',
    longitude: 13.4046,
    latitude: 52.5142,
    water: { shortname: 'SPREE', longname: 'Spree' },
    timeseries: [
      {
        shortname: 'W',
        longname: 'Wasserstand',
        unit: 'cm',
        equidistance: 15,
        currentMeasurement: {
          timestamp: '2026-07-16T11:45:00+02:00',
          value: 312.0,
          stateMnwMhw: 'normal',
          stateNswHsw: 'unknown',
        },
      },
    ],
  },
  {
    uuid: 'demo-pegel-2',
    number: '5803400',
    shortname: 'SOPHIENWERDER',
    longname: 'Sophienwerder (Demo)',
    km: 0.6,
    agency: 'WSA SPREE-HAVEL',
    longitude: 13.1892,
    latitude: 52.5386,
    water: { shortname: 'HAVEL', longname: 'Havel' },
    timeseries: [
      {
        shortname: 'W',
        longname: 'Wasserstand',
        unit: 'cm',
        equidistance: 15,
        currentMeasurement: {
          timestamp: '2026-07-16T11:45:00+02:00',
          value: 29.0,
          stateMnwMhw: 'low',
        },
      },
    ],
  },
];

/** Raw shape of the BfS ODL WFS GeoJSON layer `odlinfo_odl_1h_latest`. */
export const odlLatestFixture = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'odlinfo_odl_1h_latest.110000006',
      geometry: { type: 'Point', coordinates: [13.4105, 52.5244] },
      properties: {
        kenn: '110000006',
        name: 'Berlin-Mitte (Demo)',
        value: 0.078,
        unit: 'µSv/h',
        start_measure: '2026-07-16T09:00:00Z',
        end_measure: '2026-07-16T10:00:00Z',
        site_status: 1,
        site_status_text: 'in Betrieb',
      },
    },
    {
      type: 'Feature',
      id: 'odlinfo_odl_1h_latest.110000012',
      geometry: { type: 'Point', coordinates: [13.287, 52.4675] },
      properties: {
        kenn: '110000012',
        name: 'Berlin-Dahlem (Demo)',
        value: 0.083,
        unit: 'µSv/h',
        start_measure: '2026-07-16T09:00:00Z',
        end_measure: '2026-07-16T10:00:00Z',
        site_status: 1,
        site_status_text: 'in Betrieb',
      },
    },
  ],
  totalFeatures: 2,
};

/** Raw shape of the DWD pollen hazard index `s31fg.json`. */
export const dwdPollenFixture = {
  name: 'Pollenflug-Gefahrenindex',
  sender: 'Deutscher Wetterdienst - Medizin-Meteorologie',
  last_update: '2026-07-16 11:00 Uhr',
  next_update: '2026-07-17 11:00 Uhr',
  legend: {
    id1: '0',
    id1_desc: 'keine Belastung',
    id2: '0-1',
    id2_desc: 'keine bis geringe Belastung',
    id3: '1',
    id3_desc: 'geringe Belastung',
    id4: '1-2',
    id4_desc: 'geringe bis mittlere Belastung',
    id5: '2',
    id5_desc: 'mittlere Belastung',
    id6: '2-3',
    id6_desc: 'mittlere bis hohe Belastung',
    id7: '3',
    id7_desc: 'hohe Belastung',
  },
  content: [
    {
      region_id: 50,
      region_name: 'Brandenburg und Berlin',
      partregion_id: -1,
      partregion_name: '',
      Pollen: {
        Graeser: { today: '2', tomorrow: '1-2', dayafter_to: '1' },
        Beifuss: { today: '0-1', tomorrow: '0-1', dayafter_to: '0-1' },
        Birke: { today: '0', tomorrow: '0', dayafter_to: '0' },
      },
    },
    {
      region_id: 121,
      region_name: 'Bayern',
      partregion_id: 121,
      partregion_name: 'Allgäu/Oberbayern/Bay. Wald',
      Pollen: {
        Graeser: { today: '1', tomorrow: '1', dayafter_to: '0-1' },
      },
    },
    {
      region_id: 122,
      region_name: 'Bayern',
      partregion_id: 122,
      partregion_name: 'Donauniederungen',
      Pollen: {
        Graeser: { today: '2', tomorrow: '1-2', dayafter_to: '1' },
      },
    },
  ],
};

/** Raw shape of the DWD UV index forecast `uvi.json`. */
export const dwdUviFixture = {
  last_update: '2026-07-16 10:00 Uhr',
  content: [
    { city: 'Berlin', forecast: { today: 6, tomorrow: 6, dayafter_to: 5 } },
    { city: 'München', forecast: { today: 7, tomorrow: 6, dayafter_to: 6 } },
    { city: 'Ort-ohne-Koordinate', forecast: { today: 5, tomorrow: 5, dayafter_to: 4 } },
  ],
};

/** Raw shape of the Bright Sky `/radar` endpoint (format=plain, small crop). */
export const brightskyRadarFixture = {
  radar: [
    {
      timestamp: '2026-07-16T09:50:00+00:00',
      source: 'RADOLAN::RV::2026-07-16T09:50:00+00:00',
      precipitation_5: [
        [0, 0, 2],
        [0, 12, 5],
        [0, 3, 0],
      ],
    },
    {
      timestamp: '2026-07-16T09:55:00+00:00',
      source: 'RADOLAN::RV::2026-07-16T09:50:00+00:00',
      precipitation_5: [
        [0, 1, 4],
        [2, 25, 9],
        [0, 6, 1],
      ],
    },
  ],
  latlon_position: { x: 1.2, y: 1.4 },
};

/** Raw shape of the BKG VG250 WFS GetFeature response (vg250_gem, point intersect). */
export const bkgVg250Fixture = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'vg250_gem.1',
      properties: {
        ars: '110000000000',
        ags: '11000000',
        gen: 'Berlin',
        bez: 'Stadt',
      },
      geometry: null,
    },
  ],
};

/** Raw shape of the NINA dashboard response per district ARS. */
export const ninaDashboardFixture = [
  {
    id: 'mow.DE-BE-W042-DEMO',
    payload: {
      version: 2,
      type: 'ALERT',
      id: 'mow.DE-BE-W042-DEMO',
      data: {
        headline: 'Warnung vor Schadstoffausbreitung nach Brand (Demo-Fixture)',
        provider: 'MOWAS',
        severity: 'Minor',
        msgType: 'Alert',
        transKeys: { event: 'BBK-EVC-040' },
      },
    },
    sent: '2026-07-16T09:12:00+02:00',
  },
];

/** Raw shape of the Autobahn API: road list + one per-kind response. */
export const autobahnRoadsFixture = { roads: ['A10', 'A100'] };

export const autobahnWarningFixture = {
  warning: [
    {
      identifier: 'demo-warning-1',
      title: 'A10 | AD Barnim Richtung AD Schwanebeck (Demo)',
      subtitle: 'Stau (Demo-Fixture)',
      coordinate: { lat: '52.6390', long: '13.4980' },
      startTimestamp: '2026-07-16T08:30:00.000+02:00',
    },
  ],
};

export const autobahnEmptyKindFixture = { closure: [] };

/** FDSN event web service `format=text` response (GEOFON). */
export const geofonEventTextFixture = [
  '#EventID|Time|Latitude|Longitude|Depth/km|Author|Catalog|Contributor|ContributorID|MagType|Magnitude|MagAuthor|EventLocationName',
  'gfz2026demo1|2026-07-10T02:14:31.5|52.301|13.121|8.0|GFZ|GEOFON|GFZ|gfz2026demo1|ML|2.1|GFZ|Brandenburg, Germany (Demo)',
  'gfz2026demo2|2026-06-28T22:01:02.0|50.902|12.402|11.0|GFZ|GEOFON|GFZ|gfz2026demo2|ML|2.8|GFZ|Saxony, Germany (Demo)',
].join('\n');

/** DWD CDC multi-annual tables (station list + values), documented layout. */
export const cdcTemperatureStationsFixture = [
  'Stations_id;Stationshoehe;Geogr.Breite;Geogr.Laenge;von_datum;bis_datum;Stationsname',
  '   433;48;52.4675;13.4021;19510101;20201231;Berlin-Tempelhof',
  '  1048;228;51.1280;13.7543;19510101;20201231;Dresden-Klotzsche',
].join('\n');

export const cdcTemperatureValuesFixture = [
  'Stations_id;Jan.;Feb.;Mrz.;Apr.;Mai;Jun.;Jul.;Aug.;Sep.;Okt.;Nov.;Dez.;Jahr',
  '   433;1.2;2.0;5.1;10.2;14.9;18.3;20.1;19.6;15.2;10.1;5.3;2.2;10.4',
  '  1048;0.5;1.4;4.6;9.6;14.0;17.4;19.4;19.0;14.5;9.5;4.6;1.5;9.7',
].join('\n');

export const cdcPrecipitationStationsFixture = [
  'Stations_id;Stationshoehe;Geogr.Breite;Geogr.Laenge;von_datum;bis_datum;Stationsname',
  '   433;48;52.4675;13.4021;19510101;20201231;Berlin-Tempelhof',
].join('\n');

export const cdcPrecipitationValuesFixture = [
  'Stations_id;Jan.;Feb.;Mrz.;Apr.;Mai;Jun.;Jul.;Aug.;Sep.;Okt.;Nov.;Dez.;Jahr',
  '   433;44;36;39;31;53;62;71;58;45;42;40;49;570',
].join('\n');

/** Raw shape of the Tankerkönig `list.php` response. */
export const tankerkoenigListFixture = {
  ok: true,
  license: 'CC BY 4.0 - https://creativecommons.tankerkoenig.de',
  data: 'MTS-K',
  status: 'ok',
  stations: [
    {
      id: 'demo-station-1',
      name: 'Demo Tankstelle Mitte',
      brand: 'DEMO',
      street: 'Beispielstr. 1',
      place: 'Berlin',
      lat: 52.5245,
      lng: 13.4102,
      dist: 0.6,
      diesel: 1.639,
      e5: 1.789,
      e10: 1.729,
      isOpen: true,
      houseNumber: '1',
      postCode: 10178,
    },
    {
      id: 'demo-station-2',
      name: 'Demo Tankstelle Ost',
      brand: 'DEMO',
      street: 'Musterallee 2',
      place: 'Berlin',
      lat: 52.5129,
      lng: 13.4519,
      dist: 3.2,
      diesel: 1.619,
      e5: false,
      e10: 1.709,
      isOpen: false,
      houseNumber: '2',
      postCode: 10245,
    },
  ],
};

/** Raw shape of the DB FaSta v2 `facilities` response. */
export const dbFastaFixture = [
  {
    equipmentnumber: 10499721,
    type: 'ELEVATOR',
    state: 'ACTIVE',
    description: 'zu Gleis 1/2 (Demo)',
    geocoordX: 13.4106,
    geocoordY: 52.5219,
    stationnumber: 527,
  },
  {
    equipmentnumber: 10499722,
    type: 'ELEVATOR',
    state: 'INACTIVE',
    description: 'zu Gleis 3/4 (Demo)',
    geocoordX: 13.4108,
    geocoordY: 52.5221,
    stationnumber: 527,
  },
  {
    equipmentnumber: 10999999,
    type: 'ESCALATOR',
    state: 'UNKNOWN',
    description: 'weit entfernt (Demo)',
    geocoordX: 11.0,
    geocoordY: 49.0,
    stationnumber: 999,
  },
];

/** Malformed payloads for negative tests (schema rejection paths). */
export const malformedFixtures = {
  brightsky: { wetter: [] },
  dwdWarnings: { type: 'FeatureCollection', features: [{ properties: 'not-an-object' }] },
  ubaMeasures: { data: 'not-a-record' },
  overpass: { elements: 'nope' },
  photon: { features: [{ geometry: { coordinates: ['x'] } }] },
  pegelonline: { stations: 'not-an-array' },
  odl: { type: 'FeatureCollection', features: 'nope' },
  pollen: { content: [{ region_id: 'x' }] },
  uvi: { content: [{ city: 42 }] },
  radar: { radar: [{ timestamp: '2026-07-16T09:50:00+00:00', precipitation_5: 'nope' }] },
  nina: [{ payload: 'not-an-object' }],
  autobahnRoads: { roads: 'nope' },
  geofonText: 'gfz2026broken|2026-07-10T02:14:31.5|not-enough-columns',
  cdcTable: 'kaputt',
  tankerkoenig: { ok: false, message: 'apikey invalid' },
  fasta: [{ equipmentnumber: 'not-a-number' }],
};
