/**
 * Provider manifest (§5.2) — versioned, machine-readable source register.
 *
 * Seed values follow the verified provider register of the product charter
 * (verified July 2026). Only providers with status "verified" may serve live
 * production responses. Open verification tasks are listed per provider under
 * `toVerify` and mirrored in docs/data-sources.md.
 *
 * NOTE: live endpoint re-verification from the build environment was blocked
 * by its egress network policy on 2026-07-16; runtime Zod validation rejects
 * any response that does not match the documented schema instead of guessing.
 */
import { ProviderManifestEntrySchema, type ProviderManifestEntry } from '@invisible-city/contracts';

export const MANIFEST_VERSION = '2026-07-16.1';

const entries: ProviderManifestEntry[] = [
  {
    providerId: 'dwd-brightsky',
    displayName: 'Bright Sky (DWD-Daten)',
    institution: 'Deutscher Wetterdienst (Daten); Bright Sky / Jakob de Maeyer (Zugangsschicht)',
    sourceCategory: 'unofficial-access-layer',
    originalSourceUrl: 'https://opendata.dwd.de',
    technicalEndpoint: 'https://api.brightsky.dev/weather',
    accessMethod: 'HTTPS GET, JSON, kein API-Key',
    license: 'Daten: CC BY 4.0 (DWD); Zugangsschicht: MIT (Open Source)',
    attributionText: 'Quelle: Deutscher Wetterdienst',
    coverage: 'Deutschland (DWD-Stationsnetz, MOSMIX-Vorhersagepunkte)',
    updateCadence: 'MOSMIX 4x täglich; Beobachtungen stündlich',
    supportedDataModes: ['observed', 'forecast'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'brightsky-v1',
    cachePolicy: {
      ttlSeconds: 1800,
      rationale:
        'MOSMIX erscheint 4x täglich, Beobachtungen stündlich; DWD garantiert keine Dienstverfügbarkeit — Cache ist Pflicht.',
    },
    status: 'verified',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Bright Sky ist eine INOFFIZIELLE Zugangsschicht über DWD-Daten (dokumentierter direkter opendata.dwd.de-Pfad als Fallback).',
      'Werte stammen von der nächstgelegenen DWD-Station/-Vorhersagepunkt, nicht vom gewählten Pin.',
      'Kein Anspruch auf Verfügbarkeit der DWD-Dienste.',
    ],
    toVerify: [
      'Antwortschema live gegen api.brightsky.dev re-verifizieren (Egress im Build-Umfeld blockiert, 2026-07-16).',
    ],
  },
  {
    providerId: 'dwd-warnings',
    displayName: 'DWD Amtliche Warnungen',
    institution: 'Deutscher Wetterdienst',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://www.dwd.de',
    technicalEndpoint:
      'https://maps.dwd.de/geoserver/dwd/ows (WFS 2.0, Layer dwd:Warnungen_Gemeinden, CQL-Filter, JSON)',
    accessMethod: 'HTTPS GET (WFS GetFeature), GeoJSON, kein API-Key',
    license: 'CC BY 4.0 (DWD); Warn-Geometrien ggf. © GeoBasis-DE / BKG (Jahr) (Daten modifiziert)',
    attributionText: 'Quelle: Deutscher Wetterdienst',
    coverage: 'Deutschland, Gemeindeebene',
    updateCadence: 'ereignisgesteuert; Geodienste laut DWD ~98 % verfügbar, ohne Rechtsanspruch',
    supportedDataModes: ['observed', 'forecast'],
    geographicSemantics: ['geometry'],
    validationSchemaVersion: 'dwd-wfs-v1',
    cachePolicy: {
      ttlSeconds: 300,
      rationale: 'Warnlagen sind zeitkritisch; kurzer Cache nur zur Lastbegrenzung.',
    },
    status: 'verified',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Warnungen sind quellendefinierte Gebiete/Ereignisse, keine lokal abgeleitete Schwere.',
      'Kein Anspruch auf Verfügbarkeit der DWD-Geodienste.',
    ],
    toVerify: [
      'Geometriespalten-Name für CQL-INTERSECTS-Filter live verifizieren (dokumentiert: THE_GEOM).',
      'Antwort-Property-Namen (EVENT/SEVERITY/ONSET/EXPIRES/EC_LICENSE) live re-verifizieren.',
    ],
  },
  {
    providerId: 'uba-airdata',
    displayName: 'UBA Luftdaten (Stationsmessungen)',
    institution: 'Umweltbundesamt / Messnetze der Länder',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://luftdaten.umweltbundesamt.de/',
    technicalEndpoint: 'https://luftdaten.umweltbundesamt.de/api/air_data/v3',
    accessMethod: 'HTTPS GET, JSON, kein API-Key',
    license: 'Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0)',
    attributionText: 'Umweltbundesamt',
    coverage: 'Deutschland, >400 Messstationen',
    updateCadence: 'stündlich',
    supportedDataModes: ['observed'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'uba-v3',
    cachePolicy: {
      ttlSeconds: 900,
      rationale: 'Stündliche Messwerte; 15-Minuten-Cache begrenzt Last ohne Aktualitätsverlust.',
    },
    status: 'verified',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Daten des laufenden Jahres sind vorläufig („nicht endgültig geprüft“); endgültige Daten erscheinen im Juni des Folgejahres.',
      'Das UBA garantiert keine Vollständigkeit.',
      'Zeitstempel der JSON-API in MEZ/CET (ohne Sommerzeit) — Normalisierung dokumentiert, Originalzeit in der Evidenz erhalten.',
      'Eine Stationsmessung ist nicht die Luftqualität jeder nahegelegenen Straße.',
    ],
    toVerify: [
      'Positionsindizes der stations/json- und measures/json-Arrays gegen die "indices"-Metadaten der API re-verifizieren.',
      'Komponenten-IDs (PM10=1, CO=2, O3=3, SO2=4, NO2=5, PM2=9) und Scope-Semantik live re-verifizieren.',
      'API-Versionsbezeichnung (v3 vs. v4) gegen die aktuelle Doku prüfen.',
    ],
  },
  {
    providerId: 'osm-overpass',
    displayName: 'OpenStreetMap (Overpass API)',
    institution: 'OpenStreetMap-Community / OpenStreetMap Foundation',
    sourceCategory: 'cartographic-supplementary',
    originalSourceUrl: 'https://www.openstreetmap.org/copyright',
    technicalEndpoint: 'https://overpass-api.de/api/interpreter',
    accessMethod: 'HTTPS POST (Overpass QL), JSON',
    license: 'ODbL',
    attributionText: '© OpenStreetMap contributors (ODbL)',
    coverage: 'Deutschland (weltweit), Vollständigkeit unbekannt',
    updateCadence: 'kontinuierlich (Community-Edits, Minutely Diffs)',
    supportedDataModes: ['mapped'],
    geographicSemantics: ['geometry'],
    validationSchemaVersion: 'overpass-v1',
    cachePolicy: {
      ttlSeconds: 21600,
      rationale:
        'Fair-Use der öffentlichen Overpass-Instanz: eine Anfrage zugleich, keine Parallelanfragen; POI-Kontext ändert sich langsam.',
    },
    status: 'verified',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Kartierter Kontext, keine Betriebsgarantie: keine Aussage zu Öffnung, Zustand, Sicherheit, Schatten oder Barrierefreiheit.',
      'Vollständigkeit und Alter der Kartierung sind unbekannt.',
      'Öffentliche Instanz drosselt (HTTP 429) bei Überlastung.',
    ],
    toVerify: [],
  },
  {
    providerId: 'photon-geocoding',
    displayName: 'Photon Geokodierung (OSM-Daten)',
    institution: 'komoot (Software) / OpenStreetMap-Community (Daten)',
    sourceCategory: 'cartographic-supplementary',
    originalSourceUrl: 'https://photon.komoot.io/',
    technicalEndpoint: 'https://photon.komoot.io/api (Suche), /reverse (Reverse)',
    accessMethod: 'HTTPS GET, GeoJSON, kein API-Key',
    license: 'Code: Apache-2.0; Daten: ODbL (OSM)',
    attributionText: '© OpenStreetMap contributors (ODbL)',
    coverage: 'weltweit; Produkt filtert auf Deutschland (countrycode DE)',
    updateCadence: 'wöchentliche Datendumps (öffentliche Demo-Instanz)',
    supportedDataModes: ['mapped'],
    geographicSemantics: ['geometry'],
    validationSchemaVersion: 'photon-v1',
    cachePolicy: {
      ttlSeconds: 86400,
      rationale:
        'Öffentliche Demo-Instanz ohne Verfügbarkeitsgarantie; Ergebnisse werden gecacht, Anfragen gedrosselt.',
    },
    status: 'verified',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Öffentliche Demo-Instanz: keine Verfügbarkeitsgarantie, extensive Nutzung wird gedrosselt; für Produktion Self-Hosting empfohlen.',
      'Geokodierungs-Label sind kartierter Kontext (OSM), keine amtliche Adresse.',
    ],
    toVerify: [
      'Für den Produktivbetrieb: selbstgehostete Photon-Instanz aufsetzen und Endpoint umstellen.',
    ],
  },
  {
    providerId: 'openfreemap-basemap',
    displayName: 'OpenFreeMap Basiskarte',
    institution: 'OpenFreeMap (hyperknot) / OpenMapTiles / OpenStreetMap-Community',
    sourceCategory: 'cartographic-supplementary',
    originalSourceUrl: 'https://openfreemap.org/',
    technicalEndpoint: 'https://tiles.openfreemap.org/styles/liberty',
    accessMethod: 'MapLibre GL Style JSON + Vektor-Tiles, kein API-Key, keine Registrierung',
    license: 'Code: MIT; Daten: OSM (ODbL)',
    attributionText: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap',
    coverage: 'weltweit',
    updateCadence: 'regelmäßige Tile-Updates (öffentliche Instanz)',
    supportedDataModes: ['mapped'],
    geographicSemantics: ['geometry'],
    validationSchemaVersion: 'style-json-v1',
    cachePolicy: { ttlSeconds: 0, rationale: 'Tiles werden vom Browser/CDN gecacht.' },
    status: 'verified',
    reviewDate: '2026-07-16',
    knownLimitations: ['Basiskarte ist kartografischer Kontext, keine Datenaussage.'],
    toVerify: [],
  },
  {
    providerId: 'delfi-gtfs',
    displayName: 'DELFI GTFS (Soll-Fahrplan, deutschlandweit)',
    institution: 'DELFI e.V.',
    sourceCategory: 'transport-association',
    originalSourceUrl: 'https://www.opendata-oepnv.de/',
    technicalEndpoint: 'Download-Datensatz (GTFS/NeTEx) über opendata-oepnv.de',
    accessMethod: 'Registrierung + Bulk-Download; kein Live-HTTP-API',
    license: 'siehe opendata-oepnv.de (DELFI-Datensatz); Namensnennung DELFI e.V. erforderlich',
    attributionText: 'Datenquelle: DELFI e.V.',
    coverage: 'Deutschland (teilnehmende Verbünde)',
    updateCadence: 'typischerweise wöchentlich (montags)',
    supportedDataModes: ['scheduled'],
    geographicSemantics: ['coverage'],
    validationSchemaVersion: 'gtfs-static-v1',
    cachePolicy: { ttlSeconds: 604800, rationale: 'Wöchentlicher Datensatz.' },
    status: 'proposed',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Ein geplanter Halt ist keine Echtzeit-Abfahrt.',
      'Noch nicht integriert: Registrierung, Download-Pipeline und Feed-Validierung stehen aus.',
    ],
    toVerify: [
      'Registrierung bei opendata-oepnv.de, Lizenzbedingungen des DELFI-Datensatzes dokumentieren.',
      'GTFS-Feed-Gültigkeitszeitraum und Stop-Matching validieren, bevor der Provider aktiviert wird.',
    ],
  },
  {
    providerId: 'delfi-gtfs-rt',
    displayName: 'GTFS-Realtime (DELFI DEEZ / gtfs.de)',
    institution: 'DELFI e.V. / gtfs.de (Aufbereitung)',
    sourceCategory: 'transport-association',
    originalSourceUrl: 'https://gtfs.de/de/realtime/',
    technicalEndpoint: 'GTFS-RT-Stream (Mobilithek bzw. gtfs.de)',
    accessMethod: 'Registrierung (Mobilithek) bzw. gtfs.de-Stream',
    license: 'gtfs.de GTFS-RT: CC BY-SA 4.0, „ohne Gewähr“',
    attributionText: 'Datenquelle: DELFI e.V.; Aufbereitung: gtfs.de',
    coverage: 'PARTIELL — nur teilnehmende Betreiber',
    updateCadence: 'kontinuierlich (Stream)',
    supportedDataModes: ['realtime'],
    geographicSemantics: ['coverage'],
    validationSchemaVersion: 'gtfs-rt-v1',
    cachePolicy: { ttlSeconds: 60, rationale: 'Echtzeitdaten veralten in Minuten.' },
    status: 'proposed',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Abdeckung ist partiell; fehlende Meldungen bedeuten NICHT Normalbetrieb.',
      'Noch nicht integriert.',
    ],
    toVerify: [
      'Betreiber-/Gebietsabdeckung des Streams dokumentieren, bevor Echtzeit je Ort als „confirmed“ gilt.',
    ],
  },
  {
    providerId: 'cams-eu-airquality',
    displayName: 'CAMS Europäische Luftqualität (regionales Modell)',
    institution: 'Copernicus Atmosphere Monitoring Service (ECMWF)',
    sourceCategory: 'european-institution',
    originalSourceUrl: 'https://ads.atmosphere.copernicus.eu',
    technicalEndpoint: 'ADS-Dataset cams-europe-air-quality-forecasts (cdsapi)',
    accessMethod: 'Registrierung + API-Key ERFORDERLICH (cdsapi)',
    license: 'Licence to Use Copernicus Products (v1.2, Nov. 2019)',
    attributionText: 'Generated using Copernicus Atmosphere Monitoring Service information 2026',
    coverage: 'Europa, Raster 0,1° (ca. 10–20 km)',
    updateCadence: 'täglich; Analyse + Vorhersage bis +96 h, stündliche Schritte',
    supportedDataModes: ['modelled', 'forecast'],
    geographicSemantics: ['grid'],
    validationSchemaVersion: 'cams-v1',
    cachePolicy: { ttlSeconds: 21600, rationale: 'Tägliche Modellläufe.' },
    status: 'proposed',
    reviewDate: '2026-07-16',
    knownLimitations: [
      'Median-Ensemble aus 11 europäischen Modellen; Rasterwert (~10 km) ist keine Adress-Konzentration.',
      'Anbieter-Hinweis: „Outputs may not be correlated enough with real concentrations“; „not suitable for clinical trials“.',
      'Noch nicht integriert: API-Key, Abruf und Produkteignung sind nicht verifiziert.',
    ],
    toVerify: [
      'ADS-Registrierung, cdsapi-Abruf, Datenformat (GRIB/NetCDF) und Produkteignung verifizieren (Stage 4).',
    ],
  },
];

export const providerManifest: ReadonlyArray<ProviderManifestEntry> = entries.map((e) =>
  ProviderManifestEntrySchema.parse(e),
);

export function getProvider(providerId: string): ProviderManifestEntry {
  const entry = providerManifest.find((p) => p.providerId === providerId);
  if (!entry) throw new Error(`Unknown provider: ${providerId}`);
  return entry;
}

/** Only "verified" providers may serve live production responses (§5.2). */
export function isLiveAllowed(providerId: string): boolean {
  return getProvider(providerId).status === 'verified';
}
