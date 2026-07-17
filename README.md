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

---

## What it shows

| Layer | Source | Data mode | Spatial meaning |
| --- | --- | --- | --- |
| Weather & forecast | DWD (via Bright Sky, unofficial JSON access layer) | observed / forecast | nearest station / MOSMIX point — not the pin |
| Official warnings | DWD GeoServer WFS (`Warnungen_Gemeinden`) | source-defined areas | municipality polygons |
| Air quality (stations) | Umweltbundesamt / Länder (Air Data API) | observed | point markers, **no interpolation** |
| Air quality (regional model) | CAMS (Copernicus) — **not activated in V1** | modelled | ~10 km grid |
| Place & POI context | OpenStreetMap (Overpass) | mapped | mapped geometry, not operational status |
| Transit context | OSM stops (mapped); DELFI GTFS / GTFS-RT — **not activated in V1** | mapped / scheduled / realtime | availability, **not operation** |
| Geocoding | Photon (OSM data) | mapped | search + reverse |
| Base map | OpenFreeMap (OSM data) | mapped | cartographic context |

Providers marked *not activated* are present in the manifest with status `proposed` and
are surfaced honestly in the UI as **"nicht integriert"** — never faked.

---

## Architecture

npm workspaces monorepo:

```
apps/
  web/         React + Vite + MapLibre GL JS (UI only — no provider parsing)
  api/         Fastify — provider orchestration, caching, demo/live gating
packages/
  contracts/   Zod schemas + TypeScript types (every external boundary)
  evidence/    Evidence construction, time/DST, geo/distance, comparability, wording policy
  providers/   Source adapters, provider manifest, HTTP policy, source-aware cache
  map-style/   Base map, analytical layer registry, legends, design tokens
  test-fixtures/  Provider-shaped fixtures (also power opt-in Demo Mode)
docs/          Charter, architecture, data sources, evidence & map policy, privacy, …
```

The data flow for every adapter (§7.3):

```
source → permitted fetch → runtime Zod validation → provider-specific normalization
       → Evidence attachment → source-aware cache (TTL) → normalized ModuleEnvelope → UI
```

No provider is served live unless it has a **`verified`** entry in the provider manifest.

---

## Prerequisites

- **Node.js 22 LTS or newer** (Node 24 "Krypton" LTS recommended — see
  [`docs/decisions.md`](docs/decisions.md) for the version note). The build environment
  used Node 22; `package.json` pins `engines.node >= 22.11.0`.
- npm 10+.

No API keys are required for any V1-activated provider. CAMS (Stage 4) would require a
Copernicus ADS registration + API key and is intentionally left inactive.

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
5. Toggle **Demo-Modus** to see the app with fixtures (permanently banner-labelled).

> Without outbound network access, live providers return honest **source-error /
> unavailable** states (never invented values). Use **Demo-Modus** to exercise the full UI
> offline.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API + web in parallel |
| `npm run build` | Production build (all workspaces) |
| `npm run lint` | ESLint (strict, incl. react-hooks) |
| `npm run format:check` / `npm run format` | Prettier check / write |
| `npm run typecheck` | `tsc --noEmit` in every workspace (strict mode) |
| `npm test` | Vitest unit + integration tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run verify` | lint → format:check → typecheck → test → build |

---

## Environment variables

| Var | Default | Used by |
| --- | --- | --- |
| `PORT` | `3001` | API listen port |
| `CACHE_DB` | `var/cache.sqlite` | SQLite cache location |

**No secrets live in the frontend.** V1 activates no key-gated provider. If CAMS is
activated later, its key stays server-side only.

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
- DELFI e.V. / Copernicus attribution documented for future activation.

## License

MIT (application code). Source data remains under each provider's license — see
[`docs/data-sources.md`](docs/data-sources.md).
