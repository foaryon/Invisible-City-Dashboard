# Testing

No feature is complete without tests (§11). Quality gates must pass before V1 is declared
done.

## Frameworks

- **Vitest** — two projects: `node` (packages + API) and `web` (jsdom + Testing Library
  for React components). `npm test` runs both; `npm run test:web` / `test:node` scope one;
  `npm run test:coverage` reports V8 coverage.
- **Testing Library** (`@testing-library/react` + `jest-dom`) — component tests.
- **Playwright** — end-to-end and accessibility (`@axe-core/playwright`).
- **ESLint + Prettier + tsc** — code-quality and formatting gates.

## Layers

### Unit (`packages/*/test/*.test.ts`)
- **Config & activation** — `loadConfig` defaults/overrides, `isConfigured`, `REQUIRED_ENV`,
  `getEffectiveProvider` status resolution.
- **HTTP policy** — `policedFetch`: User-Agent, 429 → rate-limited (no retry), 5xx → http,
  network error mapping, Overpass single-flight serialization.
- **Cache** — memory + SQLite round-trip, staleness vs TTL, overwrite, fingerprint stability.
- **Map style** — layer registry completeness, legends, base-map attribution, tokens.
- **Evidence construction & propagation** — identity/license/attribution from manifest;
  limitations merged, never dropped; raw source time preserved.
- **Data-mode rendering** — German labels for every mode; wording-policy guard.
- **Timezone & DST** — `ubaCetToIso` (UBA CET/MEZ, no DST; hour-24 convention), Europe/Berlin
  offset at DST boundaries, summer UBA reading renders at correct wall-clock time.
- **Provider status rules** — manifest `verified` gate; CAMS/DELFI are `proposed`.
- **Cache freshness/staleness** — `isStale` boundaries; stale served only labelled.
- **Station-distance logic** — haversine sanity; nearby vs. regional (>5 km) role.
- **Comparability rules** — observed↔observed only; pollutant/time mismatches rejected.
- **Wording-policy helpers** — forbidden claims flagged; allowed phrasing passes; "live"
  never used for cached/scheduled.

### Integration (fixtures, `packages/providers/test`, `apps/api/test`)
Adapters are exercised against fixture responses and failure injection:
valid · missing value · partial · provisional · stale cache · malformed schema · timeout ·
**rate limit (429 from Overpass)** · source outage · incompatible comparison · demo source.
Each asserts the honest outcome (source-error/partial/unavailable with `null` data and a
German `statusDetail`) — **never invented values**.

The API test suite verifies: health + manifest; 400 on invalid coordinates; demo mode over
every endpoint (stamped `demo`, banner limitation, evidence `mode:"demo"`); and that live
mode without network yields a visible `source-error`/`unavailable`/`stale` envelope with
`demo:false` and `data:null` — **no demo fallback**.

### Component (`apps/web/test/*.test.tsx`, Testing Library)
Render React components in jsdom with a mocked API and the real Zustand store:
primitives (data-mode chips, status pills, inspect button → store), Evidence Inspector
(all fields, grid vs station spatial, raw source time), Coverage matrix (live vs
config-required vs station distance), Time control, Layer switch + Legend, Search box
(debounce, keyboard nav, Germany filter, error state), Compare (pinning, data-mode chip,
no ranking).

### Governance / Masterprompt compliance (`packages/providers/test/governance.test.ts`)
Scans **all** product source for disallowed wording (§9); asserts every provider carries
institution/license/attribution/review date/source URL; verifies the data-mode and spatial
discriminators (§6); the observed≠modelled reality rule (§2); and demo stamping end-to-end
across every demo adapter (§3.1.J).

### Non-functional (`packages/providers/test/nonfunctional.test.ts`)
- **Performance** — 100k great-circle distances < 1 s; grid extraction over 300×300 < 500 ms.
- **Security** — the frontend never references the server-only ADS header, `process.env`,
  server config secrets, or the providers package; no `eval`/`new Function`; the built bundle
  carries no `PRIVATE-TOKEN`.

### Accessibility (`e2e/a11y.spec.ts`, Playwright + axe)
No critical/serious WCAG 2 A/AA violations in the app chrome (demo mode); skip-link focus
order; labelled search combobox and map application region. Colour contrast is enforced
(the dark theme meets AA).

### End-to-end (`e2e/`, Playwright)
Runs against **Demo Mode** so the full UI is deterministic offline: search + map-click
selection produce the same `SelectedPlace`; layer switching; inspector opening; time control;
A/B/C pin + comparison with data-mode labels; explicit unavailable/partial/stale views;
keyboard navigation; reduced-motion; mobile bottom-sheet flow; demo banner + demo/live
exclusion.

## Running

```bash
npm test            # unit + integration (Vitest)
npm run test:e2e    # Playwright (starts API+web preview automatically)
npm run verify      # lint → format:check → typecheck → test → build
```

## Quality gates before V1 complete (§11)

lint ✓ · format ✓ · strict typecheck ✓ · unit/integration ✓ · E2E ✓ · production build ✓ ·
manual review of attribution + visible limitations ✓ · no undocumented blocked
source-governance issue (all tracked in [`data-sources.md`](data-sources.md) → **TO VERIFY**).

## Notes on network in CI/build

The build environment blocks outbound egress to provider hosts. Integration tests therefore
**inject** fixtures and failures rather than hitting the network, and the E2E suite uses Demo
Mode. This is deliberate: the product's honest-failure behaviour is itself tested, and no test
depends on a live third-party service.
