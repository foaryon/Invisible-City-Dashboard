# Progress

Records, per stage: implemented work · tested behavior · known gaps · active providers ·
coverage · blocked source issues · next smallest shippable slice.

## Active providers

**Live out of the box (keyless):** `dwd-brightsky`, `dwd-warnings`, `uba-airdata`,
`osm-overpass`, `photon-geocoding`, `openfreemap-basemap`.
**Integrated, live once configured:** `cams-eu-airquality` (`CAMS_ADS_KEY`), `delfi-gtfs`
(`GTFS_STATIC_PATH`), `delfi-gtfs-rt` (`GTFS_RT_URL`). Until configured they return
`configuration-required` (honest, never demo). Status is config-resolved at runtime; see
`/api/readiness`.

## Blocked source issues

- ~~Live schema re-verification blocked by the build environment's egress policy~~ —
  **resolved 2026-07-18**: `npm run diagnose` (see Stage 8) runs the live sweep on any
  networked machine; the consolidated verification state lives in `data-sources.md`.

---

## Stage 0 — Foundation ✅
- **Implemented:** workspaces, strict TS, ESLint (+react-hooks) / Prettier, Vitest; contracts
  (Zod) + Evidence contracts; provider manifest with `verified` gate; app shell with dark
  accessible tokens; opt-in Demo Mode from fixtures.
- **Tested:** contracts validate; manifest entries validate and carry attribution + review
  date; demo permanently labelled; no live source call exists without a manifest entry (the
  runner throws for non-`verified` providers).
- **Gap/next:** none blocking.

## Stage 1 — Map, place, evidence shell ✅
- **Implemented:** MapLibre base map (OpenFreeMap); place search (Photon) + map-click
  selection producing the **same `SelectedPlace`**; Place Lens, Evidence Inspector, layer
  controls + legends, availability matrix; A/B/C pins + comparison; responsive desktop/mobile
  bottom sheets.
- **Tested:** search & map-click share the contract (unit + E2E); inspector renders from
  evidence; comparison always shows data mode; keyboard path for search + layer switch.
- **Gap/next:** none blocking.

## Stage 2 — DWD weather context ✅
- **Implemented:** Bright Sky adapter (labelled unofficial), per-hour observed/forecast
  separation, null-safe values; DWD warnings via WFS shown separately; source status +
  loading/error/partial/stale; weather layer + inspector content; DWD attribution preserved.
- **Tested:** observed/forecast/unavailable never conflated; malformed → source-error;
  outage → visible source-error (no invented values); empty warning list = "no warning", not
  error; embedded BKG geometry license preserved.
- **Gap/next:** live schema re-verification (TO VERIFY).

## Stage 3 — UBA station air quality ✅
- **Implemented:** UBA adapter; nearest-station discovery; pollutants, CET→Berlin
  normalization with `sourceTimeRaw` preserved; station type + distance; point-marker layer;
  provisional status; comparison only among comparable station values.
- **Tested:** no interpolation; distant selection labelled *regionale Referenz*; provisional
  completeness; partial when not all pollutants present; malformed directory → source-error.
- **Gap/next:** verify array indices / component IDs / API version (TO VERIFY).

## Stage 4 — CAMS regional context ✅ (integrated, config-gated)
- **Implemented:** real ADS process-API client + NetCDF nearest-grid-cell extraction
  (`adapters/cams.ts`, `cams/extract.ts`); `/api/air/model` route; CAMS layer + Place Lens
  module + coverage row; Copernicus attribution + provider caveat in Evidence. Grid cell (~10
  km) with cell-centre offset; never address-level, never fused with stations.
- **Tested:** `nearestGridValue`/`gridResolutionKm` unit tests (incl. 0..360 lon, NaN
  rejection); API returns `configuration-required` (demo=false, data=null) without a key;
  `isLiveAllowed('cams-eu-airquality', configured) === true` once keyed.
- **Gap/next:** verify ADS request/response + NetCDF variable names against a real key.

## Stage 5 — Place & POI context ✅
- **Implemented:** Overpass adapter (parks, stops, pharmacies, toilets, drinking water) with
  single-flight fair-use enforcement; distance + mapped labelling; layer + inspector; OSM
  attribution.
- **Tested:** categories mapped; everything `mode:"mapped"`; completeness `unknown`; 429
  surfaced explicitly; malformed → source-error. No opening/accessibility/availability claim.
- **Gap/next:** clustering is via marker thinning at query level; a dedicated cluster layer is
  a polish item.

## Stage 6 — Transit context ✅ (real integration, config-gated)
- **Implemented:** stop context from the OSM mapped layer AND the configured DELFI GTFS feed;
  **real calendar-aware scheduled departures** (`gtfs/import.ts` → SQLite, `gtfs/query.ts`);
  **real GTFS-RT** decode (`gtfs/realtime.ts`) summarizing delays/alerts for nearby stops;
  `gtfs:import` CLI; Place Lens shows stops + departures. Verified end-to-end with a real
  GTFS feed (import → scheduled 23:55 U8 served).
- **Tested:** GTFS import/query (nearest stop, calendar active/inactive days, time filtering,
  route-type labels); GTFS-RT protobuf round-trip + nearby-stop filtering; unconfigured →
  honest "nicht konfiguriert"; realtime absence never implies normal service; no routing/
  reliability.
- **Gap/next:** DELFI registration/license confirmation; validate against a real national feed
  (regional extract recommended); document RT operator coverage before `confirmed`.

## Stage 7 — Polish & hardening 🔄
- **Implemented:** cache behaviour, mobile sheets + keyboard, empty/error/stale states,
  attribution + docs + privacy + release report, vendor chunk splitting.
- **Gap/next:** optional CAMS + DELFI activation; self-hosted Photon; dedicated map cluster
  layer; independent review.

## Stage 8 — Live verification & endpoint fixes ✅ (2026-07-18)
- **Implemented:** `scripts/diagnose.mjs` (`npm run diagnose`, `--watch` for extended
  observation) — calls every real adapter with real fetch across 7 representative
  locations, records `{status, httpCode, parseOk, itemCount, ms}` per call, prints tables
  and writes `diagnostics-report.json`. Test plan: `docs/live-testplan.md`.
- **Fixed (live-confirmed through adapter AND API):**
  - UBA base host (`luftdaten.…` → 404; now `www.umweltbundesamt.de`), plus
    decommissioned-station filtering ([5]/[6] activity columns) and preference for
    stations that actually measure — Berlin/Hamburg/Köln now deliver values.
  - BKG VG250: deegree supports no `cql_filter` → WFS 2.0 bbox + local point-in-polygon;
    NINA now resolves the district (Trier `072110000000`, Berlin `110000000000`).
  - CDC normals: filename drift (404) → directory-index discovery.
  - Autobahn: live coordinates are numbers, not strings → schema accepted both ways
    (before: silently 0 events everywhere; now e.g. Köln 8, Trier 8).
  - Photon: city-states carry no `state` → derived (pollen for Berlin/Hamburg works).
  - Map-click reverse-geocode race: a stale response could snap the map back to an
    earlier point ("pointer jump") → guarded selection flow (`apps/web/src/selection.ts`),
    4 regression tests; demo-mode stale-closure in the click handler fixed alongside.
  - Startup prewarm of the national Autobahn snapshot (~3 s cold cost moved off the first
    user selection; caching strategy only).
- **Tested:** 146 provider tests + 28 web tests green; live: 133 diagnose calls, C-phase
  API battery (400s, demo gating, readiness, edge coords, cache).
- **Gap/next:** Overpass public instance throttles bursts (429) and can 504 on dense
  areas — honest source-error today; consider self-hosting for sustained use.

## Next smallest shippable slice

Self-host Photon and switch the endpoint (removes the public-demo availability caveat), **or**
begin Stage 6 DELFI GTFS static integration behind the `verified` gate — whichever the source
review clears first.
