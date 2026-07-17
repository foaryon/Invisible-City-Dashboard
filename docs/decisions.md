# Decision log

Records notable decisions and **pinned dependency versions**. Newest first.

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
