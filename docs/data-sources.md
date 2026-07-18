# Data sources & provider manifest

The machine-readable manifest is `packages/providers/src/manifest.ts`
(version **`2026-07-18.1`**). Only providers with status **`verified`** serve live
production responses. This document summarises each provider's license, attribution,
coverage, cache policy and **open verification tasks**.

> **Build-time verification note.** Live endpoint re-verification from the build environment
> was **blocked by its egress network policy on 2026-07-16** (CONNECT 403 to
> `api.brightsky.dev` and `maps.dwd.de`). Seed values follow the verified provider register
> of the master charter (verified July 2026). Every open item is listed under **TO VERIFY**
> below and mirrored in the manifest's `toVerify` arrays. Runtime Zod validation rejects any
> response that does not match the documented schema, so an unverified schema detail surfaces
> as a visible source-error rather than as invented data.

## Source hierarchy (§5.1)

1. Official German federal/state authorities (DWD, UBA/Länder, BKG)
2. Official European institutional services (Copernicus/CAMS)
3. Transport operators & verified associations (DELFI e.V.)
4. Official municipal sources
5. Documented supplementary cartographic sources (OSM, Photon, OpenFreeMap)
6. Other sources only after explicit approval

No source is permanently presumed valid; every integration is reviewed against current
documentation, license, attribution and technical terms before activation.

---

## Verified & serving live (V1)

### DWD — weather & forecast (`dwd-brightsky`)
- **Endpoint:** `https://api.brightsky.dev/weather` (unofficial JSON access layer over DWD
  Open Data; MIT; no API key). Documented fallback: `https://opendata.dwd.de` MOSMIX_L
  single-station files.
- **License:** Data **CC BY 4.0** (DWD); access layer MIT. CC BY 4.0 supersedes older
  GeoNutzV wording on legacy DWD subpages.
- **Attribution:** `Quelle: Deutscher Wetterdienst` (verified official form). The
  `© Deutscher Wetterdienst` form is **not** the prescribed template.
- **Availability:** **not guaranteed** ("Es besteht derzeit kein Anspruch auf Verfügbarkeit
  dieser Dienste") → cache + visible outage + data status are mandatory.
- **Cache TTL:** 1800 s.
- **TO VERIFY:** re-verify the `/weather` response schema live against `api.brightsky.dev`.

### DWD — official warnings (`dwd-warnings`)
- **Endpoint:** WFS `https://maps.dwd.de/geoserver/dwd/ows`, layer
  `dwd:Warnungen_Gemeinden` (CQL-filterable, GeoJSON output). CAP products on
  `opendata.dwd.de` as alternative. Geodienste availability ~98 %, still no legal guarantee.
- **License/attribution:** as DWD (CC BY 4.0; `Quelle: Deutscher Wetterdienst`). Warning
  geometries may carry `EC_LICENSE "© GeoBasis-DE / BKG (year) (Daten modifiziert)"` — the
  adapter **preserves** any embedded license field into evidence limitations.
- **Cache TTL:** 300 s (warnings are time-critical).
- **TO VERIFY:**
  - geometry column name for the CQL `INTERSECTS` filter (documented `THE_GEOM`);
  - response property names (`EVENT`/`SEVERITY`/`ONSET`/`EXPIRES`/`EC_LICENSE`).

### UBA / Länder — observed air quality (`uba-airdata`)
- **Endpoint:** `https://luftdaten.umweltbundesamt.de/api/air_data/v3` (JSON, no API key).
  Components include PM10, PM2.5, NO2, O3, SO2, CO. >400 stations.
- **License:** **Datenlizenz Deutschland Namensnennung 2.0** (dl-de/by-2-0).
- **Attribution:** `Umweltbundesamt` (+ "Daten verändert" if modified).
- **Data status:** current-year data are **provisional** ("nicht endgültig geprüft"); final
  data published in **June of the following year**; completeness **not** guaranteed. Surfaced
  as `completeness: "provisional"`.
- **Time semantics:** JSON timestamps are **CET/MEZ (UTC+1, no DST)**. The adapter normalizes
  to Europe/Berlin via `ubaCetToIso` and **preserves the original string** in
  `sourceTimeRaw`.
- **Cache TTL:** 900 s.
- **TO VERIFY:**
  - positional indices of `stations/json` and `measures/json` arrays against the API's
    `indices` metadata;
  - component IDs (PM10=1, CO=2, O3=3, SO2=4, NO2=5, PM2.5=9) and scope semantics;
  - API version label (**v3 vs v4**) against current docs.

### OpenStreetMap — POI/geometry via Overpass (`osm-overpass`)
- **Endpoint:** `https://overpass-api.de/api/interpreter` (public instance). Fair use: **one
  query at a time, no parallel queries**; queue >15 s → HTTP 429. Enforced by the HTTP
  layer's per-host serialization. For sustained use, self-host or use Geofabrik extracts —
  **no browser bulk loads**.
- **License:** **ODbL.** Attribution `© OpenStreetMap contributors`, linked to
  openstreetmap.org/copyright.
- **Cache TTL:** 21600 s (6 h).
- **Limitations:** mapped context only — **no** opening hours, accessibility, operating
  status, safety, shade or cooling claims. Completeness unknown.

### Photon — geocoding (`photon-geocoding`)
- **Endpoint:** `https://photon.komoot.io/api` (search) + `/reverse`. Apache-2.0 code,
  OSM/ODbL data, search-as-you-type capable. Public demo has **no availability guarantee**;
  extensive use is throttled. Results filtered to Germany (`countrycode DE`).
- **License:** code Apache-2.0; data ODbL. Attribution `© OpenStreetMap contributors`.
- **Cache TTL:** 86400 s.
- **TO VERIFY:** for production, self-host Photon and switch the endpoint.
- **Nominatim note:** the OSMF Nominatim Usage Policy forbids no-code/low-code/vibe-coding
  platforms from building the public API in as a generic geocoder, forbids client-side
  autocomplete and bulk queries. We therefore use **Photon** (server-side, debounced,
  cached), not the public Nominatim API. A production deployment should self-host Photon or
  Nominatim.

### OpenFreeMap — base map (`openfreemap-basemap`)
- **Endpoint:** `https://tiles.openfreemap.org/styles/liberty` (MapLibre style JSON + vector
  tiles). No API key, no registration, no request limits on the public instance;
  self-hostable. Code MIT; data OSM.
- **Attribution:** `OpenFreeMap © OpenMapTiles Data from OpenStreetMap`.
- **Alternative:** basemap.de Web Vektor (BKG, CC BY 4.0, geldleistungsfrei). One primary
  base map is chosen; both are advertising-free.

### WSV — water levels via PEGELONLINE (`pegelonline-wsv`)
- **Endpoint:** `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json` with
  radius filter and `includeCurrentMeasurement=true` (JSON, no API key).
- **License:** Datenlizenz Deutschland – Zero – 2.0 (**TO VERIFY** against current terms).
- **Attribution:** `Quelle: WSV / PEGELONLINE`.
- **Semantics:** raw gauge readings (typically 15-min cadence) at FEDERAL waterways only; a
  gauge value holds at its gauge on its waterway — no transfer to other waters/places, and
  **no flood-warning status** (that is the Länder Hochwasserzentralen's mandate).
- **Cache TTL:** 300 s.
- **TO VERIFY:** response schema live; license wording.

### BfS — gamma dose rate, ODL network (`bfs-odl`)
- **Endpoint:** `https://www.imis.bfs.de/ogc/opendata/ows`, WFS GetFeature layer
  `opendata:odlinfo_odl_1h_latest` (GeoJSON). The FULL layer (~1,700 probes) is fetched and
  cached once (15 min); nearest probes are selected locally — this sidesteps WFS bbox
  axis-order pitfalls entirely.
- **License:** dl-de/by-2-0. **Attribution:** `Quelle: Bundesamt für Strahlenschutz (BfS),
  ODL-Messnetz`.
- **Semantics:** 1-h mean gamma ambient dose rate (µSv/h) at the probe site. Natural
  fluctuation (geology, altitude, rain washout) is stated in every Evidence record; an
  elevated single value is never rendered as a hazard claim.
- **TO VERIFY:** WFS property names (`kenn`, `name`, `value`, `unit`, `end_measure`,
  `site_status_text`); unit semantics.

### DWD — pollen hazard index (`dwd-pollen`)
- **Endpoint:** `https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json`
  (daily, ~11:00; today/tomorrow/day-after per allergen).
- **Semantics:** index per LARGE forecast partregion (27 nationwide). Assignment is via the
  place's **Bundesland** (text match against source region names); when a Bundesland spans
  several partregions **all** are shown — no silent pick, no polygon guessing. Index strings
  ("0"…"3", halves like "0-1") and the source legend are passed through verbatim.
- **License/attribution:** CC BY 4.0; `Quelle: Deutscher Wetterdienst`.
- **TO VERIFY:** response schema live; optionally refine assignment with the official region
  polygons.

### DWD — UV index forecast (`dwd-uvi`)
- **Endpoint:** `https://opendata.dwd.de/climate_environment/health/alerts/uvi.json`
  (daily maxima for a small set of named reference locations; no coordinates in the payload).
- **Semantics:** nearest REFERENCE location via a documented product-side coordinate table
  (`adapters/uvi.ts`, `UV_CITY_COORDS`); unmatched source locations are skipped, never
  guessed. Distance to the reference location is always shown (usually far → regional
  reference).
- **License/attribution:** CC BY 4.0; `Quelle: Deutscher Wetterdienst`.
- **TO VERIFY:** response schema live; reconcile source location names with the coordinate
  table.

### DWD — precipitation radar (`dwd-radar`)
- **Endpoints:** point/nowcast series via Bright Sky `https://api.brightsky.dev/radar`
  (RADOLAN composite, 1 km, 5-min cadence, incl. 2-h nowcast; unofficial access layer,
  labelled); map overlay via DWD GeoServer WMS `https://maps.dwd.de/geoserver/dwd/wms`,
  layer `dwd:Niederschlagsradar` (toggle in the layer controls, DWD attribution on the map).
- **Semantics:** value of the 1-km grid CELL containing the pin (never a point value);
  frames after retrieval time are nowcast and mode-discriminated `forecast`. Source values
  (documented: hundredths of mm per 5 min) are converted to mm/5 min by the documented
  factor, stated in the Evidence method.
- **License/attribution:** data CC BY 4.0 (DWD); `Quelle: Deutscher Wetterdienst`.
- **TO VERIFY:** unit scaling and `distance`/`latlon_position` parameter semantics live;
  WMS layer name for the overlay.

### BBK — civil-protection warnings via NINA (`nina-bbk`)
- **Endpoint:** `https://warnung.bund.de/api31/dashboard/{ARS}.json` (bund.dev-documented;
  district-level ARS = first 5 digits + seven zeros). All-hazard official warnings: MoWaS,
  KATWARN, BIWAPP, flood portal, DWD.
- **Semantics:** warnings apply to the DISTRICT (Kreis), never to the exact pin. The
  district is identified via the official territorial assignment (BKG VG250, below); both
  sources appear in the Evidence. Absence of warnings = absence of published messages.
- **License/attribution:** dl-de/by-2-0; `Quelle: Bundesamt für Bevölkerungsschutz und
  Katastrophenhilfe (BBK)`.
- **TO VERIFY:** dashboard payload schema; district-ARS convention.

### BKG — official territorial assignment, VG250 (`bkg-vg250`)
- **Endpoint:** `https://sgx.geodatenzentrum.de/wfs_vg250` (WFS GetFeature, layer
  `vg250_gem`, point INTERSECTS, GeoJSON). Yields the official Gemeinde + ARS for a point.
- **License/attribution:** dl-de/by-2-0; `© GeoBasis-DE / BKG (2026)`.
- **TO VERIFY:** geometry column name for INTERSECTS (documented `geom`); property names
  (`ars`, `gen`, `bez`).

### Autobahn GmbH — motorway events (`autobahn-gmbh`)
- **Endpoint:** `https://verkehr.autobahn.de/o/autobahn` (bund.dev-documented;
  `/{roadId}/services/warning|closure|roadworks`). The API is per-motorway with no bbox
  query, so the adapter aggregates ALL motorways into one nationally shared cached
  snapshot (bounded concurrency; warnings/closures 15 min, roadworks 60 min) and filters
  locally by distance (30 km).
- **Semantics:** federal motorways ONLY — absence of events is never a statement about
  other roads or free flow.
- **License/attribution:** dl-de/by-2-0 (**TO VERIFY**); `Quelle: Autobahn GmbH des Bundes`.
- **TO VERIFY:** response schema (`coordinate`/`title`/`subtitle`); license wording.

### GFZ — earthquakes via GEOFON (`gfz-geofon`)
- **Endpoint:** `https://geofon.gfz-potsdam.de/fdsnws/event/1/query` (FDSN standard,
  `format=text`, pipe-separated). Radius 200 km, window 90 days.
- **Semantics:** catalogue events (epicentre, magnitude) — never local shaking; an empty
  list is the normal, honest outcome for most of Germany (FDSN 204 handled as such).
- **License/attribution:** CC BY 4.0 (**TO VERIFY**); `Quelle: GFZ Helmholtz-Zentrum für
  Geoforschung / GEOFON`.
- **TO VERIFY:** text column order; 204 semantics; license wording.

### DWD — climate normals 1991–2020, CDC (`dwd-cdc-normals`)
- **Endpoint:** `https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/multi_annual/mean_91-20`
  (documented semicolon tables: per-parameter station list + values; latin1-decoded;
  cached 30 days). Temperature + precipitation; current-month and annual normals of the
  nearest climate station.
- **Semantics:** a STATISTICAL REFERENCE for context ("is today unusual?") — never a
  current condition or forecast; the normals station may differ from the weather-module
  station (combine, never fuse — stated in the Evidence).
- **License/attribution:** CC BY 4.0; `Quelle: Deutscher Wetterdienst`.
- **TO VERIFY:** file names and column layout of the mean_91-20 tables.

---

## Integrated — real adapters, live once configured (honest "Konfiguration erforderlich" until then)

These providers have **complete, real adapter code**. Their manifest base status is
`proposed`; `getEffectiveProvider` upgrades them to `verified` (live) automatically once the
required configuration is present. Without it the API returns a `configuration-required`
envelope naming the exact env var — never demo, never invented data.

### CAMS — regional modelled air quality (`cams-eu-airquality`) — activate with `CAMS_ADS_KEY`
- **Endpoint:** Copernicus Atmosphere Data Store process API,
  `cams-europe-air-quality-forecasts`. **Registration + API key required.**
- **Implementation:** `adapters/cams.ts` submits a small-bbox retrieval, polls the job to
  completion, downloads the NetCDF result and extracts the **nearest grid cell** via the
  pure, unit-tested `cams/extract.ts` (`nearestGridValue`). The value is rendered as a
  regional grid cell (~10 km) with the cell-centre offset shown — **never** downscaled to an
  address, **never** merged with station observations.
- **Resolution:** 0.1° ("approximatively 10 to 20 km"). Median ensemble of 11 European
  models (CHIMERE/INERIS, EMEP/MET Norway, EURAD-IM/Jülich, LOTOS-EUROS/KNMI-TNO, MATCH/SMHI,
  MOCAGE/Météo-France, SILAM/FMI, DEHM/Aarhus, GEM-AQ/IEP-NRI, MONARCH/BSC, MINNI/ENEA).
- **License:** *Licence to Use Copernicus Products* (v1.2, Nov 2019) — clear, visible
  attribution required.
- **Attribution:** `Generated using Copernicus Atmosphere Monitoring Service information
  [Year]`; neither the European Commission nor ECMWF is responsible for any use of the data.
- **Provider caveat surfaced in Evidence:** "Outputs may not be correlated enough with real
  concentrations"; "not suitable for clinical trials".
- **TO VERIFY:** the ADS process-API request/response shape and NetCDF variable names against
  a real key (not possible from the egress-blocked build env). The extraction core is tested;
  the retrieval flow is structured per the documented API and endpoint-configurable.

### DELFI — nationwide static transit (`delfi-gtfs`) — activate with `GTFS_STATIC_PATH`/`GTFS_STATIC_URL`
- **Source:** GTFS via `https://www.opendata-oepnv.de/` (nationwide, updated typically
  Mondays). Central Stop Directory (zHV) free to all users.
- **Implementation:** `gtfs/import.ts` imports the feed (stops, routes, trips, stop_times,
  calendar, calendar_dates, feed_info) into SQLite; `gtfs/query.ts` does nearest-stop lookup
  and **calendar-aware scheduled departures** (day-of-week + date range + calendar_dates
  exceptions). Run `npm run gtfs:import --workspace apps/api -- <feed>`. Feed
  publisher/version are preserved into Evidence. Always labelled "scheduled" — never realtime.
- **Attribution:** `Datenquelle: DELFI e.V.`
- **TO VERIFY:** confirm opendata-oepnv registration + license for production; validate feed
  validity window and stop-matching against a real DELFI feed. For the full nationwide feed,
  use a regional extract (memory — see `docs/decisions.md`).

### GTFS-Realtime — DELFI DEEZ / gtfs.de (`delfi-gtfs-rt`) — activate with `GTFS_RT_URL`
- **Source:** DELFI DEEZ via the Mobilithek (GTFS-RT/SIRI; registration required) and/or the
  gtfs.de GTFS-RT stream (CC BY-SA 4.0, "ohne Gewähr"). **Coverage is PARTIAL** — only
  participating operators.
- **Implementation:** `gtfs/realtime.ts` decodes the GTFS-RT protobuf
  (`gtfs-realtime-bindings`) and summarizes trip-update delays and alerts **for nearby stops
  only**. Reported coverage is `partial`; the **absence** of updates is never presented as
  "no disruption / normal service".
- **Attribution:** `Datenquelle: DELFI e.V.` + gtfs.de as generator.
- **TO VERIFY:** document operator/area coverage before any realtime is labelled `confirmed`
  (currently reported as `partial`).

### Tankerkönig — fuel prices, MTS-K data (`tankerkoenig-mtsk`) — activate with `TANKERKOENIG_API_KEY`
- **Endpoint:** `https://creativecommons.tankerkoenig.de/json/list.php` (radius query,
  free API key). Data: official Markttransparenzstelle für Kraftstoffe (Bundeskartellamt);
  Tankerkönig is an UNOFFICIAL access layer, labelled as such.
- **Semantics:** operator-NOTIFIED prices (small delays/notification errors possible —
  stated); `false` prices normalized to null, never to 0. Fair use: 5-min cache per
  location (provider rule).
- **License/attribution:** CC BY 4.0; `Quelle: MTS-K / Tankerkönig`.
- **TO VERIFY:** `list.php` schema against a real key.

### DB FaSta — station elevators/escalators (`db-fasta`) — activate with `DB_CLIENT_ID` + `DB_API_KEY`
- **Endpoint:** `https://apis.deutschebahn.com/db-api-marketplace/apis/fasta/v2/facilities`
  (free DB API Marketplace credentials; nationwide snapshot cached and filtered locally,
  3-km radius).
- **Semantics:** DB stations only; `UNKNOWN` = "not determinable", never "working" —
  rendered exactly so.
- **License/attribution:** CC BY 4.0 (**TO VERIFY**); `Quelle: DB InfraGO AG (FaSta)`.
- **TO VERIFY:** schema (`equipmentnumber`/`geocoordX`/`geocoordY`) against real credentials.

---

## Vetted candidates (documented automatic interfaces, not yet integrated)

- **BVL Lebensmittelwarnung (`bvl-lebensmittelwarnung`, manifest `proposed`)** — official
  food/product recalls per Bundesland, bund.dev-documented. The documented interface's
  auth semantics must be verified live before an adapter is built; until then the manifest
  entry exists, the activation gate is hard-off, and nothing is served.
- **DB Timetables / RIS::Stations (Tier 2)** — documented DB API Marketplace services that
  could enrich the transit module (official station data, live departures) with the same
  free-credential gating as FaSta.
- **SMARD (Bundesnetzagentur)** — documented API, but national bidding-zone data with no
  place relation; only honest as an explicitly labelled "Deutschland-Kontext" panel
  (deliberately deferred).

---

## Evaluated and removed

### Thru.de / PRTR — reported industrial releases (removed 2026-07-17)

Facility-level PRTR declarations (incl. greenhouse gases CO2/CH4/N2O, with coordinates)
were the one credible, place-based GHG angle and were fully implemented in V1.1. They were
**removed by product decision**: Thru.de publishes no documented, stable bulk-download
endpoint or per-place query API — its CSV exports require a manual step through an
interactive UI, and this product's rule is that every live module must be fully automatic
(scraping undocumented interfaces stays forbidden by the reality policy). Aggregated
national/Länder GHG inventories remain out as well (no honest spatial relation to a pin).
Rationale: `docs/decisions.md`; the implementation is retrievable from git history should
Thru.de publish a documented automatic interface.

---

## Attribution strings (as rendered)

| Provider | Attribution |
| --- | --- |
| DWD (weather + warnings) | `Quelle: Deutscher Wetterdienst` |
| UBA | `Umweltbundesamt` |
| OSM (Overpass, Photon) | `© OpenStreetMap contributors` (ODbL) |
| OpenFreeMap | `OpenFreeMap © OpenMapTiles Data from OpenStreetMap` |
| WSV/PEGELONLINE | `Quelle: WSV / PEGELONLINE` |
| BfS ODL | `Quelle: Bundesamt für Strahlenschutz (BfS), ODL-Messnetz` |
| DWD (pollen, UV, radar, Klimanormale) | `Quelle: Deutscher Wetterdienst` |
| BBK NINA | `Quelle: Bundesamt für Bevölkerungsschutz und Katastrophenhilfe (BBK)` |
| BKG VG250 | `© GeoBasis-DE / BKG (2026)` |
| Autobahn GmbH | `Quelle: Autobahn GmbH des Bundes` |
| GFZ GEOFON | `Quelle: GFZ Helmholtz-Zentrum für Geoforschung / GEOFON` |
| Tankerkönig/MTS-K | `Quelle: MTS-K / Tankerkönig` |
| DB FaSta | `Quelle: DB InfraGO AG (FaSta, DB API Marketplace)` |
| CAMS (future) | `Generated using Copernicus Atmosphere Monitoring Service information 2026` |
| DELFI (future) | `Datenquelle: DELFI e.V.` |
| BKG VG250 (future) | `© BKG (Jahr) dl-de/by-2-0` |

## Consolidated TO VERIFY list

These are documented facts to confirm against the live services — **not** missing code. All
adapters are implemented; runtime Zod validation makes any schema mismatch fail visibly.

1. **Bright Sky** `/weather` response schema (live).
2. **DWD WFS** geometry column (`THE_GEOM`) + warning property names (live).
3. **UBA** array positional indices, component IDs, scope semantics, API version (v3 vs v4).
4. **Photon** — self-host for production; swap `PHOTON_URL`.
5. **CAMS** — ADS process-API request/response + NetCDF variable names against a real key.
6. **DELFI GTFS** — registration, license, feed validity, stop-matching against a real feed.
7. **GTFS-RT** — operator/area coverage documentation before any `confirmed` realtime.
8. **BKG VG250** boundaries — WFS integration + attribution (future enrichment).
9. **PEGELONLINE** — `stations.json` response schema + dl-de/zero-2-0 license wording (live).
10. **BfS ODL** — WFS property names + unit semantics (live).
11. **DWD pollen** — `s31fg.json` schema; optional polygon-based partregion assignment.
12. **DWD UV** — `uvi.json` schema; reconcile location names with the coordinate table.
13. **DWD radar** — Bright Sky `/radar` unit scaling + parameters; WMS overlay layer name.
14. **NINA** — dashboard payload schema; district-ARS convention.
15. **BKG VG250** — geometry column for INTERSECTS; property names (`ars`, `gen`, `bez`).
16. **Autobahn** — per-road response schema; license wording.
17. **GEOFON** — FDSN text column order; 204 semantics; license wording.
18. **DWD CDC normals** — mean_91-20 file names + column layout.
19. **Tankerkönig** — `list.php` schema against a real key.
20. **DB FaSta** — schema against real credentials.
21. **BVL Lebensmittelwarnung** — endpoint/auth semantics before any adapter is built.
