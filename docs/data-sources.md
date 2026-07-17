# Data sources & provider manifest

The machine-readable manifest is `packages/providers/src/manifest.ts`
(version **`2026-07-16.1`**). Only providers with status **`verified`** serve live
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

---

## Proposed — present in manifest, NOT serving live (surfaced honestly as "nicht integriert")

### CAMS — regional modelled air quality (`cams-eu-airquality`) — Stage 4
- **Endpoint:** Copernicus Atmosphere Data Store, dataset
  `cams-europe-air-quality-forecasts` (`cdsapi`). **Registration + API key required.**
- **Resolution:** 0.1° ("approximatively 10 to 20 km"). Median ensemble of 11 European
  models (CHIMERE/INERIS, EMEP/MET Norway, EURAD-IM/Jülich, LOTOS-EUROS/KNMI-TNO, MATCH/SMHI,
  MOCAGE/Météo-France, SILAM/FMI, DEHM/Aarhus, GEM-AQ/IEP-NRI, MONARCH/BSC, MINNI/ENEA).
  Analysis + up to +96 h forecast, hourly.
- **License:** *Licence to Use Copernicus Products* (v1.2, Nov 2019) — clear, visible
  attribution required.
- **Attribution:** `Generated using Copernicus Atmosphere Monitoring Service information
  [Year]`; neither the European Commission nor ECMWF is responsible for any use of the data.
- **Provider caveat to surface:** "Outputs may not be correlated enough with real
  concentrations"; "not suitable for clinical trials".
- **TO VERIFY (blocking activation):** ADS registration, `cdsapi` retrieval, data format
  (GRIB/NetCDF), product suitability. **Never** downscale/interpolate to an address; render
  as a visible grid/raster only.

### DELFI — nationwide static transit (`delfi-gtfs`)
- **Source:** NeTEx + GTFS via `https://www.opendata-oepnv.de/` (nationwide, updated
  typically Mondays). Central Stop Directory (zHV) free to all users.
- **Attribution:** `Datenquelle: DELFI e.V.`
- **TO VERIFY (blocking activation):** registration + license terms; GTFS feed validity
  period and stop-matching validation.

### GTFS-Realtime — DELFI DEEZ / gtfs.de (`delfi-gtfs-rt`)
- **Source:** DELFI DEEZ via the Mobilithek (GTFS-RT/SIRI; registration required) and/or the
  gtfs.de GTFS-RT stream (CC BY-SA 4.0, "ohne Gewähr"). **Coverage is PARTIAL** — only
  participating operators.
- **Attribution:** `Datenquelle: DELFI e.V.` + gtfs.de as generator.
- **TO VERIFY (blocking activation):** document operator/area coverage before any realtime is
  labelled `confirmed`. **Missing data must never imply "no disruption".**

---

## Attribution strings (as rendered)

| Provider | Attribution |
| --- | --- |
| DWD (weather + warnings) | `Quelle: Deutscher Wetterdienst` |
| UBA | `Umweltbundesamt` |
| OSM (Overpass, Photon) | `© OpenStreetMap contributors` (ODbL) |
| OpenFreeMap | `OpenFreeMap © OpenMapTiles Data from OpenStreetMap` |
| CAMS (future) | `Generated using Copernicus Atmosphere Monitoring Service information 2026` |
| DELFI (future) | `Datenquelle: DELFI e.V.` |
| BKG VG250 (future) | `© BKG (Jahr) dl-de/by-2-0` |

## Consolidated TO VERIFY list

1. **Bright Sky** `/weather` response schema (live).
2. **DWD WFS** geometry column (`THE_GEOM`) + warning property names (live).
3. **UBA** array positional indices, component IDs, scope semantics, API version (v3 vs v4).
4. **Photon** — self-host for production; swap endpoint.
5. **CAMS** — ADS registration, `cdsapi` retrieval, data format, product suitability (Stage 4).
6. **DELFI GTFS** — registration, license, feed validity, stop-matching (Stage 6).
7. **GTFS-RT** — operator/area coverage documentation before any `confirmed` realtime (Stage 6).
8. **BKG VG250** boundaries — WFS integration + attribution (future enrichment).
