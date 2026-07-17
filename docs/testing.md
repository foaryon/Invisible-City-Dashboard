# Testing

No feature is complete without tests (§11). Quality gates must pass before V1 is declared
done.

## Layers

### Unit (`packages/*/test/*.test.ts`)
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
