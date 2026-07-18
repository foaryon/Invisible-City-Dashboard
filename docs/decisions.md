# Decision log

Records notable decisions and **pinned dependency versions**. Newest first.

## 2026-07-18 — Tier-1/Tier-2 expansion (all fully automatic)

- **Decision:** seven new providers, every one either keyless-live or auto-activating from
  env credentials — consistent with the "no manual downloads" rule: NINA civil-protection
  warnings (BBK, per district-ARS), BKG VG250 official territorial assignment (supplies
  the ARS; dual evidence on the NINA module), Autobahn GmbH events (per-motorway API
  aggregated into one nationally shared cached snapshot, distance-filtered), GFZ GEOFON
  earthquakes (FDSN `format=text`; empty = honest normal outcome), DWD CDC climate normals
  1991–2020 (statistical reference next to live weather — combine, never fuse), and two
  key-gated modules mirroring the CAMS pattern: Tankerkönig/MTS-K fuel prices
  (TANKERKOENIG_API_KEY) and DB FaSta elevator status (DB_CLIENT_ID + DB_API_KEY).
- **Candidates register:** BVL Lebensmittelwarnung is manifest-`proposed` with a hard-off
  activation gate until its documented interface's auth semantics are verified live;
  DB Timetables/RIS and SMARD (national context only) are documented as vetted candidates.
- **New plumbing:** `fetchTextWithCache` (documented plain-text interfaces: FDSN text, CDC
  tables, latin1 support) alongside the JSON runner.

## 2026-07-17 — Thru.de/PRTR removed: no manual-download dependencies

- **Decision:** every live module must be fully automatic — a provider whose only data
  path requires a manual download has no place in the dashboard. Thru.de/PRTR (the
  facility-level reported-releases module, incl. greenhouse gases) was fully implemented
  in V1.1 but depends on a manually generated CSV export: Thru.de publishes no documented
  stable bulk endpoint or query API, and scraping its interactive export UI is forbidden
  by the reality policy. The provider, its `reported` data mode, API route, UI module and
  tests were therefore removed (retrievable from git history via PRs #4–#5 should Thru.de
  ever publish a documented automatic interface).
- **Consequence for greenhouse gases:** none are shown. Aggregated national/Länder GHG
  inventories stay out for spatial-honesty reasons (annual, coarse, 1–2 y lag — no honest
  relation to a map pin), and the only credible place-based source fails the automation
  rule. Honest absence beats a module that silently starves without manual care.

## 2026-07-17 — V1.1 provider expansion (water, radiation, pollen, UV, radar, PRTR)

- **Decision:** six new providers, all following the existing adapter → Evidence → envelope
  pattern: PEGELONLINE water levels (WSV), BfS ODL gamma dose rate, DWD pollen hazard index,
  DWD UV index, DWD precipitation radar (point series via Bright Sky + WMS map overlay), and
  Thru.de/PRTR reported industrial releases (config-gated on `PRTR_CSV_PATH`, imported to
  SQLite like GTFS).
- **Greenhouse gases:** deliberately integrated ONLY as PRTR facility-level annual
  declarations (new data mode `reported`). Aggregated national/Länder GHG inventories have
  no honest spatial relation to a selected point (annual, 1–2 y lag, coarse aggregation) and
  are NOT integrated — showing them on a place lens would be pseudo-precision.
- **Pollen assignment** is via Bundesland text match; multiple matching partregions are all
  shown (limitation stated) instead of guessing polygons. **UV** locations come from a
  documented product-side coordinate table because the source publishes names only;
  unmatched locations are skipped. **ODL** fetches the full ~1,700-probe layer once (cached
  15 min, shared by all places) instead of bbox queries — avoids WFS axis-order pitfalls.
  **Radar** frames after retrieval time are mode-discriminated `forecast` (nowcast).

## 2026-07-17 — node:sqlite replaces better-sqlite3 (zero native deps)

- **Decision:** SQLite now runs on Node's built-in `node:sqlite` behind a tiny shim
  (`packages/providers/src/sqlite.ts` — exec/prepare/transaction/close). The cache schema is
  unchanged, so existing `var/*.sqlite` files keep working. Consequences: no native module
  anywhere → faster `npm ci`, no build toolchain in Docker, and single-file standalone
  executables become possible. On Node 22.13+ the module prints an ExperimentalWarning
  (harmless); Node 24+ is the recommended runtime where it is stable-track.

## 2026-07-17 — esbuild server bundle + lean image + standalone pipeline

- **Decision:** `npm run build:server` bundles the entire API into one ESM file
  (`apps/api/dist/server.mjs`, ~3.3 MB, builds in <1 s) — verified to serve the SPA and API,
  honor demo gating, compression, cache headers and graceful shutdown. The Docker runtime
  stage now ships ONLY this bundle + the built SPA on `node:22-slim` (no node_modules, no
  toolchain). `npm run build:standalone -- win|linux|mac` additionally packages a real
  executable via @yao-pkg/pkg; pkg's base-binary download needs normal internet, so the
  command runs on the target machine, not in the egress-blocked build sandbox (verified:
  sandbox gets 403 from GitHub).

## 2026-07-17 — Private-usage performance

- **Decision:** brotli/gzip compression + `immutable` caching for hashed assets
  (`no-cache` for the shell so updates land); UBA pollutants of a station fetched in
  parallel (bounded at 6 concurrent; stations sequential) and the station directory cached
  24 h via a per-request TTL override — cold-start air data drops from ~18 sequential
  round-trips to ~1 per station. Renovate config added so dependency/security updates arrive
  as CI-gated PRs.

## 2026-07-17 — Config-driven provider activation (production posture)

- **Decision:** provider status is resolved at runtime against configuration
  (`config.ts` + `getEffectiveProvider`). Keyless providers (DWD/UBA/OSM/Photon/OpenFreeMap)
  are always `verified`/live; credentialed providers (CAMS, DELFI GTFS, GTFS-RT) are base
  `proposed` and upgrade to `verified` only when their env config is present. Without it the
  API returns `configuration-required` naming the exact env var — never demo, never invented.
  Rationale: "production-ready" must mean real code that is honest about what a given
  deployment has credentials for. `/api/readiness` exposes the live/needs-config map.

## 2026-07-17 — Real CAMS / DELFI / GTFS-RT integrations

- **CAMS:** real ADS process-API client + NetCDF point extraction (`netcdfjs`). The
  nearest-grid-cell selection is a pure, unit-tested function; the retrieval flow follows the
  documented API and is endpoint-configurable. Gated on `CAMS_ADS_KEY`.
- **DELFI GTFS static:** real importer (`adm-zip` + `csv-parse` → `better-sqlite3`) with a
  calendar-aware departures query. `adm-zip` loads the zip in memory — fine for regional
  extracts; the full nationwide feed should use a filtered/regional extract (documented).
- **GTFS-RT:** real protobuf decode via the official `gtfs-realtime-bindings`; summarizes
  trip-update delays/alerts for nearby stops only, coverage reported `partial`.
- **Rationale:** these were the only stubbed providers; implementing them for real (config-
  gated) removes the last placeholders while staying within the reality policy (credentialed
  sources cannot serve data without the operator's credentials).

## 2026-07-17 — Single-deployable + demo gated off by default

- **Decision:** the Fastify API serves the built SPA (`@fastify/static`, SPA fallback) so the
  product ships as one process/image (`Dockerfile`). Demo mode is off unless `ENABLE_DEMO=1`
  and is rejected server-side otherwise; the web hides the demo toggle when the server
  reports it disabled. Live is the default everywhere.

## 2026-07-16 — Node version

- **Charter target:** Node 24 LTS ("Krypton"). **Build environment:** Node 22.22.2.
- **Decision:** target Node ≥ 22.11.0 (`engines.node`), develop/verify on the available
  Node 22 LTS. The stack uses no Node-24-only API, so the app runs on 22 and 24 alike; a
  deployment on Node 24 LTS is recommended per the charter. Documented here rather than
  blocking on an unavailable runtime.

## 2026-07-16 — SQLite driver

- **Decision:** `better-sqlite3` for the cache (charter default). Rationale: stable
  synchronous API, works on Node 22; `node:sqlite` is still stabilising (RC on Node 24) and
  its feature set (no `db.transaction()` wrapper) differs. The cache is isolated behind
  `ResponseCache`, so a later swap to `node:sqlite` is a one-file change.

## 2026-07-16 — MapLibre GL JS v5

- **Decision:** MapLibre GL JS **v5** (current stable line; charter notes 5.24.0 as the final
  v5 series). v6 is in pre-release/transition and **not** adopted for V1. Pinned via
  `^5.6.0`.

## 2026-07-16 — Base map: OpenFreeMap

- **Decision:** OpenFreeMap "liberty" as the single primary base map (no key, no
  registration, advertising-free, self-hostable). basemap.de Web Vektor (BKG, CC BY 4.0) is
  the documented alternative and a drop-in style-URL swap in `map-style`.

## 2026-07-16 — Geocoding: Photon, not public Nominatim

- **Decision:** server-side **Photon** (debounced, cached, Germany-filtered). Rationale: the
  OSMF Nominatim Usage Policy forbids no-code/low-code/vibe-coding platforms from building the
  public Nominatim API in as a generic geocoder, forbids client-side autocomplete and bulk
  queries. Photon is search-as-you-type capable and self-hostable for production (tracked as
  TO VERIFY).

## 2026-07-16 — Weather via Bright Sky (labelled unofficial)

- **Decision:** use Bright Sky as the DWD JSON access layer, labelled in every Evidence record
  as an **unofficial access layer over DWD data**, with the direct `opendata.dwd.de` MOSMIX
  path documented as fallback. Attribution remains `Quelle: Deutscher Wetterdienst`.

## 2026-07-16 — CAMS, DELFI deferred (manifest `proposed`)

- **Decision:** ship the manifest entries but keep CAMS + DELFI GTFS/GTFS-RT **not live**
  (`proposed`), surfaced in the UI as "nicht integriert". Activating them requires the
  verification tasks in [`data-sources.md`](data-sources.md). The `verified` gate in the
  runner makes accidental live use impossible (throws → `configuration-required`).

## 2026-07-16 — Egress blocked at build time

- **Fact:** the build environment's network policy returned CONNECT 403 for
  `api.brightsky.dev` and `maps.dwd.de`. **Consequence:** live schema re-verification is a
  tracked TO VERIFY task; runtime Zod validation guarantees an unverified schema detail fails
  visibly (source-error) rather than producing invented data. Tests use injected
  fixtures/failures and the E2E suite uses Demo Mode.

## Pinned dependency versions (ranges in `package.json`)

| Dependency | Range | Notes |
| --- | --- | --- |
| typescript | ^5.8.0 | strict mode, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` |
| zod | ^3.25.0 | contracts + runtime validation |
| fastify | ^5.4.0 | API |
| @fastify/cors | ^11.0.0 | dev CORS |
| better-sqlite3 | ^12.2.0 | cache |
| react / react-dom | ^19.1.0 | UI |
| maplibre-gl | ^5.6.0 | map (v5 line) |
| @tanstack/react-query | ^5.81.0 | server state |
| zustand | ^5.0.0 | UI state |
| vite | ^7.0.0 | bundler |
| vitest | ^3.2.0 | unit/integration |
| @playwright/test | ^1.53.0 | E2E |
| eslint | ^9.30.0 | flat config + typescript-eslint + react-hooks |
| prettier | ^3.6.0 | formatting |
| @fastify/static | ^8.1.0 | serve the built SPA from the API |
| adm-zip | ^0.5.16 | read/build GTFS zips |
| csv-parse | ^5.6.0 | parse GTFS CSV tables |
| gtfs-realtime-bindings | ^1.1.1 | decode GTFS-RT protobuf |
| netcdfjs | ^3.0.0 | read CAMS NetCDF grids |

Exact resolved versions are captured in `package-lock.json`.
