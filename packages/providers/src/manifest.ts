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
import { isConfigured, type ProviderConfig } from './config.js';

export const MANIFEST_VERSION = '2026-07-18.2';

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
      'Notfall-/Gesundheitsobjekte (AED, Krankenhaus, Feuerwache) sind kartierter Kontext — ein fehlender Eintrag bedeutet NICHT, dass kein Defibrillator/keine Einrichtung existiert; im Notfall gilt die 112.',
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
      'Integriert (GTFS-Import → SQLite, Servicekalender-Abfrage); live, sobald ein Feed via GTFS_STATIC_PATH/URL konfiguriert ist.',
    ],
    toVerify: [
      'Registrierung bei opendata-oepnv.de und Lizenzbedingungen des DELFI-Datensatzes für den Produktivbetrieb bestätigen.',
      'Feed-Gültigkeitszeitraum und Stop-Matching gegen einen realen DELFI-Feed prüfen.',
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
      'Integriert (GTFS-RT-Protobuf-Dekodierung); live, sobald ein Stream via GTFS_RT_URL konfiguriert ist.',
    ],
    toVerify: [
      'Betreiber-/Gebietsabdeckung des Streams dokumentieren, bevor Echtzeit je Ort als „confirmed“ (statt „partial“) gilt.',
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
      'Integriert (ADS-Abruf + NetCDF-Rasterzelle); live, sobald CAMS_ADS_KEY konfiguriert ist.',
    ],
    toVerify: [
      'ADS-Prozess-API-Request/-Response und NetCDF-Variablennamen gegen einen realen ADS-Schlüssel verifizieren (aus dem Build-Umfeld nicht möglich).',
    ],
  },
  {
    providerId: 'pegelonline-wsv',
    displayName: 'PEGELONLINE Wasserstände (WSV)',
    institution: 'Wasserstraßen- und Schifffahrtsverwaltung des Bundes (WSV)',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://www.pegelonline.wsv.de',
    technicalEndpoint:
      'https://www.pegelonline.wsv.de/webservices/rest-api/v2 (stations.json, Umkreisfilter, includeCurrentMeasurement)',
    accessMethod: 'HTTPS GET, JSON, kein API-Key',
    license: 'Datenlizenz Deutschland – Zero – 2.0 (dl-de/zero-2-0)',
    attributionText: 'Quelle: WSV / PEGELONLINE',
    coverage: 'Pegel an Bundeswasserstraßen (~600 Stationen); Landesgewässer sind NICHT enthalten',
    updateCadence: 'Rohdaten, i. d. R. alle 15 Minuten; Vorhaltung online 30 Tage',
    supportedDataModes: ['observed'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'pegelonline-v2',
    cachePolicy: {
      ttlSeconds: 300,
      rationale: 'Messwerte erscheinen ~alle 15 Minuten; kurzer Cache begrenzt Last.',
    },
    status: 'verified',
    reviewDate: '2026-07-17',
    knownLimitations: [
      'Ein Pegelwert gilt für den Pegelstandort am jeweiligen Gewässer — keine Übertragung auf andere Gewässer oder Orte.',
      'Rohdaten ohne abschließende Prüfung; kein Hochwasser-Warnstatus (amtliche Hochwasserwarnungen erteilen die Hochwasserzentralen der Länder).',
      'Nur Bundeswasserstraßen — ein fehlender Pegel bedeutet nicht, dass kein Gewässer in der Nähe ist.',
    ],
    toVerify: [
      'Antwortschema (stations.json inkl. currentMeasurement) live re-verifizieren (Egress im Build-Umfeld blockiert, 2026-07-17).',
      'Lizenzangabe dl-de/zero-2-0 gegen die aktuellen PEGELONLINE-Nutzungsbedingungen bestätigen.',
    ],
  },
  {
    providerId: 'bfs-odl',
    displayName: 'BfS ODL-Messnetz (Gamma-Ortsdosisleistung)',
    institution: 'Bundesamt für Strahlenschutz (BfS)',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://odlinfo.bfs.de',
    technicalEndpoint:
      'https://www.imis.bfs.de/ogc/opendata/ows (WFS GetFeature, Layer opendata:odlinfo_odl_1h_latest, GeoJSON)',
    accessMethod: 'HTTPS GET (WFS GetFeature), GeoJSON, kein API-Key',
    license: 'Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0)',
    attributionText: 'Quelle: Bundesamt für Strahlenschutz (BfS), ODL-Messnetz',
    coverage: 'Deutschland, ~1.700 ODL-Sonden',
    updateCadence: 'stündlich (1-h-Mittelwerte)',
    supportedDataModes: ['observed'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'bfs-odl-wfs-v1',
    cachePolicy: {
      ttlSeconds: 900,
      rationale:
        'Stündliche 1-h-Mittelwerte; der komplette Layer wird einmal geladen und lokal gefiltert — 15-Minuten-Cache begrenzt Last.',
    },
    status: 'verified',
    reviewDate: '2026-07-17',
    knownLimitations: [
      'Die Gamma-Ortsdosisleistung schwankt natürlich (Gestein, Höhe; Regen kann Werte vorübergehend natürlich erhöhen) — ein erhöhter Einzelwert ist keine Gefahrenaussage.',
      'Messwert gilt am Sondenstandort; keine Interpolation zwischen Sonden.',
      'Sonden können zeitweise ausfallen oder in Wartung sein (Status wird mitgeliefert).',
    ],
    toVerify: [
      'WFS-Property-Namen (kenn, name, value, unit, end_measure, site_status) live re-verifizieren.',
      'Einheit (µSv/h) und Bedeutung des 1-h-Mittelwerts gegen die BfS-Dokumentation bestätigen.',
    ],
  },
  {
    providerId: 'dwd-pollen',
    displayName: 'DWD Pollenflug-Gefahrenindex',
    institution: 'Deutscher Wetterdienst',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://www.dwd.de',
    technicalEndpoint: 'https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json',
    accessMethod: 'HTTPS GET, JSON, kein API-Key',
    license: 'CC BY 4.0 (DWD)',
    attributionText: 'Quelle: Deutscher Wetterdienst',
    coverage: 'Deutschland, 27 Pollenflug-Teilregionen (Großregionen)',
    updateCadence: 'täglich (ca. 11 Uhr), Vorhersage heute/morgen/übermorgen',
    supportedDataModes: ['forecast'],
    geographicSemantics: ['coverage'],
    validationSchemaVersion: 'dwd-pollen-v1',
    cachePolicy: {
      ttlSeconds: 10800,
      rationale: 'Tägliche Ausgabe; 3-h-Cache genügt und begrenzt Last.',
    },
    status: 'verified',
    reviewDate: '2026-07-17',
    knownLimitations: [
      'Der Gefahrenindex gilt je GROSSREGION (Teilregion eines Bundeslandes) — kein Ortswert, keine lokale Konzentration.',
      'Die Zuordnung des gewählten Orts erfolgt über das Bundesland; umfasst ein Bundesland mehrere Teilregionen, werden alle angezeigt (nicht punktgenau).',
      'Indexstufen (0–3) sind quellendefinierte Belastungsklassen, keine Messwerte.',
    ],
    toVerify: [
      'Antwortschema (content/Pollen/legend) live re-verifizieren.',
      'Teilregions-Zuordnung optional über die amtlichen Regionspolygone präzisieren (statt Bundesland-Textabgleich).',
    ],
  },
  {
    providerId: 'dwd-uvi',
    displayName: 'DWD UV-Index-Vorhersage',
    institution: 'Deutscher Wetterdienst',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://www.dwd.de',
    technicalEndpoint: 'https://opendata.dwd.de/climate_environment/health/alerts/uvi.json',
    accessMethod: 'HTTPS GET, JSON, kein API-Key',
    license: 'CC BY 4.0 (DWD)',
    attributionText: 'Quelle: Deutscher Wetterdienst',
    coverage: 'Ausgewählte Vorhersageorte in Deutschland (wenige Referenzstandorte)',
    updateCadence: 'täglich, Vorhersage heute/morgen/übermorgen (Tagesmaximum)',
    supportedDataModes: ['forecast'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'dwd-uvi-v1',
    cachePolicy: {
      ttlSeconds: 10800,
      rationale: 'Tägliche Ausgabe; 3-h-Cache genügt und begrenzt Last.',
    },
    status: 'verified',
    reviewDate: '2026-07-17',
    knownLimitations: [
      'Der UV-Index wird nur für wenige Referenzorte ausgegeben — der angezeigte Wert ist der des NÄCHSTGELEGENEN Vorhersageorts, oft weit entfernt (regionale Referenz).',
      'Tagesmaximum-Vorhersage; die tatsächliche UV-Belastung hängt von Bewölkung, Höhe und Tageszeit ab.',
      'Die Koordinaten der Vorhersageorte stammen aus einer dokumentierten produktseitigen Zuordnungstabelle (die Quelle liefert nur Ortsnamen).',
    ],
    toVerify: [
      'Antwortschema (content[].city/forecast) live re-verifizieren.',
      'Ortsnamen der Quelle gegen die produktseitige Koordinatentabelle abgleichen (nicht zugeordnete Orte werden ausgelassen).',
    ],
  },
  {
    providerId: 'dwd-radar',
    displayName: 'DWD Regenradar (RADOLAN, über Bright Sky)',
    institution: 'Deutscher Wetterdienst (Daten); Bright Sky / Jakob de Maeyer (Zugangsschicht)',
    sourceCategory: 'unofficial-access-layer',
    originalSourceUrl: 'https://opendata.dwd.de',
    technicalEndpoint:
      'https://api.brightsky.dev/radar (Punktabfrage); Karten-Overlay: https://maps.dwd.de/geoserver/dwd/wms (Layer dwd:Niederschlagsradar)',
    accessMethod: 'HTTPS GET, JSON (Rasterausschnitt), kein API-Key',
    license: 'Daten: CC BY 4.0 (DWD); Zugangsschicht: MIT (Open Source)',
    attributionText: 'Quelle: Deutscher Wetterdienst',
    coverage: 'Deutschland, 1-km-Radarkomposit (RADOLAN), inkl. 2-h-Nowcast',
    updateCadence: 'alle 5 Minuten',
    supportedDataModes: ['observed', 'forecast'],
    geographicSemantics: ['grid'],
    validationSchemaVersion: 'brightsky-radar-v1',
    cachePolicy: {
      ttlSeconds: 300,
      rationale: '5-Minuten-Produkt; Cache auf Produktzyklus begrenzt Last.',
    },
    status: 'verified',
    reviewDate: '2026-07-17',
    knownLimitations: [
      'Radar misst Reflektivität; die Umrechnung in Niederschlag ist quellenseitig aneichgestützt — kein Regenmesser-Ersatz.',
      'Wert der 1-km-Rasterzelle, kein Punktwert am Pin.',
      'Zukünftige Frames sind Kurzfrist-PROGNOSE (Nowcast), getrennt gekennzeichnet — keine Beobachtung.',
      'Bright Sky ist eine INOFFIZIELLE Zugangsschicht über DWD-Daten.',
    ],
    toVerify: [
      'Einheit/Skalierung der Radarwerte (dokumentiert: Hundertstel mm je 5 min) live re-verifizieren.',
      'Parameter-Semantik (distance, latlon_position) und WMS-Layernamen des Karten-Overlays live re-verifizieren.',
    ],
  },
  {
    providerId: 'nina-bbk',
    displayName: 'NINA Zivilschutz-Warnungen (BBK)',
    institution: 'Bundesamt für Bevölkerungsschutz und Katastrophenhilfe (BBK)',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://warnung.bund.de',
    technicalEndpoint:
      'https://warnung.bund.de/api31/dashboard/{ARS}.json (bund.dev-dokumentiert; ARS auf Kreisebene)',
    accessMethod: 'HTTPS GET, JSON, kein API-Key',
    license: 'Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0)',
    attributionText: 'Quelle: Bundesamt für Bevölkerungsschutz und Katastrophenhilfe (BBK)',
    coverage: 'Deutschland, Kreisebene (MoWaS, KATWARN, BIWAPP, Hochwasserportal, DWD)',
    updateCadence: 'ereignisgesteuert',
    supportedDataModes: ['observed'],
    geographicSemantics: ['coverage'],
    validationSchemaVersion: 'nina-v31',
    cachePolicy: {
      ttlSeconds: 300,
      rationale: 'Warnlagen sind zeitkritisch; kurzer Cache nur zur Lastbegrenzung.',
    },
    status: 'verified',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'Warnungen gelten für den amtlichen KREIS (ARS-Ebene), nicht für den exakten Pin.',
      'Das Fehlen von Warnungen ist eine Aussage über veröffentlichte Meldungen, nicht über die tatsächliche Lage.',
      'Die Kreiszuordnung erfolgt über die amtliche Gebietszuordnung (BKG VG250).',
    ],
    toVerify: [
      'Dashboard-Antwortschema (payload.data: headline/provider/severity/msgType, sent) live re-verifizieren.',
      'ARS-Konvention (Kreisebene: Stellen 1–5 + „0000000“) gegen die bund.dev-Doku bestätigen.',
    ],
  },
  {
    providerId: 'bkg-vg250',
    displayName: 'BKG VG250 (amtliche Gebietszuordnung)',
    institution: 'Bundesamt für Kartographie und Geodäsie (BKG)',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://gdz.bkg.bund.de',
    technicalEndpoint:
      'https://sgx.geodatenzentrum.de/wfs_vg250 (WFS GetFeature, Layer vg250_gem, Punkt-INTERSECTS, GeoJSON)',
    accessMethod: 'HTTPS GET (WFS GetFeature), GeoJSON, kein API-Key',
    license: 'Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0)',
    attributionText: '© GeoBasis-DE / BKG (2026)',
    coverage: 'Deutschland, Verwaltungsgrenzen (Gemeinde/Kreis/Land)',
    updateCadence: 'jährlicher Gebietsstand, laufend bereitgestellt',
    supportedDataModes: ['mapped'],
    geographicSemantics: ['geometry'],
    validationSchemaVersion: 'bkg-vg250-wfs-v1',
    cachePolicy: {
      ttlSeconds: 86400,
      rationale: 'Verwaltungszuordnung eines Punktes ändert sich praktisch nie.',
    },
    status: 'verified',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'Amtliche Verwaltungszuordnung (Gemeinde/ARS) — kartierter Verwaltungskontext, keine Zustandsaussage.',
    ],
    toVerify: [
      'Geometriespalten-Name für den INTERSECTS-Filter live verifizieren (dokumentiert: geom).',
      'Property-Namen (ars, gen, bez) des WFS-Layers vg250_gem live re-verifizieren.',
    ],
  },
  {
    providerId: 'autobahn-gmbh',
    displayName: 'Autobahn-Verkehrslage (Autobahn GmbH)',
    institution: 'Die Autobahn GmbH des Bundes',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://verkehr.autobahn.de',
    technicalEndpoint:
      'https://verkehr.autobahn.de/o/autobahn (bund.dev-dokumentiert: /{roadId}/services/warning|closure|roadworks)',
    accessMethod: 'HTTPS GET, JSON, kein API-Key',
    license: 'Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0)',
    attributionText: 'Quelle: Autobahn GmbH des Bundes',
    coverage: 'NUR Bundesautobahnen — keine Aussage über andere Straßen',
    updateCadence: 'laufend (Meldungslage)',
    supportedDataModes: ['observed'],
    geographicSemantics: ['geometry'],
    validationSchemaVersion: 'autobahn-v1',
    cachePolicy: {
      ttlSeconds: 900,
      rationale:
        'Das API ist je Autobahn organisiert; die aggregierte Abfrage aller Autobahnen wird 15 min landesweit geteilt (Baustellen 60 min).',
    },
    status: 'verified',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'Abdeckung NUR Bundesautobahnen; das Fehlen von Meldungen ist keine Aussage über andere Straßen oder freien Verkehr.',
      'Meldungen sind quellendefinierte Ereignisse der Autobahn GmbH.',
    ],
    toVerify: [
      'Antwortschema (roads, warning/closure/roadworks: coordinate/title/subtitle) live re-verifizieren.',
      'Lizenzangabe dl-de/by-2-0 gegen die bund.dev-/Autobahn-GmbH-Angaben bestätigen.',
    ],
  },
  {
    providerId: 'gfz-geofon',
    displayName: 'GEOFON Erdbebendienst (GFZ)',
    institution: 'GFZ Helmholtz-Zentrum für Geoforschung, Potsdam',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://geofon.gfz-potsdam.de',
    technicalEndpoint:
      'https://geofon.gfz-potsdam.de/fdsnws/event/1/query (FDSN-Standard, format=text)',
    accessMethod: 'HTTPS GET (FDSN event web service), Text/QuakeML, kein API-Key',
    license: 'CC BY 4.0 (GEOFON-Datenprodukte)',
    attributionText: 'Quelle: GFZ Helmholtz-Zentrum für Geoforschung / GEOFON',
    coverage: 'weltweit; Produkt fragt einen Umkreis um den gewählten Ort ab',
    updateCadence: 'ereignisgesteuert (automatische + manuell geprüfte Lösungen)',
    supportedDataModes: ['observed'],
    geographicSemantics: ['geometry'],
    validationSchemaVersion: 'fdsn-event-text-v1',
    cachePolicy: {
      ttlSeconds: 900,
      rationale: 'Seismische Kataloge ändern sich selten; 15-Minuten-Cache genügt.',
    },
    status: 'verified',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'Katalogereignisse (Epizentrum, Magnitude) — keine Erschütterungs- oder Schadensaussage am gewählten Ort.',
      'Keine Ereignisse im Umkreis ist der Normalfall und ein ehrliches Ergebnis.',
      'Frühe automatische Lösungen können später manuell revidiert werden.',
    ],
    toVerify: [
      'FDSN-text-Spaltenreihenfolge und 204-Semantik (keine Treffer) live re-verifizieren.',
      'Lizenzangabe CC BY 4.0 gegen die GEOFON-Nutzungsbedingungen bestätigen.',
    ],
  },
  {
    providerId: 'dwd-cdc-normals',
    displayName: 'DWD Klimanormalwerte 1991–2020 (CDC)',
    institution: 'Deutscher Wetterdienst (Climate Data Center)',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://opendata.dwd.de',
    technicalEndpoint:
      'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/multi_annual/mean_91-20 (Stationslisten + Werte, Semikolon-Tabellen)',
    accessMethod: 'HTTPS GET, dokumentierte Textdateien, kein API-Key',
    license: 'CC BY 4.0 (DWD)',
    attributionText: 'Quelle: Deutscher Wetterdienst',
    coverage: 'Deutschland, Klimastationen mit vieljährigen Mitteln 1991–2020',
    updateCadence: 'statisch (Referenzperiode); Bereitstellung laufend',
    supportedDataModes: ['observed'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'dwd-cdc-multiannual-v1',
    cachePolicy: {
      ttlSeconds: 2592000,
      rationale: 'Referenzperioden-Statistik ändert sich nicht; 30-Tage-Cache.',
    },
    status: 'verified',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'Vieljährige MITTELWERTE der Referenzperiode 1991–2020 — eine statistische Referenz, kein aktueller Zustand und keine Vorhersage.',
      'Werte gelten an der jeweiligen Klimastation; die nächste Normalwert-Station kann von der Wetterstation des Wettermoduls abweichen.',
    ],
    toVerify: [
      'Dateinamen und Spaltenlayout der mean_91-20-Tabellen (Stationsliste + Werte) live re-verifizieren.',
    ],
  },
  {
    providerId: 'tankerkoenig-mtsk',
    displayName: 'Kraftstoffpreise (Tankerkönig / MTS-K)',
    institution:
      'Markttransparenzstelle für Kraftstoffe (Bundeskartellamt); Zugangsschicht: Tankerkönig',
    sourceCategory: 'unofficial-access-layer',
    originalSourceUrl: 'https://creativecommons.tankerkoenig.de',
    technicalEndpoint: 'https://creativecommons.tankerkoenig.de/json/list.php (Umkreisabfrage)',
    accessMethod: 'HTTPS GET, JSON, kostenloser API-Key ERFORDERLICH',
    license: 'CC BY 4.0 (Tankerkönig; Daten der MTS-K)',
    attributionText: 'Quelle: MTS-K / Tankerkönig',
    coverage: 'Deutschland, meldepflichtige öffentliche Tankstellen',
    updateCadence: 'laufend (Preisänderungen werden von Betreibern gemeldet)',
    supportedDataModes: ['realtime'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'tankerkoenig-v4',
    cachePolicy: {
      ttlSeconds: 300,
      rationale: 'Fair-Use-Vorgabe des Anbieters: nicht schneller als alle 5 Minuten je Ort.',
    },
    status: 'proposed',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'Preise werden von den Betreibern an die MTS-K GEMELDET; geringe Verzögerungen und Meldefehler sind möglich.',
      'Tankerkönig ist eine INOFFIZIELLE Zugangsschicht über MTS-K-Daten.',
      'Integriert; live, sobald TANKERKOENIG_API_KEY konfiguriert ist (kostenlose Registrierung).',
    ],
    toVerify: [
      'Antwortschema (list.php: stations mit e5/e10/diesel/dist/isOpen) gegen einen realen Key verifizieren.',
    ],
  },
  {
    providerId: 'db-fasta',
    displayName: 'Bahnhofs-Aufzüge & Fahrtreppen (DB FaSta)',
    institution: 'DB InfraGO AG (DB API Marketplace)',
    sourceCategory: 'transport-association',
    originalSourceUrl: 'https://developers.deutschebahn.com',
    technicalEndpoint:
      'https://apis.deutschebahn.com/db-api-marketplace/apis/fasta/v2/facilities (DB-Client-Id/DB-Api-Key-Header)',
    accessMethod: 'HTTPS GET, JSON, kostenlose DB-API-Marketplace-Zugangsdaten ERFORDERLICH',
    license: 'CC BY 4.0 (FaSta, DB API Marketplace)',
    attributionText: 'Quelle: DB InfraGO AG (FaSta, DB API Marketplace)',
    coverage: 'Deutschland, Aufzüge/Fahrtreppen an DB-Stationen',
    updateCadence: 'laufend (Betriebszustand)',
    supportedDataModes: ['realtime'],
    geographicSemantics: ['station'],
    validationSchemaVersion: 'db-fasta-v2',
    cachePolicy: {
      ttlSeconds: 300,
      rationale: 'Betriebszustände ändern sich minütlich bis stündlich; 5-Minuten-Cache.',
    },
    status: 'proposed',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'Zustand je Anlage (Aufzug/Fahrtreppe) an DB-Stationen — keine Aussage über andere Betreiber oder sonstige Barrierefreiheit.',
      '„UNKNOWN“ bedeutet: Zustand nicht ermittelbar — nicht „funktioniert“.',
      'Integriert; live, sobald DB_CLIENT_ID und DB_API_KEY konfiguriert sind (kostenlose Registrierung).',
    ],
    toVerify: [
      'Antwortschema (equipmentnumber/type/state/geocoordX/geocoordY) gegen reale Zugangsdaten verifizieren.',
    ],
  },
  {
    providerId: 'bvl-lebensmittelwarnung',
    displayName: 'Lebensmittel- & Produktwarnungen (BVL) — Kandidat',
    institution: 'Bundesamt für Verbraucherschutz und Lebensmittelsicherheit (BVL)',
    sourceCategory: 'federal-authority',
    originalSourceUrl: 'https://www.lebensmittelwarnung.de',
    technicalEndpoint: 'bund.dev-dokumentierte Schnittstelle (lebensmittelwarnung.api.bund.dev)',
    accessMethod:
      'HTTPS, JSON; Auth-Semantik der dokumentierten Schnittstelle noch zu verifizieren',
    license: 'Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0)',
    attributionText: 'Quelle: lebensmittelwarnung.de (BVL)',
    coverage: 'Deutschland, Warnungen je Bundesland',
    updateCadence: 'ereignisgesteuert',
    supportedDataModes: ['observed'],
    geographicSemantics: ['coverage'],
    validationSchemaVersion: 'bvl-lmw-v1',
    cachePolicy: { ttlSeconds: 3600, rationale: 'Ereignisgesteuerte Warnlage; 1-h-Cache.' },
    status: 'proposed',
    reviewDate: '2026-07-18',
    knownLimitations: [
      'KANDIDAT — noch nicht integriert: die Auth-Semantik der bund.dev-dokumentierten Schnittstelle muss live verifiziert werden, bevor ein Adapter gebaut wird.',
      'Warnungen gelten je Bundesland (Abdeckungssemantik), nicht ortsscharf.',
    ],
    toVerify: [
      'Endpoint- und Auth-Semantik (bund.dev) live verifizieren; erst danach Adapter-Integration.',
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

/**
 * The manifest entry resolved against runtime configuration. Providers whose
 * base status is "proposed" are upgraded to "verified" (live) once their
 * required configuration is present; the technical endpoint is filled from
 * config so self-hosted instances can be used. Nothing else about the entry
 * (license, attribution, limitations) changes.
 */
export function getEffectiveProvider(
  providerId: string,
  config: ProviderConfig,
): ProviderManifestEntry {
  const base = getProvider(providerId);
  const configured = isConfigured(providerId, config);
  const endpoint = EFFECTIVE_ENDPOINT[providerId]?.(config) ?? base.technicalEndpoint;
  const status: ProviderManifestEntry['status'] =
    base.status === 'proposed' && configured ? 'verified' : base.status;
  return { ...base, status, technicalEndpoint: endpoint };
}

/** Config-derived endpoints per provider (self-hosting friendly). */
const EFFECTIVE_ENDPOINT: Record<string, (c: ProviderConfig) => string> = {
  'dwd-brightsky': (c) => `${c.brightskyUrl}/weather`,
  'dwd-warnings': (c) => c.dwdWfsUrl,
  'uba-airdata': (c) => c.ubaBaseUrl,
  'osm-overpass': (c) => c.overpassUrl,
  'photon-geocoding': (c) => `${c.photonUrl}/api`,
  'cams-eu-airquality': (c) => c.camsApiUrl,
  'delfi-gtfs': (c) => c.gtfsStaticUrl ?? c.gtfsStaticPath ?? c.gtfsDbPath,
  'delfi-gtfs-rt': (c) => c.gtfsRtUrl ?? '(nicht konfiguriert)',
  'pegelonline-wsv': (c) => c.pegelonlineUrl,
  'bfs-odl': (c) => c.odlUrl,
  'dwd-pollen': (c) => `${c.dwdHealthUrl}/s31fg.json`,
  'dwd-uvi': (c) => `${c.dwdHealthUrl}/uvi.json`,
  'dwd-radar': (c) => `${c.brightskyUrl}/radar`,
  'nina-bbk': (c) => c.ninaUrl,
  'bkg-vg250': (c) => c.bkgWfsUrl,
  'autobahn-gmbh': (c) => c.autobahnUrl,
  'gfz-geofon': (c) => c.geofonUrl,
  'dwd-cdc-normals': (c) => c.dwdCdcNormalsUrl,
  'tankerkoenig-mtsk': (c) => c.tankerkoenigUrl,
  'db-fasta': (c) => c.dbFastaUrl,
};

/** Only "verified" (incl. config-activated) providers may serve live responses (§5.2). */
export function isLiveAllowed(providerId: string, config: ProviderConfig): boolean {
  return getEffectiveProvider(providerId, config).status === 'verified';
}
