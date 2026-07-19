# MASTERPROMPT — THE INVISIBLE CITY
## Reality-First Spatial Intelligence Dashboard
## Germany · V1 · Integration, Evidence & Comparison Layer
## Prompt version: 2.0 (verified July 2026)

You are the lead product engineer, UX designer, cartographer, data-integration
architect and quality owner for "The Invisible City".

Build a polished, local-first, map-first web application for Germany. It combines
permitted and documented data interfaces from established public, institutional and
operator services into ONE coherent, premium user experience.

The application does NOT create, simulate, interpolate, scrape, invent, silently
repair or claim ownership of weather, air-quality, transit or municipal data. It is
exclusively an INTEGRATION, EVIDENCE and COMPARISON layer over existing services —
"ein moderner Zusammenfluss der Daten" plus maps and more.

It creates: a modern shared map experience; one consistent place and time model; a
transparent comparison layer; source-aware presentation; clear data-status and
coverage communication; and a trustworthy interface for interpreting separate
datasets together.

The product must feel like ONE coherent spatial product — not a directory of
government portals, a set of embedded iframes, or a collection of unrelated
dashboards.

=====================================================================
0. META-DIRECTIVES (binding for you, the coding agent)
=====================================================================
- Act at all times: serious, considered, reality-based, deep, forensic, heuristic,
  transparent, intelligent. Ignore marketing and advertising language of any source.
- Use only verified, documented facts. Where a fact (endpoint, license, attribution
  string, coverage) is not verified in this prompt, DO NOT invent it: mark it in code
  and docs as "TO VERIFY" and add it to docs/data-sources.md as an open verification
  task before activating the provider.
- Prefer an explicit, visible limitation over a plausible-looking but unverified
  output. A visible limitation is a SUCCESSFUL product outcome.
- Every acceptance criterion below is testable. Do not declare a stage complete
  until its acceptance criteria pass in CI.

=====================================================================
1. PRODUCT STATEMENT
=====================================================================
The Invisible City helps people understand the verifiable environmental, place and
data context of a selected location in Germany. The user selects a place and a time.
The product combines only permitted, documented source interfaces and presents:
- weather, forecast and official warning context (DWD);
- observed station-based air quality (UBA/Länder);
- optionally, regional modelled air-quality background (CAMS, ~10 km grid);
- mapped place context such as parks, stops and selected amenities (OSM/BKG);
- transit information AVAILABILITY, not universal transit reliability;
- a comparison of up to three selected places;
- source, method, time, spatial relevance and limitations for every material claim.

Core product promise (German, keep verbatim):
"Ein Ort. Ein Zeitpunkt. Eine Karte. Belastbare Datenquellen – mit sichtbaren Grenzen."

=====================================================================
2. NON-NEGOTIABLE REALITY POLICY
=====================================================================
2.1 The application is an INTEGRATION layer, not a replacement for DWD, UBA, CAMS,
DELFI, transport operators, municipal portals, BKG, geocoding or map providers. It
integrates source data through documented, permitted technical interfaces.

Never:
- embed third-party dashboards as the main product experience (no iframes of foreign
  dashboards);
- scrape visual dashboards, charts or undocumented endpoints;
- copy source UI design, visualizations or copyrighted content;
- use data when its license, attribution, permitted access or technical interface is
  unclear;
- present a source as verified without a documented review;
- invent a value when a provider fails;
- silently substitute a different provider;
- silently fall back to demo data.

2.2 Combine context; never fabricate a merged truth. The system may show several
relevant data views for one place and one time, but must never turn non-equivalent
data into an allegedly precise local truth. Examples:
- A UBA station observation is not the air quality at every nearby street.
- A CAMS grid value (~10 km cell) is not an address-level concentration.
- A DWD MOSMIX forecast is not a measurement at a pin.
- A planned departure is not a real-time departure.
- Missing service alerts do not mean normal transit operation.
- A mapped park does not prove shade, cooling, opening, safety or accessibility.
- A mapped toilet or drinking-water point does not prove it is open or operating.
Combine context side by side; never fuse incomparable inputs into scores, rankings
or pseudo-precise local claims.

2.3 Prefer explicit uncertainty. Prefer "Not available for this place or time" over
a weak proxy, a generic estimate, a visually persuasive but unsupported map, a hidden
provider fallback, or a universal score.

2.4 Every source-backed output MUST identify its data mode:
observed | forecast | modelled | mapped | scheduled | realtime | partial | cached |
unavailable | demo.

=====================================================================
3. V1 SCOPE
=====================================================================
3.1 V1 INCLUDES

A. Map-first interface
- Interactive Germany map (MapLibre GL JS).
- Search by place name, address, coordinates and selected POI types.
- Map click to set a temporary analysis point; reverse-geocoded label where available.
- Zoom, pan, keyboard navigation, touch interactions.
- Search result selection AND map-click MUST produce the same SelectedPlace contract.
- Up to three persistent comparison pins: A, B, C.
- Clear selected, hover and keyboard-focus states.
- Mobile: accessible bottom sheets; desktop: panels.

B. Shared place and time model
- One selected location; one selected point in time; "Now" and short-term forward
  time selection.
- Display time in Europe/Berlin; correct daylight-saving handling.
- Every module declares whether it supports the selected time and distinguishes data
  time, validity time, retrieval time and cache age.
- NOTE on source time semantics (verified): the UBA JSON API returns timestamps in
  CET/MEZ (no DST shift) — normalize deliberately to Europe/Berlin and preserve the
  original source time in Evidence.

C. DWD weather and warning context
- Weather forecast/observation only from a verified DWD-compatible, documented
  integration. Two documented access paths (choose per adapter and record in manifest):
  (1) DWD Open Data server https://opendata.dwd.de (no registration, no API key;
      MOSMIX_L: 4x/day, ~115 parameters, up to +240 h, KML/KMZ; single-station files
      under /weather/local_forecasts/mos/MOSMIX_L/single_stations/);
  (2) Bright Sky JSON API https://api.brightsky.dev/weather (UNOFFICIAL third-party
      convenience layer operated by Jakob de Maeyer; open-source, MIT; no API key; the
      DWD Terms of Use apply to the underlying data). If Bright Sky is used, label it
      in the Evidence Inspector as an unofficial access layer over DWD data, and keep
      a direct-opendata.dwd.de fallback path documented.
- Official warnings via the DWD GeoServer (verified): WFS at
  https://maps.dwd.de/geoserver/dwd/ows (layer dwd:Warnungen_Gemeinden), filterable
  via CQL; and/or the CAP products on the Open Data server. Show warning context
  SEPARATELY from general forecast.
- Relevant baseline values where cleanly available: temperature; apparent temperature
  only where source/method is clear; precipitation; wind; gusts; official warning
  context; optional UV only after source and semantics are verified.
- State whether a value is observed, forecast or unavailable.
- Preserve DWD attribution (see Source Governance §5.4). Do NOT create local
  microclimate, street-temperature or shade claims.

D. Air Quality Context — implemented as TWO distinct evidence layers
1. Official station observations (UBA/Länder), verified interface:
   https://luftdaten.umweltbundesamt.de/ (Air Data API v4; JSON, no API key).
   Pollutants where supplied: PM10, PM2.5, NO2, O3, SO2, CO (and others). Show
   station name, identifier, station type where supplied, measurement timestamp,
   distance from selected location, provisional/partial/stale status, explicit
   station limitations. Data of the CURRENT year are provisional ("nicht endgültig
   geprüft"; final data published in June of the following year); UBA cannot guarantee
   completeness — surface this as data status.
2. Optional regional model context (CAMS European air quality), only after access,
   licensing, attribution, technical retrieval and product suitability are verified:
   dataset cams-europe-air-quality-forecasts via the Copernicus Atmosphere Data Store
   (ADS, https://ads.atmosphere.copernicus.eu; REGISTRATION + API key REQUIRED, cdsapi).
   Resolution 0.1° (documented "approximatively 10 to 20 km"); median ensemble of 11
   European models (CHIMERE/INERIS, EMEP/MET Norway, EURAD-IM/Jülich IEK, LOTOS-EUROS/
   KNMI-TNO, MATCH/SMHI, MOCAGE/Météo-France, SILAM/FMI, DEHM/Aarhus, GEM-AQ/IEP-NRI,
   MONARCH/BSC, MINNI/ENEA); analysis and up to +96 h forecast (4-day). Render as a
   visible raster/grid context; NEVER downscale or interpolate to a user address. Show
   pollutant, valid time, model mode, grid resolution, source and model uncertainty
   where available. Provider caveat to surface: "Outputs may not be correlated enough
   with real concentrations"; "not suitable for clinical trials".
Rules: never merge station and model into one "local air value"; compare observed with
observed and modelled with modelled only when time/pollutants/context are comparable;
a distant station is a regional reference, never local; no "clean-air walk", routing,
exposure calculation, health conclusion or "safest air" claim. If only a model is
present, label it "regionaler modellierter Hintergrund".

E. Place and mapped context
- Administrative context when obtainable (locality, municipality, state, country,
  optional boundary) — BKG VG250 boundaries and/or OSM.
- Selected mapped POIs/geometry: parks/green areas; transit stops; pharmacies; public
  toilets; drinking-water points; selected public facilities — via OpenStreetMap
  (Overpass API) with proper attribution. Cluster dense point layers. Show data age
  and completeness disclaimer.
- POIs are supplementary cartographic context, NOT operational guarantees. Do not show
  opening hours, accessibility, operating status, safety, shade, cooling or
  availability unless a separate verified local source explicitly supports the exact
  claim.

F. Transit Context & Data Availability (heterogeneous in Germany)
No universal transit-quality, routing, punctuality or real-time promise. Separate
layers only:
1. Stop context: nearby stop name, coordinates, distance; line/mode only where reliably
   supplied; source and coverage label. Source options: DELFI Central Stop Directory
   (zHV) and/or the nationwide DELFI GTFS dataset.
2. Scheduled timetable context: planned departures ONLY from a verified static source
   (DELFI GTFS via https://www.opendata-oepnv.de/ or gtfs.de feeds), valid and correctly
   matched to a stop; always label "scheduled"; show feed publication/update and validity
   period; never imply actual operation.
3. Realtime and service-alert context: ONLY for explicitly verified operator/area/mode
   coverage. In Germany, nationwide GTFS-Realtime coverage is PARTIAL (DELFI DEEZ via
   Mobilithek in GTFS-RT/SIRI; gtfs.de GTFS-RT stream, CC BY-SA 4.0, published "ohne
   Gewähr" and covering only participating operators). Status is one of: confirmed |
   partial | not-covered | unknown | temporarily-unavailable. Show feed age, operator,
   coverage, limitations. Do NOT infer "no disruption" from missing data.
V1 EXCLUDES: nationwide routing; universal departure boards; reliability scores;
arrival/punctuality predictions; "good/bad transit" ratings; universal accessibility
or lift-outage coverage; any assertion that "no alert" means normal service.

G. Comparison A / B / C
- Pin up to three places; compare only compatible, simultaneously meaningful data.
- Display data mode beside every value, e.g. "PM2.5 9 µg/m³ · modelled · approx. 10 km"
  vs. "PM2.5 11 µg/m³ · observed · station 1.4 km".
- Compare: weather context; warning status; air-quality data mode & values; station
  distance where applicable; transit data availability; POI proximity/context; source
  freshness; data coverage.
- Do NOT calculate an overall score, a "best place" rank, or a universal recommendation.
  Use transparent factual comparison statements only.

H. Evidence Inspector — for every material value, layer, comparison and derived display:
value & unit; source provider & responsible institution; source URL/identifier; source
category; data mode; method description; observation/forecast/publication/validity/
retrieval time as relevant; cache age & expiry; spatial relation (point station +
distance; raster/grid resolution; polygon/geometry; provider coverage);
completeness/provisional status; limitations; license & attribution requirements;
original-source or methodology link where safe and permitted.

I. Coverage and availability matrix (core feature, not a debug screen) — per location,
a simple, non-judgmental matrix, e.g.: Weather forecast: available · Official warnings:
available · Air station: 18 km away · Regional air model: available, approx. 10-km grid
· Nearby stops: available · Scheduled transit: available/not confirmed · Transit
realtime: partial/not covered · Mapped POI context: available, completeness unknown.

J. Error, partial-data and demo handling
- Explicit UI states: loading, available, partial, stale, unavailable, source error,
  configuration required, demo.
- Explain what is missing, why it matters, what cannot be concluded.
- Retain last good response only when visibly labelled with its age.
- Demo mode is opt-in and permanently labelled while active:
  "DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN".
- Demo/live data cannot coexist in the same conclusion, panel or comparison.
- Provider failure must NEVER cause an unannounced demo fallback.

K. Accessibility, privacy, performance
- Keyboard-accessible controls, panels and map alternatives; focus == hover.
- Respect prefers-reduced-motion; color must never be the sole carrier of data status.
- No user accounts in V1; no advertising, tracking or location-history retention;
  geolocation only after explicit browser permission; no secrets in frontend code.
- Cache per source terms; progressive loading, clustering, request cancellation,
  deduplication, rate limiting, error-safe retries; do NOT load nationwide bulk
  datasets into the browser (respect Overpass/Nominatim usage policies — see §5).

3.2 V1 EXPLICITLY EXCLUDES (do not implement/promise/simulate as Germany-wide V1):
street-level shade maps; tree-canopy/cooling/microclimate maps; nationwide cooling-place
coverage; street-level air pollution; local exposure estimates; air-quality walking
routes; citywide heat-escape routes; universal toilet/drinking-water operational status;
universal opening hours; safety/crime/"safe-at-night" evaluations; universal transit
realtime/alerts/accessibility/lift outages; nationwide transit routing; transit
reliability/quality scoring; municipal roadworks/parking/events/sensor coverage;
municipality ranking pages; quality-of-life/comfort/health/smart-city scores; generated
values to fill a source-data gap; unverified third-party integrations; public-cloud
deployment unless separately approved.

3.3 FUTURE LOCAL ENRICHMENTS — opt-in, location-specific, only after source review,
each requiring: named authority/operator; documented source & license; legal/technical
permission; spatial reference; temporal semantics; validated schema; coverage
description; visible attribution; explicit non-availability outside its verified area.
Never generalize a local capability into a Germany-wide claim.

=====================================================================
4. PRODUCT EXPERIENCE
=====================================================================
4.1 Desired impression: calm; premium; data-rich but uncrowded; map-first; legible;
fast; transparent; professional rather than governmental; confident without pretending
certainty. Avoid: rainbow maps; alarmist red states for ordinary missing coverage;
widget clutter; giant "truth scores"; fake AI recommendations; visual claims beyond
evidence.
4.2 Desktop layout: Left "Place Lens" (compact context + data-mode chips); Centre
"Interactive Map" (dominant, layer controls, legend, A/B/C pins); Right "Evidence
Inspector". Bottom: time control; compare strip; concise coverage status. Mobile: map
primary; Lens and Inspector as accessible bottom sheets; no critical info hover-only.
4.3 Layer strategy: only ONE primary analytical layer dominates at a time (Weather &
warnings | Air: station observations | Air: regional model | Transit context | Place &
mapped context | Data availability). Every layer must have a legend and identify source,
data mode, spatial meaning, time applicability and limitations.

=====================================================================
5. SOURCE GOVERNANCE
=====================================================================
5.1 Source hierarchy: (1) official German federal/state authorities; (2) official
European institutional services; (3) transport operators and verified associations;
(4) official municipal sources; (5) documented supplementary cartographic sources;
(6) other sources only after explicit approval. No source is permanently presumed
valid; review every integration against current documentation, license, attribution
and technical terms before activation.

5.2 Provider manifest — versioned, machine-readable, per provider: provider ID; display
name; responsible institution; source category; original source URL; technical endpoint/
configuration; access method; license; attribution text; coverage; update cadence;
supported data modes; supported geographic semantics; validation schema version; cache
policy; status (proposed | verified | suspended | deprecated); review date; known
limitations. Only "verified" providers may serve live production responses.

5.3 Provider failure policy: validate every external response at runtime; reject
malformed/semantically invalid data; never conceal source failure; do not auto-suspend
permanently from a single transient error; record health telemetry internally; suspend
only per documented policy; surface temporary outage as temporary; never replace an
official source with an unreviewed aggregator invisibly.

5.4 VERIFIED PROVIDER REGISTER (seed values — the agent must re-verify at build time
and mark anything unconfirmed as "TO VERIFY"):

[DWD — weather, forecast]
- Endpoint: https://opendata.dwd.de (no registration, no API key; MOSMIX_L 4x/day,
  ~115 params, +240 h; single_stations/ folder) AND/OR https://api.brightsky.dev/weather
  (unofficial JSON layer, MIT, no key).
- License: Creative Commons BY 4.0 (CC BY 4.0). Verbatim (DWD Rechtliche Hinweise):
  "Alle frei zugänglichen Geodaten und Geodatendienste sowie die als hochwertige
  Datensätze / high value datasets (HVD) festgelegten Leistungen des DWD dürfen unter
  den Bedingungen der Lizenz Creative Commons BY 4.0 (CC BY 4.0) unter Beigabe eines
  Quellenvermerks weiterverwendet werden." This SUPERSEDES the older GeoNutzV wording
  still found on some legacy DWD subpages; treat CC BY 4.0 as current.
- Attribution (verified official text form): "Quelle: Deutscher Wetterdienst" (or the DWD
  logo). For modified data: "Datenbasis: Deutscher Wetterdienst, ...". The string
  "© Deutscher Wetterdienst" is NOT the officially prescribed template — mark as
  TO VERIFY if you intend to use the © form.
- Availability: NOT guaranteed. Verbatim: "Es besteht derzeit kein Anspruch auf
  Verfügbarkeit dieser Dienste." → Cache, visible outages and data status are MANDATORY.

[DWD — official warnings]
- Endpoint (verified): WFS https://maps.dwd.de/geoserver/dwd/ows, layer
  dwd:Warnungen_Gemeinden (CQL-filterable, JSON output); plus CAP products on
  opendata.dwd.de. Geodienste stated availability ~98%, still without legal guarantee. [Deutscher Wetterdienst](https://www.dwd.de/DE/leistungen/geodienste/help/nutzung_geodienste.html?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=eca25661-55ca-4371-8a2d-5823adcc8038)
- License/attribution: as DWD above (CC BY 4.0; "Quelle: Deutscher Wetterdienst").
  Warning geometries may carry EC_LICENSE "© GeoBasis-DE / BKG (year) (Daten
  modifiziert)" — preserve any embedded license field.

[UBA / Länder — observed air quality]
- Endpoint: https://luftdaten.umweltbundesamt.de/ (Air Data API v4; JSON, no API key).
  Components: PM10, PM2.5, NO2, O3, SO2, CO (+ others). >400 stations. JSON timestamps
  in CET/MEZ. Current-year data are PROVISIONAL; final data published in June of the
  following year; completeness NOT guaranteed.
- License: Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0),
  https://www.govdata.de/dl-de/by-2-0.
- Attribution: "Umweltbundesamt" (+ note "Daten verändert" if modified).

[CAMS — regional modelled air quality] (optional, Stage 4)
- Endpoint: Atmosphere Data Store, dataset "cams-europe-air-quality-forecasts",
  https://ads.atmosphere.copernicus.eu (API via cdsapi). REGISTRATION + API KEY REQUIRED.
- Resolution: 0.1° ("approximatively 10 to 20 km"). Median ensemble of 11 models
  (CHIMERE/INERIS, EMEP/MET Norway, EURAD-IM/Jülich IEK, LOTOS-EUROS/KNMI-TNO, MATCH/
  SMHI, MOCAGE/Météo-France, SILAM/FMI, DEHM/Aarhus, GEM-AQ/IEP-NRI, MONARCH/BSC,
  MINNI/ENEA); analysis + up to +96 h forecast; hourly steps. Explicit provider caveat:
  "Outputs may not be correlated enough with real concentrations"; "not suitable for
  clinical trials".
- License: "Licence to Use Copernicus Products" (Version 1.2, Nov. 2019): "All users of
  Copernicus Products must provide clear and visible attribution to the Copernicus
  programme."
- Attribution: "Generated using Copernicus Atmosphere Monitoring Service information
  [Year]"; state that neither the European Commission nor ECMWF is responsible for any
  use of the data.

[DELFI — nationwide static transit + realtime]
- Static: NeTEx + GTFS via https://www.opendata-oepnv.de/ (DELFI dataset; nationwide;
  updated typically Mondays). Central Stop Directory (zHV) free to all users. [Opendata-oepnv](https://www.opendata-oepnv.de/ht/en/organisation/delfi/start?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=b9009224-468c-4dff-adbe-4826991f5633)
- Realtime: DELFI DEEZ via the Mobilithek (GTFS-RT Trip Updates / SIRI-ET); [Delfi](https://www.delfi.de/de/aktuelles/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=b54aef38-39cd-4529-b76e-249d2455f5b4)
  registration on the Mobilithek required; coverage PARTIAL.
- License/attribution: DELFI e.V. attribution required (e.g. "NeTEx Datensatz, DELFI
  e.V." / "Datenquelle: DELFI e.V."); if data enters OSM, indirect attribution suffices. [Opendata-oepnv](https://www.opendata-oepnv.de/ht/en/organisation/delfi/start?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=77636df9-63ba-4b87-aaba-db03e08300f7)

[gtfs.de — convenience GTFS derived from DELFI]
- Static feeds (de_full/de_nv/de_rv/de_fv), free tier valid 30 days from publication; [Gtfs](https://gtfs.de/de/services/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=4e993f6e-76ae-412e-9e90-cf9da3f09e69)
  >20,000 lines, >500,000 stop points, ~2M journeys. [Gtfs](https://gtfs.de/en/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=25c969c5-1bc3-427e-846f-83bc7a24a834) Realtime: GTFS-RT stream,
  CC BY-SA 4.0, "ohne Gewähr", partial operator coverage. [Gtfs](https://gtfs.de/de/realtime/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=ffc7ccee-e29f-4fcd-bac3-4e289e0c994c)
- Attribution: DELFI e.V. (data origin) + gtfs.de as generator per its terms.

[OpenStreetMap — POI / geometry via Overpass]
- Endpoint: https://overpass-api.de/api/interpreter (public instance). Fair-use: one
  query at a time, NO parallel queries; queue >15 s → HTTP 429. [OpenStreetMap](https://wiki.openstreetmap.org/wiki/Overpass_API/versions?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=749e5337-580f-4816-8b42-ddfd5f1c1c00) For sustained/bulk use,
  self-host Overpass or use Geofabrik extracts [GeoFabrik](https://www.geofabrik.de/data/overpass-api.html?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=b4806e10-bfbc-4b16-aa66-619bbdab9716) — do NOT bulk-load into the browser.
- License: ODbL. Attribution (verified): "© OpenStreetMap contributors", linked to
  openstreetmap.org/copyright, with a note that data is under ODbL.

[Geocoding — Nominatim / Photon]
- Nominatim public API https://nominatim.openstreetmap.org: MAX 1 request/second; valid
  identifying User-Agent required; [OpenStreetMap Foundation](https://operations.osmfoundation.org/policies/nominatim/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=ec84e145-18f8-4e28-8a32-763606bed413) results MUST be cached; NO client-side autocomplete;
  NO systematic/bulk queries; attribution required. Policy note (verbatim, OSMF Nominatim
  Usage Policy): "The public Nominatim API must not be built into, offered through,
  suggested by, or automatically generated by no-code, low-code, or vibe-coding platforms
  as a generic geocoding, address lookup, place search, or map search service." →
  for production, SELF-HOST Nominatim or Photon. License ODbL.
- Photon (komoot) https://photon.komoot.io: Apache-2.0 code, [Grokipedia](https://grokipedia.com/page/Photon_geocoding?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=1a1009e6-d306-48f3-8d27-1bb4dd5e15d7) OSM/ODbL data; search-as-
  you-type capable; public demo "no guarantee of availability", extensive use throttled; [Komoot](https://photon.komoot.io/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=b407b6ce-70c7-4cca-aef5-10562d019278)
  self-host recommended (Java 21+, [Grokipedia](https://grokipedia.com/page/Photon_geocoding?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=02022a59-6d73-48fd-801f-cf18cd0e64d1) GraphHopper weekly dumps). [GitHub](https://github.com/komoot/photon?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=9049f908-1462-4b83-b062-efed1eb79971) Prefer a self-hosted Photon
  for autocomplete.

[Base map / vector tiles]
- basemap.de Web Vektor (BKG): style JSON at
  https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/... (MapLibre-compatible; monthly
  updates; official German geobasis data). License: CC BY 4.0, geldleistungsfrei. [Bund](https://mis.bkg.bund.de/trefferanzeige?docuuid=5417CFE8-F0EC-4629-BADB-493864DB466A&claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=0fdbfd4b-383a-493b-a1e9-d2248d2f0e8f)
  Attribution per BKG.
- OpenFreeMap: https://tiles.openfreemap.org/styles/{liberty|positron|bright}; [Leafmap](https://leafmap.org/maplibre/openfreemap/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=0524a8ee-caa7-49b7-84b9-322170749ce8) NO API
  key, NO registration, no request limits on the public instance; [Openfreemap](https://openfreemap.org/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=72fdbabd-fb10-4ed3-b930-10dd3f4e1b39) self-hostable. Code
  MIT; data OSM. Attribution (auto-added by MapLibre): "OpenFreeMap © OpenMapTiles
  Data from OpenStreetMap". [Openfreemap](https://openfreemap.org/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=dae985fc-df5f-47f8-939e-22b977f7a069) [GitHub](https://github.com/hyperknot/openfreemap?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=94011c4c-92bc-4f76-b883-227d1735ea9d)
- Choose ONE primary base map; both are advertising-free.

[BKG VG250 — administrative boundaries]
- Source: https://gdz.bkg.bund.de (Open Data) / WFS
  https://sgx.geodatenzentrum.de/wfs_vg250. License: Datenlizenz Deutschland
  Namensnennung 2.0 (dl-de/by-2-0). [Geodatenzentrum](https://sgx.geodatenzentrum.de/wfs_vg250?Request=GetCapabilities&SERVICE=WFS&claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=2df093f5-e940-4723-98eb-df39cbc070a0) Attribution (verified): "© BKG (Jahr des letzten
  Datenbezugs) dl-de/by-2-0, Datenquellen: https://sgx.geodatenzentrum.de/web_public/
  gdz/datenquellen/datenquellen_vg_nuts.pdf". [Geodatenzentrum](https://sgx.geodatenzentrum.de/wfs_vg250-ew?Request=GetCapabilities&SERVICE=WFS&claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=6b9b5016-a426-4d82-bcd4-5f64a3d8acca)

=====================================================================
6. DATA CONTRACTS (strict TypeScript + Zod at every external boundary)
=====================================================================
type DataMode = "observed" | "forecast" | "modelled" | "mapped" | "scheduled"
  | "realtime" | "partial" | "cached" | "unavailable" | "demo";

type SpatialContext =
  | { kind: "station"; stationId: string; distanceMeters?: number; stationType?: string }
  | { kind: "grid"; resolutionKm?: number; gridId?: string }
  | { kind: "geometry"; geometryType: "point" | "line" | "polygon" }
  | { kind: "coverage"; description: string }
  | { kind: "unknown" };

type Evidence = {
  providerId: string; providerName: string; institution: string;
  sourceUrl?: string; license?: string; attribution?: string;
  mode: DataMode; method: string;
  observedAt?: string; forecastIssuedAt?: string; validAt?: string;
  publishedAt?: string; retrievedAt: string; cacheAgeSeconds?: number;
  spatial: SpatialContext;
  completeness: "complete" | "partial" | "provisional" | "unknown";
  limitations: string[]; schemaVersion: string;
};

type EvidenceValue<T> = {
  value: T | null; unit?: string;
  status: "available" | "partial" | "stale" | "unavailable" | "error" | "demo";
  evidence: Evidence[];
};

type SelectedPlace = {
  id: string; label: string;
  coordinates: { latitude: number; longitude: number };
  locality?: string; municipality?: string; state?: string; country: "DE";
};

type TransitCoverage = "confirmed" | "partial" | "not-covered" | "unknown"
  | "temporarily-unavailable";

Rules: do not remove evidence during normalization; do not transform incompatible source
modes into the same field without a mode discriminator; do not return a numeric default
for unavailable data; all API responses expose source status and limitations.

=====================================================================
7. TECHNICAL ARCHITECTURE
=====================================================================
7.1 Stack (verified stable/LTS, July 2026 — prefer these, pin exact versions in
package.json at build time):
- Node.js 24 LTS (Active LTS "Krypton", released 2025-05-06, EOL 2028-04-30). Do NOT
  default to Node 22 (Maintenance LTS, EOL 2027-04-30) unless a dependency requires it;
  Node 26 is Current (released 2026-05-05, becomes LTS Oct 2026).
- npm workspaces; TypeScript (strict mode); React + Vite frontend; Fastify backend.
- MapLibre GL JS v5 (current stable line; latest v5 is 5.24.0, the final v5 release
  series; 3-Clause BSD). [GitHub](https://github.com/maplibre/maplibre-gl-js?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=7ae583af-9ccd-476c-8c5b-4b4e76457f2c) v6 is in pre-release/transition — do NOT adopt for V1 unless
  verified stable.
- TanStack Query (server state); Zustand (local UI state); Zod (contracts + validation).
- SQLite for local cache/reference metadata: default better-sqlite3. The built-in
  node:sqlite is a viable alternative (Release Candidate as of Node 24.15.0, [Better Auth](https://better-auth.com/docs/adapters/sqlite?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=8269b2b3-9145-4998-b7ff-dc0b4c3d5a74) stabilized
  in Node 26) — you MAY use it to drop the native dependency, but verify feature parity
  (no db.transaction() wrapper; no serialize/deserialize) [Jangwook](https://jangwook.net/en/blog/en/node-sqlite-builtin-practical-guide-2026/?claude-citation-50ecb49f-2e2a-4032-aa51-7fa364275576=74ad5c72-e895-448b-ab9c-d3a11906dd45) before switching.
- Vitest (unit/integration); Playwright (browser); ESLint + Prettier.
- Docker only after native local development works.
Version policy: where a specific version is not verified at build time, use the current
stable/LTS release and record the pinned version in docs/decisions.md.

7.2 Architecture boundaries
apps/  web/ (React + MapLibre)   api/ (Fastify API + provider orchestration)
packages/  contracts/ (Zod + types)   evidence/ (evidence/availability/limitations)
           providers/ (source adapters)   map-style/ (layer styles, legends, tokens)
           ui/ (accessible components)   test-fixtures/ (demo + provider fixtures)
docs/  product-charter.md · architecture.md · data-sources.md · evidence-policy.md ·
       map-semantics.md · privacy.md · testing.md · decisions.md · progress.md ·
       release-v1.md

7.3 Provider-adapter rule: each adapter is isolated and exposes normalized contracts:
source -> fetch/permitted download -> runtime validation -> provider-specific
normalization -> Evidence attachment -> cache with source-aware TTL -> normalized API
response -> map/lens/inspector/comparison UI. Each adapter documents endpoint behavior,
query params, response schema, rate/caching assumptions, attribution, known gaps, error
mapping, test fixtures. NO provider parsing logic in React components.

7.4 Caching: cache only per provider terms and data semantics; store retrieval time,
expiry time, provider ID, request fingerprint, schema version, response hash, evidence;
cache keys include place/time/layer params; never present cache age as live freshness; a
stale response is usable only if visibly marked; never cache precise user location history
as an analytics feature. (DWD availability is not guaranteed → caching + visible outage is
mandatory. Respect Overpass/Nominatim caching obligations.)

=====================================================================
8. MAP SEMANTICS
=====================================================================
8.1 Core rule: visual precision must NOT exceed data precision.
8.2 Air quality: station data = point markers only, no interpolation; CAMS = grid/raster,
no smooth street-level heatmap; show uncertainty via legend/label/inspector/optional
restrained transparency; never color the map as if each street had a measured value.
8.3 Weather: show forecast/observation distinction; warnings are source-defined
areas/events, not inferred local severity; never imply a pin is a DWD measurement station.
8.4 Transit: stop markers show stop context; scheduled/realtime distinctions stay visible;
missing realtime is neutral grey, not a failure; cluster dense stops/POIs.
8.5 POIs: contextual symbols only; green means "mapped context", not "good"; never infer
openness, accessibility, safety or operating state.

=====================================================================
9. WORDING POLICY (careful German UI language — keep in German)
=====================================================================
Allowed: "Prognose"; "Gemessen an Station …"; "Regional modellierter Hintergrund";
"Kartierter Kontext"; "Fahrplan verfügbar"; "Echtzeit teilweise abgedeckt"; "Keine
verifizierten Daten verfügbar"; "Für diesen Vergleich nicht ausreichend vergleichbar".
Disallowed: "Hier ist die Luft sauber"; "Sauberster Spaziergang"; "Die beste Gegend";
"Der zuverlässigste ÖPNV"; "Keine Störung" (when coverage is absent); "Sicherer Ort";
"Schatten vorhanden" (from park geometry); "Kühlort" (without verified local source);
"Live" (for cached/scheduled data); "Exakter Wert am Standort" (for a grid/station proxy).

=====================================================================
10. IMPLEMENTATION PLAN (vertical slices; each shippable, tested, visibly honest)
=====================================================================
Stage 0 — Foundation
- Repo, linting, formatting, strict TypeScript, test setup; architecture, product
  charter, evidence policy, source register, decision log; provider manifest +
  normalized evidence contracts; app shell, dark tokens, accessible layout; explicit
  Demo Mode fixtures.
- Acceptance: local start works; lint, typecheck, tests pass; demo mode permanently
  labelled; no live source call exists without a provider-manifest entry.

Stage 1 — Map, place, evidence shell
- MapLibre base map (basemap.de or OpenFreeMap); place search abstraction + map-click
  selection; Place Lens, Evidence Inspector, layer controls, availability matrix; A/B/C
  pins + comparison shell; responsive desktop/mobile.
- Acceptance: same SelectedPlace contract for search and map click; keyboard path works;
  inspector works with demo fixtures; A/B/C comparison always includes data mode.

Stage 2 — DWD weather context
- Verified DWD adapter (opendata.dwd.de and/or Bright Sky, labelled); forecast/
  observation + warning context (maps.dwd.de WFS / CAP); cache, source status,
  loading/error/partial states; weather map layer + inspector content.
- Acceptance: observed/forecast/unavailable never conflated; all values expose source +
  valid time; warning context separate; provider failure visible; tests cover valid,
  missing, malformed responses; DWD attribution present.

Stage 3 — UBA station air quality
- UBA/Länder adapter after interface verification; station discovery, pollutants,
  timestamps, station type, distance; point-marker layer + station inspector; comparison
  only among comparable station values.
- Acceptance: no interpolation; distant station labelled as distant; provisional/partial
  state shown; source + station metadata retained; no "local air quality" claim from a
  distant station.

Stage 4 — Optional CAMS regional context
- Proceed only after access, product suitability, attribution and technical retrieval are
  verified. Regional grid/raster adapter; explicit grid/raster layer; model time, grid
  resolution (~10 km), uncertainty; station and model views separate.
- Acceptance: no address-level transformation; no station/model fusion; model vs
  analysis/forecast clear; comparison only among compatible model values; Copernicus
  attribution visible in map and inspector.

Stage 5 — Place and POI context
- Documented OSM/Overpass (+ BKG) adapter; parks, stops, pharmacies, toilets, drinking
  water, selected facilities; clustering, filters, source labels; respect Overpass fair
  use (no browser bulk loads).
- Acceptance: POIs labelled mapped context; no opening/accessibility/availability
  assertion; performance acceptable at dense zoom; OSM attribution present.

Stage 6 — Transit availability context
- Integrate each transit source only after source-specific verification. Nearby-stop
  context; scheduled departures only for a valid, scoped integration (DELFI/gtfs.de);
  realtime coverage state (partial), realtime only within confirmed coverage; source +
  feed-age evidence.
- Acceptance: scheduled and realtime cannot be visually confused; absence of realtime
  never means normal service; no routing; no reliability rating; coverage gaps explicit.

Stage 7 — Polish and hardening
- Performance and cache behavior; mobile sheets + keyboard interaction; robust
  empty/error/stale states; complete attribution, source docs, privacy docs, release
  report; independent reviews.

=====================================================================
11. TESTING REQUIREMENTS (no feature complete without tests)
=====================================================================
Unit: evidence construction/propagation; data-mode rendering; timezone & DST handling
(incl. UBA CET normalization); provider status rules; cache freshness/staleness;
station-distance logic; comparability rules; transit coverage status; demo/live
separation; wording-policy helpers.
Integration (fixtures): valid response; missing value; partial; provisional; stale cache;
malformed schema; timeout; rate limit (429 from Overpass/Nominatim); source outage;
provider coverage gap; incompatible comparison; demo source.
Playwright: search + map-click selection; layer switching; inspector opening; time control;
A/B/C pin + comparison; weather/air/transit state labels; explicit unavailable/partial/
stale views; keyboard navigation; reduced-motion; mobile bottom-sheet flow; demo banner +
demo/live exclusion.
Quality gates before V1 complete: lint passes; formatting passes; strict typecheck passes;
unit/integration/E2E pass; production build passes; manual review of attribution + visible
limitations passes; no blocked source-governance issue remains undocumented.

=====================================================================
12. DOCUMENTATION REQUIREMENTS
=====================================================================
Maintain: README.md (setup, run, tests, env vars, architecture, limits); docs/
product-charter.md; architecture.md; data-sources.md (provider manifest summary, license,
attribution, coverage, limitations, and every "TO VERIFY" item); evidence-policy.md;
map-semantics.md; privacy.md; testing.md; decisions.md (incl. pinned dependency versions);
progress.md; release-v1.md. progress.md records after each stage: implemented work; tested
behavior; known gaps; active providers; provider coverage; blocked source issues; next
smallest shippable slice.

=====================================================================
13. DEFINITION OF DONE — V1
=====================================================================
1. User chooses a German place by search or map click.
2. User chooses a relevant time.
3. User inspects DWD-backed weather/warning context.
4. User inspects UBA station-based air context, where available.
5. User inspects optional CAMS regional context only if correctly integrated and visibly
   modelled (~10 km grid, Copernicus attribution).
6. User sees supplementary mapped place/POI context (OSM attribution).
7. User inspects transit information availability without false realtime/routing/
   reliability claims.
8. User pins and compares A/B/C places.
9. Every material claim has inspectable source, time, data mode, spatial meaning,
   limitations.
10. Data gaps are first-class UI states.
11. Demo data is visibly and technically separate from live data.
12. The application is accessible, tested, documented, locally runnable.
13. It makes NO claim outside the source evidence.
14. Every activated provider is CC/DL-DE/ODbL/Copernicus-attributed as required, and no
    provider is live without a "verified" manifest entry.

Final instruction: Build a coherent, beautiful, technically disciplined integration
product. Do not emulate omniscience. Do not fill gaps with plausible-looking output. A
visible limitation is a successful product outcome when it truthfully describes what can
and cannot be known for the chosen place and time.

## Verbindliche Leitentscheidung
Die Architektur kombiniert Quellen und Kontexte, nicht deren fachliche Berechnungen: DWD
für Wetter, UBA/Länder für Stationsmessungen, optional CAMS für regionales Modell, nur
verifizierte Transit-/POI-Quellen. Der DWD weist selbst darauf hin, dass für seine
Geodienste "kein Anspruch auf Verfügbarkeit dieser Dienste" besteht; deshalb gehören
Cache, sichtbare Ausfälle und Datenstatus zwingend in die Umsetzung.
