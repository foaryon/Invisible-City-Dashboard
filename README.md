# The Invisible City

**Reality-first spatial intelligence dashboard for Germany.**

> Ein Ort. Ein Zeitpunkt. Eine Karte. Belastbare Datenquellen – mit sichtbaren Grenzen.

The Invisible City is a local-first, map-first web application that combines **only
permitted, documented public data interfaces** into one coherent user experience. It is
an **integration, evidence and comparison layer** — never a replacement for the source
services, and never a generator of data those services do not provide.

It does **not** create, simulate, interpolate, scrape, invent, silently repair or claim
ownership of weather, air-quality, transit or municipal data. Every material value carries
its source, time, data mode, spatial meaning and limitations. **A visible limitation is a
successful product outcome.**

**Status:** V1.2 — 21 providers integrated, all fully automatic (keyless or
auto-activating from env credentials). Full quality gate green — **200 Vitest** tests
(unit · component · integration · governance · non-functional) and **12 Playwright** E2E
(including accessibility). Runs as a single deployable; every provider is real,
config-driven code.

---

## What it shows

| Layer | Source | Data mode | Activation |
| --- | --- | --- | --- |
| Weather & forecast | DWD (via Bright Sky, unofficial JSON access layer) | observed / forecast | live (keyless) |
| Official warnings | DWD GeoServer WFS (`Warnungen_Gemeinden`) | source-defined areas | live (keyless) |
| Air quality (stations) | Umweltbundesamt / Länder (Air Data API) | observed | live (keyless) |
| Air quality (regional model) | CAMS (Copernicus ADS, NetCDF) | modelled, ~10 km grid | live when `CAMS_ADS_KEY` set |
| Place & POI context | OpenStreetMap (Overpass) | mapped | live (keyless) |
| Emergency & health (AED, hospital, fire station, pharmacy) | OpenStreetMap (Overpass) | mapped | live (keyless) |
| Transit — stops | OSM (mapped) / DELFI GTFS | mapped / scheduled | stops live; departures when GTFS imported |
| Transit — scheduled | DELFI GTFS (imported to SQLite) | scheduled | live when `GTFS_STATIC_PATH` set |
| Transit — realtime | DELFI DEEZ / gtfs.de GTFS-RT | realtime (partial) | live when `GTFS_RT_URL` set |
| Geocoding | Photon (OSM data) | mapped | live (keyless) |
| Base map | OpenFreeMap (OSM data) | mapped | live (keyless) |
| Rain radar (point + overlay) | DWD RADOLAN (via Bright Sky; WMS overlay: DWD GeoServer) | observed / forecast (nowcast) | live (keyless) |
| Water levels | WSV PEGELONLINE (federal waterways) | observed | live (keyless) |
| Gamma dose rate (radiation) | BfS ODL network (~1,700 probes) | observed | live (keyless) |
| Pollen hazard index | DWD (per forecast partregion) | forecast | live (keyless) |
| UV index | DWD (reference locations) | forecast | live (keyless) |
| Civil-protection warnings | BBK NINA (district ARS via BKG VG250) | observed | live (keyless) |
| Official territorial assignment | BKG VG250 WFS (Gemeinde + ARS) | mapped | live (keyless) |
| Autobahn events | Autobahn GmbH (motorway network only) | observed | live (keyless) |
| Earthquakes | GFZ GEOFON (FDSN, 200 km / 90 days) | observed | live (keyless) |
| Climate normals 1991–2020 | DWD CDC (nearest climate station) | observed (statistical reference) | live (keyless) |
| Fuel prices | MTS-K via Tankerkönig | realtime (operator-notified) | live when `TANKERKOENIG_API_KEY` set |
| Station elevators/escalators | DB FaSta (DB API Marketplace) | realtime | live when `DB_CLIENT_ID`+`DB_API_KEY` set |

**Every adapter is real, config-driven code.** Keyless providers are live out of the box.
CAMS, DELFI, Tankerkönig and DB FaSta are fully implemented but need a credential/feed (a
Copernicus key, an opendata-oepnv registration or feed URL, a free Tankerkönig key, free
DB API Marketplace credentials) — until that is configured the UI reports
**"Konfiguration erforderlich"** with the exact env var needed. It is **never** faked,
never a placeholder, never demo. Query `/api/readiness` for per-provider live status.
Vetted-but-unverified candidates (e.g. BVL Lebensmittelwarnung) are registered in the
manifest as `proposed` with a hard-off gate — see `docs/data-sources.md`.

**On greenhouse gases:** deliberately NOT integrated. Aggregated national GHG inventories
have no honest spatial relation to a map pin (annual, coarse, 1–2 y lag), and the only
credible place-based source (facility-level Thru.de/PRTR declarations) offers no
documented automatic data interface — its exports require a manual CSV download, which
violates this product's rule that every live module must be fully automatic. The
evaluation and removal are recorded in [`docs/decisions.md`](docs/decisions.md).

---

## Features

- **Shared place & time model** — one location, one instant; "Jetzt" plus short-term
  forward selection; all times shown in Europe/Berlin with correct DST (and the UBA
  CET/MEZ quirk normalized, original source time preserved).
- **Six analytical map layers**, one primary at a time, each with a legend that states its
  source, spatial meaning, time applicability and limitations — plus an optional
  **rain-radar overlay** (DWD RADOLAN WMS, attributed on the map).
- **Place Lens** — compact per-location context with data-mode chips and honest status
  (available · partial · stale · unavailable · source-error · configuration-required · demo).
- **Evidence Inspector** — for every material value: provider & institution, source URL,
  license, attribution, data mode, method, the four distinct times, cache age, spatial
  relation, completeness and limitations.
- **Coverage matrix** — a neutral, non-judgmental availability grid per place.
- **A/B/C comparison** — pin up to three places; compare only comparable, simultaneously
  meaningful values, with the data mode beside each. No overall score, no "best place".
- **Opt-in Demo Mode** — permanently labelled, exercises every feature offline; demo and
  live data never mix, and provider failure never silently falls back to demo.
- **Accessible & private** — keyboard paths, WCAG-AA contrast, `prefers-reduced-motion`;
  no accounts, no tracking, no location history, no secrets in the frontend.

---

## Architecture

npm workspaces monorepo:

```
apps/
  web/         React + Vite + MapLibre GL JS (UI only — no provider parsing)
  api/         Fastify — provider orchestration, caching, demo/live gating, serves the SPA
packages/
  contracts/   Zod schemas + TypeScript types (every external boundary)
  evidence/    Evidence construction, time/DST, geo/distance, comparability, wording policy
  providers/   Source adapters, provider manifest, config-gated activation, HTTP policy,
               source-aware cache, GTFS import/query, GTFS-RT decode, CAMS/NetCDF
  map-style/   Base map, analytical layer registry, legends, design tokens
  test-fixtures/  Provider-shaped fixtures (also power opt-in Demo Mode)
docs/          Charter, architecture, data sources, evidence & map policy, privacy, …
```

The data flow for every adapter:

```
source → permitted fetch → runtime Zod validation → provider-specific normalization
       → Evidence attachment → source-aware cache (TTL) → normalized ModuleEnvelope → UI
```

Provider status is resolved at runtime against configuration: keyless providers are always
live; credentialed providers (CAMS, DELFI) become live only when their config is present,
and otherwise return an honest `configuration-required` envelope — never invented data.

---

## Prerequisites

- **Node.js 22 LTS or newer** (Node 24 "Krypton" LTS recommended — see
  [`docs/decisions.md`](docs/decisions.md) for the version note). `package.json` pins
  `engines.node >= 22.11.0`.
- npm 10+.

No API keys are required for the keyless providers (DWD, UBA, OSM/Overpass, Photon,
OpenFreeMap) — they are live out of the box. CAMS and DELFI are fully integrated and
activate when you supply their credential/feed (see below).

---

## Setup & run

```bash
npm install

# Run API (:3001) and web (:5173) together:
npm run dev

# …or separately:
npm run dev:api
npm run dev:web
```

Open <http://localhost:5173>. The web dev server proxies `/api/*` to the API.

Try it:

1. Search a German place (e.g. *Augsburg*) or click the map to set an analysis point.
2. Switch analytical layers (top-left) — each has a legend, source and spatial meaning.
3. Open **Belege** on any value to inspect full evidence.
4. Pin up to three places (A/B/C) and compare — data mode is shown beside every value.
5. Toggle **Demo-Modus** to explore the full UI with fixtures (permanently banner-labelled).

> Without outbound network access, live providers return honest **source-error /
> unavailable** states (never invented values), and the base-map tiles won't load. Enable
> `ENABLE_DEMO=1` and use **Demo-Modus** to exercise every feature offline.

### Run it as an app (Windows / Android)

Double-click **`run.bat`** (Windows), **`run.command`** (macOS) or **`run.sh`** (Linux): it
installs/builds on first run, starts the server, opens the browser, and prints a LAN address
so a phone on the same Wi‑Fi can open it too. It's also **installable as a PWA** (Chrome/Edge
"Install app" on desktop, "Add to Home screen" on Android). Full walkthrough for Windows 11
and Android 16: [`docs/desktop.md`](docs/desktop.md).

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API + web in parallel |
| `npm run build` | Production build (all workspaces) |
| `npm run lint` | ESLint (strict, incl. react-hooks) |
| `npm run format:check` / `npm run format` | Prettier check / write |
| `npm run typecheck` | `tsc --noEmit` in every workspace (strict mode) |
| `npm test` | Vitest — all projects |
| `npm run test:node` / `npm run test:web` | Vitest — node or web (jsdom) project only |
| `npm run test:coverage` | Vitest with V8 coverage |
| `npm run test:e2e` | Playwright end-to-end + accessibility |
| `npm run verify` | lint → format:check → typecheck → test → build |

---

## Testing

Two Vitest projects — **node** (packages + API) and **web** (jsdom + Testing Library) —
plus Playwright for browser E2E and accessibility:

- **Unit** — evidence, time/DST, geo, comparability, wording policy, config/activation,
  HTTP policy (retries, 429, timeout, Overpass single-flight), cache (memory + SQLite),
  manifest resolution, map-style registry.
- **Component** — Place Lens, Evidence Inspector, Coverage matrix, Time control, Layer
  switch/Legend, Search box, Compare (rendered with a mocked API and the real store).
- **Integration** — every adapter against fixtures/failures; all API endpoints; a real
  GTFS import → scheduled-departures round-trip.
- **Governance (Masterprompt compliance)** — scans all product source for disallowed
  wording; provider attribution/license/review completeness; data-mode & spatial
  discriminators; the observed≠modelled reality rule; demo stamping across every adapter.
- **Non-functional** — performance budgets; security (no server-only header, `process.env`,
  secrets or the providers package in the frontend; no `eval`; no `PRIVATE-TOKEN` in the
  bundle).
- **E2E + accessibility** — Playwright flows in Demo Mode, including an axe scan (no
  critical/serious WCAG 2 A/AA violations).

See [`docs/testing.md`](docs/testing.md).

---

## Production deployment

The API serves both `/api/*` and the built SPA — one process, one image. Live is the
default; demo is off unless `ENABLE_DEMO=1`.

```bash
npm ci
npm run build --workspace apps/web        # build the SPA
npm run start --workspace apps/api        # API serves API + SPA on :3001

# …or with Docker:
docker build -t invisible-city .
docker run -p 3001:3001 --env-file .env invisible-city
```

Copy `.env.example` → `.env` and set only what you want to activate. See
[`docs/data-sources.md`](docs/data-sources.md) for the CAMS/DELFI registration steps.

### Importing a DELFI GTFS feed (activates scheduled departures)

```bash
npm run gtfs:import --workspace apps/api -- <path-or-url-to-gtfs.zip>
# then set GTFS_STATIC_PATH so the transit provider goes live
```

## Environment variables

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` / `HOST` | `3001` / `127.0.0.1` | API listen address (`HOST=0.0.0.0` in Docker) |
| `CACHE_DB` | `var/cache.sqlite` | SQLite response cache |
| `WEB_ROOT` | `apps/web/dist` | built SPA to serve (auto-detected) |
| `ENABLE_DEMO` | `0` | dev-only demo toggle; never enable in production |
| `BRIGHTSKY_URL` / `DWD_WFS_URL` / `UBA_BASE_URL` / `OVERPASS_URL` / `PHOTON_URL` | public services | override for self-hosting |
| `CAMS_ADS_URL` / `CAMS_ADS_KEY` | ADS / — | activate CAMS regional model |
| `GTFS_STATIC_PATH` / `GTFS_STATIC_URL` / `GTFS_DB` | — / — / `var/gtfs.sqlite` | activate scheduled transit |
| `GTFS_RT_URL` / `GTFS_RT_KEY` | — | activate GTFS-realtime |

**No secrets live in the frontend.** All keys stay server-side; the browser only ever talks
to this API (plus the base-map tile host).

---

## Reality policy (non-negotiable)

- Combine context side by side; **never** fuse incomparable inputs into scores, rankings
  or pseudo-precise local claims.
- A station observation is not the air quality of every nearby street; a CAMS grid cell is
  not an address; a MOSMIX forecast is not a measurement at the pin; a planned departure is
  not a real-time departure; **missing service alerts do not mean normal operation**.
- Prefer *"Keine verifizierten Daten verfügbar"* over a weak proxy.
- Demo and live data never coexist in one panel, conclusion or comparison; provider failure
  never triggers a silent demo fallback.

See [`docs/evidence-policy.md`](docs/evidence-policy.md), [`docs/map-semantics.md`](docs/map-semantics.md)
and [`docs/data-sources.md`](docs/data-sources.md).

---

## Attribution

The application preserves each activated source's required attribution in the Evidence
Inspector and on the map:

- **Quelle: Deutscher Wetterdienst** (DWD, CC BY 4.0)
- **Umweltbundesamt** (UBA, dl-de/by-2-0)
- **© OpenStreetMap contributors** (ODbL) — Overpass, Photon
- **OpenFreeMap © OpenMapTiles Data from OpenStreetMap**
- **Datenquelle: DELFI e.V.** (transit) · **Generated using Copernicus Atmosphere
  Monitoring Service information** (CAMS) — shown when activated.

## Documentation

`docs/` — product charter, architecture, data sources (provider manifest + open
verification items), evidence policy, map semantics, privacy, testing, decisions, progress
and the V1 release report.

## License

MIT (application code). Source data remains under each provider's license — see
[`docs/data-sources.md`](docs/data-sources.md).
