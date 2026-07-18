# Central spatial-selection contract

The single authoritative rulebook for how a user-selected point becomes
per-provider "nearby data" — one deterministic system shared by every module
(weather, air, water, civil protection, transit, fuel, DB facilities, POIs).

## 1. The selection authority

- There is exactly ONE selected analysis target: `SelectedPlace` in the app
  store (`apps/web/src/state/store.ts`). Every module reads it; none owns a
  private copy.
- The selection changes ONLY through an explicit user action:
  1. choosing a search result (SearchBox — Enter confirms the highlighted or
     first result),
  2. a map click/tap (provisional "Punkt lat, lon", label upgraded by reverse
     geocoding),
  3. pinning/comparing (A/B/C) — which never moves the primary selection.
- **Stale-response guard** (`apps/web/src/selection.ts`): an asynchronous
  reverse-geocode result is applied only while the click that started it is
  still the current selection. A later selection always wins — zooming,
  panning, rerenders, retries and slow responses can never move the target
  (regression tests: `apps/web/test/selection.test.ts`, 4 cases incl. rapid
  double-click and search-during-pending-click).
- Zoom/pan/resize/layer switches/data refreshes read the selection; nothing in
  those paths writes it (`selectPlace` callers: SearchBox, selection.ts,
  Compare pin restore only).

## 2. Coordinate & time normalization (single implementations)

| Concern | Canonical implementation |
| --- | --- |
| Coordinate system | WGS84 `{latitude, longitude}` (`Coordinates` in `@invisible-city/contracts`, Zod-validated at every API boundary) |
| GeoJSON order | `[lon, lat]` converted ONCE per adapter at the parse boundary (Photon, ODL, BKG); BKG additionally normalizes ambiguous WFS axis order by German-bounds heuristic |
| Distance | ONE haversine: `distanceMeters` in `@invisible-city/evidence` (`geo.ts`) — no adapter has private distance math |
| Distance display | `formatDistanceGerman` (m < 1 km, otherwise km, German decimal comma) |
| Station role | `stationSpatialRole`: ≤ 5 000 m → `nearby`, otherwise `regional` (UI label „regionale Referenz") |
| Time display | Europe/Berlin via `formatBerlin`; every envelope carries ISO `retrievedAt`; UBA's CET/MEZ quirk normalized with `sourceTimeRaw` preserved |

## 3. Per-source applicability ("nearby" is domain-aware, never just "closest")

| Provider | Rule | Beyond the rule |
| --- | --- | --- |
| UBA air stations | nearest MEASURING stations (decommissioned/dormant directory entries skipped); ≤ 5 km labelled nah, else „regionale Referenz" | shown WITH distance + role — never as a local value |
| BfS ODL | nearest probes from the full national layer; same 5 km role labelling | same |
| PEGELONLINE | hard radius 30 km (federal waterways only) | „Kein Pegel … im Umkreis von 30 km" — coverage statement, no substitute |
| Autobahn | events ≤ 30 km, federal motorways only | absence ≠ statement about other roads |
| GEOFON | 200 km / 90 days catalogue window | empty list = normal, honest result |
| OSM POIs / Notfall | 1 200 m mapped context | completeness unknown, stated |
| Transit stops (OSM/GTFS) | stops within the POI radius; scheduled departures per imported feed | absence of realtime never implies normal service |
| DB FaSta | facilities ≤ 3 km | beyond: not shown as local |
| Tankerkönig | stations ≤ 5 km (API radius) | „Keine meldepflichtige Tankstelle im Umkreis von 5 km" |
| DWD CDC normals | nearest climate station, distance ALWAYS shown | statistical reference, never current state |
| DWD UV | fixed reference locations, distance ALWAYS shown | usually far → regional reference wording |
| CAMS | containing ~10 km grid cell, centre offset shown | never address-level |
| Radar | containing 1 km RADOLAN cell | cell value, not a point value |
| Pollen | Bundesland → forecast partregion(s) | all matching partregions shown, no polygon guessing |
| NINA | district (Kreis) via official BKG VG250 point-in-polygon | warnings are district-level, stated |

Boundary behaviour is tested (`packages/providers/test/`): inside/at/beyond
radius, rural (Eifel), island (Sylt), offshore, alpine and border points.

## 4. No-data and rejected-candidate behaviour

- Nothing qualifying → module status `unavailable` with a German statusDetail
  that names the radius/rule (see table above) — never a fabricated local
  report, never a silent nearest-anyway substitution.
- Rejected candidates are principled: UBA skips directory entries whose
  activity ended (and prefers stations that actually return measurements —
  each shown with its real distance); BKG only accepts the polygon that
  CONTAINS the point (nearest-feature fallback only when exactly one feature
  returned).
- One provider's failure/absence never blocks the others: every module fetches
  independently; the runner isolates errors per envelope (source-error /
  unavailable / configuration-required), and the UI renders each card from its
  own envelope.

## 5. Evidence propagation

Every material value carries (via `makeEvidence`): provider + institution,
source URL, license/attribution, data mode (observed / forecast / modelled /
mapped / scheduled / realtime), method, the four times (source, published,
retrieved, cache age), spatial relation (station+distance / grid cell /
area / reference location), completeness and limitations. Governance tests
enforce this for every adapter.
