# Architecture

## Overview

npm workspaces monorepo, strict TypeScript everywhere, React + Vite frontend, Fastify
backend. The frontend renders; the backend integrates. **No provider parsing logic lives in
React components** (§7.3).

```
┌─────────────────────────────────────────────────────────────────┐
│ apps/web  (React + MapLibre GL JS)                                │
│  Place Lens · Map + layers/legends · Evidence Inspector ·         │
│  Coverage matrix · A/B/C compare · Time control · Demo toggle     │
│         │  fetch /api/*  (typed client, consumes ModuleEnvelope)  │
└─────────┼─────────────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ apps/api  (Fastify)                                               │
│  Route validation (Zod) · demo/live gate (per request) ·         │
│  provider orchestration                                          │
│         │                                                        │
│         ▼                                                        │
│ packages/providers                                               │
│   manifest (verified gate) → runner (cache + policed fetch)      │
│   → adapter (runtime Zod validation + normalization)             │
│   → Evidence attachment → ModuleEnvelope                         │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
   packages/contracts    packages/evidence    packages/map-style
   (Zod + types)         (time/geo/compare/   (layers, legends,
                          wording/evidence)    tokens)
```

## Packages

| Package | Responsibility | Key exports |
| --- | --- | --- |
| `@invisible-city/contracts` | Strict Zod schemas + types at every boundary | `Evidence`, `EvidenceValue`, `ModuleEnvelope`, `SelectedPlace`, `DataMode`, `SpatialContext`, `TransitCoverage`, `ProviderManifestEntry`, domain payloads |
| `@invisible-city/evidence` | Pure logic: `makeEvidence`, time/DST (`ubaCetToIso`, `formatBerlin`, `berlinUtcOffsetMinutes`), geo (`distanceMeters`, `stationSpatialRole`), `assessComparability`, wording policy | — |
| `@invisible-city/providers` | Provider manifest, HTTP policy layer, source-aware cache, adapter runner, adapters, demo | `getWeatherContext`, `getWarningContext`, `getAirStationContext`, `getPoiContext`, `searchPlaces`, `reverseGeocode`, `getTransitAvailability`, `demoAdapters` |
| `@invisible-city/map-style` | Base map choice, analytical layer registry with legends, design tokens | `analyticalLayers`, `BASE_MAP_STYLE_URL`, `tokens` |
| `@invisible-city/test-fixtures` | Provider-shaped fixtures for tests **and** opt-in Demo Mode | raw fixtures, `DEMO_PLACE` |

## The adapter contract (§7.3)

Each adapter:

1. Reads its provider entry from the manifest (identity, license, attribution, cache policy,
   `verified` status).
2. Builds a request fingerprint and calls the **runner**, which checks the cache, and on a
   miss performs a **policed fetch** (timeout, identifying User-Agent, host rate-limits,
   Overpass single-flight serialization, bounded transient retries).
3. Validates the raw response with **Zod at runtime**. Malformed/semantically invalid data
   is **rejected** (source-error), never coerced.
4. Normalizes into provider-agnostic, **mode-discriminated** payloads.
5. Attaches **Evidence** built from the manifest (provider identity, license and attribution
   cannot be dropped or invented by the adapter).
6. Returns a `ModuleEnvelope<T>` carrying `status`, `demo`, `data`, `evidence[]`,
   `limitations[]`, `statusDetail`, `retrievedAt`.

## Demo vs. live (§3.1.J)

Demo is decided **per request** (`?demo=1`). Demo responses run the **real adapters** over
fixtures (identical normalization/validation), then are stamped end-to-end: `status:"demo"`,
`demo:true`, every evidence `mode:"demo"`, and the permanent banner limitation. The two never
mix in one response, and provider failure **never** produces a demo fallback.

## State & data fetching (web)

- **Zustand** for local UI state (selected place, pins, active layer, time offset, demo mode,
  inspector target, mobile sheet).
- **TanStack Query** for server state (caching, dedup, cancellation, retry policy).
- **MapLibre GL JS v5** for the map; markers reflect the active analytical layer only.

## Runtime boundaries & validation

Every external boundary is Zod-validated:

- **Inbound HTTP** (API route query params) → 400 on invalid input.
- **Outbound provider responses** → rejected to source-error on schema mismatch.
- **API → UI** → the UI parses `ModuleEnvelope` in tests; runtime types are guaranteed by
  the shared contracts package.

## Caching (§7.4)

Source-aware SQLite cache (`better-sqlite3`) keyed by `providerId + requestFingerprint`,
storing retrieval time, schema version, response hash and payload. TTL comes from the
provider manifest. Cache age is always surfaced; a stale entry is served **only** when the
source fails, and only **visibly labelled** (`status:"stale"`). Request fingerprints are
query parameters — **no user-location history** is persisted as an analytics feature.
