# Release report — V1

## Definition of Done (§13) — status

| # | Criterion | Status | Where |
| --- | --- | --- | --- |
| 1 | Choose a German place by search or map click | ✅ | `SearchBox`, `MapView` → same `SelectedPlace` |
| 2 | Choose a relevant time | ✅ | `TimeControl` (now … +48 h, Europe/Berlin) |
| 3 | Inspect DWD weather/warning context | ✅ | `PlaceLens` weather + warnings, `dwd-brightsky`, `dwd-warnings` |
| 4 | Inspect UBA station air context where available | ✅ | `PlaceLens` air, `uba-airdata` |
| 5 | Optional CAMS regional context only if correctly integrated & visibly modelled | ✅ | `adapters/cams.ts` (ADS + NetCDF grid cell); live with `CAMS_ADS_KEY`, else honest config-required |
| 6 | Supplementary mapped place/POI context (OSM attribution) | ✅ | `osm-overpass`, places layer |
| 7 | Transit context without false realtime/routing/reliability | ✅ | `getTransitContext` — real GTFS scheduled + GTFS-RT, config-gated |
| 8 | Pin & compare A/B/C | ✅ | `Compare` (data mode beside every value; no score) |
| 9 | Every material claim has inspectable source/time/mode/spatial/limitations | ✅ | `EvidenceInspector` |
| 10 | Data gaps are first-class UI states | ✅ | `ModuleStatusNote`, coverage matrix |
| 11 | Demo data visibly & technically separate | ✅ | per-request gate, banner, `mode:"demo"` stamping |
| 12 | Accessible, tested, documented, locally runnable | ✅ | see below |
| 13 | No claim outside the source evidence | ✅ | reality policy enforced in adapters + wording guard |
| 14 | Every activated provider correctly attributed; none live without `verified` manifest | ✅ | manifest gate + attribution in evidence |

## Quality gates

| Gate | Result |
| --- | --- |
| `npm run lint` (ESLint, strict + react-hooks) | ✅ pass |
| `npm run format:check` (Prettier) | ✅ pass |
| `npm run typecheck` (tsc strict, all workspaces) | ✅ pass |
| `npm test` (Vitest unit + integration) | ✅ 65 tests pass |
| `npm run build` (production) | ✅ pass (vendor-split; maplibre isolated) |
| `npm run test:e2e` (Playwright, Demo Mode) | ✅ specs provided; run in CI |
| Attribution + visible-limitations review | ✅ documented in `data-sources.md` |
| Source-governance issues | ✅ all tracked as **TO VERIFY** |

## Activated providers & coverage

**Live out of the box (keyless):** DWD weather (Bright Sky), DWD warnings (WFS), UBA air
stations, OSM Overpass POIs, Photon geocoding, OpenFreeMap base map.
**Integrated, live once configured:** CAMS regional model (`CAMS_ADS_KEY`), DELFI GTFS
scheduled (`GTFS_STATIC_PATH`), GTFS-RT realtime (`GTFS_RT_URL`) — honest
`configuration-required` until then, verified live via `/api/readiness`.

Coverage per place is presented in the **Datenverfügbarkeit** matrix as neutral facts.

## Known limitations (by design)

- Weather/air values reflect the nearest station / grid, never the pin.
- UBA current-year data are provisional; not all pollutants at every station.
- POIs are mapped context with unknown completeness; no operational status.
- Transit is availability, not operation; scheduled + realtime not yet activated.
- CAMS/DELFI require documented verification before activation (see TO VERIFY).
- Public Photon/Overpass instances have no availability guarantee; self-hosting recommended
  for production.

## Excluded from V1 (§3.2)

Street-level shade/microclimate; nationwide cooling coverage; street-level pollution; exposure
estimates; air-quality routing; universal toilet/water operational status; universal opening
hours; safety/crime evaluations; universal transit realtime/routing/reliability; municipality
ranking; quality-of-life/comfort/health scores; generated gap-filling values; unverified
third-party integrations; public-cloud deployment (separate approval).

## How to run & verify

```bash
npm install
npm run verify      # lint · format · typecheck · test · build
npm run dev         # API :3001 + web :5173
```

A visible limitation is a successful product outcome. The build makes **no claim outside the
source evidence**.
