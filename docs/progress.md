# Progress

Records, per stage: implemented work · tested behavior · known gaps · active providers ·
coverage · blocked source issues · next smallest shippable slice.

## Active providers (live)

`dwd-brightsky`, `dwd-warnings`, `uba-airdata`, `osm-overpass`, `photon-geocoding`,
`openfreemap-basemap` — status **verified**.
**Proposed (not live, shown as "nicht integriert"):** `cams-eu-airquality`, `delfi-gtfs`,
`delfi-gtfs-rt`.

## Blocked source issues

- Live schema re-verification for Bright Sky, DWD WFS and UBA is blocked by the build
  environment's egress policy → tracked as **TO VERIFY** in `data-sources.md`. Runtime Zod
  validation makes any mismatch fail visibly, not silently.

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

## Stage 4 — Optional CAMS regional context ⛔ (deferred by design)
- **Implemented:** manifest entry (`proposed`), layer registered as disabled ("nicht
  integriert"), coverage matrix row. **No live calls.**
- **Tested:** `isLiveAllowed('cams-eu-airquality') === false`; runner throws → the API maps to
  `configuration-required`.
- **Gap/next:** ADS registration, `cdsapi` retrieval, data format, product suitability, then
  grid/raster rendering (never address-level).

## Stage 5 — Place & POI context ✅
- **Implemented:** Overpass adapter (parks, stops, pharmacies, toilets, drinking water) with
  single-flight fair-use enforcement; distance + mapped labelling; layer + inspector; OSM
  attribution.
- **Tested:** categories mapped; everything `mode:"mapped"`; completeness `unknown`; 429
  surfaced explicitly; malformed → source-error. No opening/accessibility/availability claim.
- **Gap/next:** clustering is via marker thinning at query level; a dedicated cluster layer is
  a polish item.

## Stage 6 — Transit availability ✅ (availability only)
- **Implemented:** nearby-stop context from the OSM mapped layer; scheduled + realtime shown
  as **not integrated** with honest coverage detail; source + manifest evidence.
- **Tested:** scheduled/realtime never shown as `confirmed`; realtime detail states missing
  data ≠ normal service; no routing, no reliability.
- **Gap/next:** DELFI GTFS + GTFS-RT activation (TO VERIFY, blocking).

## Stage 7 — Polish & hardening 🔄
- **Implemented:** cache behaviour, mobile sheets + keyboard, empty/error/stale states,
  attribution + docs + privacy + release report, vendor chunk splitting.
- **Gap/next:** optional CAMS + DELFI activation; self-hosted Photon; dedicated map cluster
  layer; independent review.

## Next smallest shippable slice

Self-host Photon and switch the endpoint (removes the public-demo availability caveat), **or**
begin Stage 6 DELFI GTFS static integration behind the `verified` gate — whichever the source
review clears first.
