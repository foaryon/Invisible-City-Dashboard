# Live test plan — full workflow & data-layer verification

Systematic verification of every user-facing workflow and every provider data
path against the **live services** (run on a networked machine). Complements the
offline suites (Vitest/Playwright, which use fixtures): this plan checks what
fixtures cannot — real endpoints, real schemas, real latency.

Tooling: `npm run diagnose` (adapter-level live sweep, JSON report),
`npm run dev` + browser (UI workflows), direct `/api/*` calls (envelope
invariants, edge inputs).

Status legend: each scenario gets ✅ pass / ❌ fail / ⚠️ partial + a note in the
run report (`diagnostics-report.json` + session findings).

---

## A — Selection workflows (search, map click, pointer)

| # | Scenario | Expected |
| --- | --- | --- |
| A1 | Search "Trier" → select result | Dropdown lists Trier first; on select the map flies to ≈ (49.7596, 6.6439); marker at the same point; Place Lens header shows the label + coords |
| A2 | Partial query ("Tri") | Relevant German results, no error |
| A3 | Address-level query ("Alexanderplatz Berlin") | Result resolves, pointer lands on the square |
| A4 | Non-DE place ("Paris") | "Keine Treffer in Deutschland" — never a foreign selection |
| A5 | Gibberish ("asdfqwertz") | Honest empty state, no crash |
| A6 | Map click (city) | Provisional "Punkt lat, lon" immediately; label upgrades via reverse geocode; modules load for the clicked coords |
| A7 | Map click (offshore/border) | Provisional point stays honest; modules report their real availability, never invented values |
| A8 | **Pointer-jump race**: map click, then immediately search-select another place while the click's reverse geocode is in flight | The later (search) selection must WIN; the stale reverse result must NOT snap the map back |
| A9 | Repeated search→select cycles (×3 different cities) | Pointer lands correctly every time; no drift, no stale data mixed in |
| A10 | Keyboard path: type, ArrowDown, Enter | Same behavior as mouse select |

## B — Data layer per location (adapter-level, via `npm run diagnose`)

Locations: Trier, Berlin, München, Hamburg, Köln, Eifel (rural), Sylt (island).
Per location, all adapters: photon (search+reverse), brightsky, dwd-warnings,
uba, cams, radar, pegelonline, odl, pollen, uv, nina (incl. BKG VG250 ARS),
autobahn, geofon, cdc-normals, tankerkoenig, db-fasta, transit, overpass.

| # | Check | Expected |
| --- | --- | --- |
| B1 | HTTP reachability | No 404/5xx on keyless providers; every response parses against the Zod schema |
| B2 | Trier regression set | UBA ≠ 404 (host fix), NINA resolves ARS via BKG (deegree bbox fix), CDC normals resolve real filenames (index discovery fix) |
| B3 | Config-gated set (no `.env`) | cams, tankerkoenig, db-fasta, delfi → exactly `configuration-required`, never source-error, never data |
| B4 | Envelope invariants (every call) | `demo=false`; `data null ⇔ status ∈ {source-error, unavailable, configuration-required}`; evidence present when data present; `statusDetail` on non-ok |
| B5 | Latency profile | Per-adapter ms recorded; Autobahn total runtime and request count quantified (perf baseline for the lazy-loading fix) |
| B6 | Plausibility | Values in physical ranges (temp −30…45 °C, PM 0…500 µg/m³, ODL 0.03…0.3 µSv/h typical); station distances sane; no 0-item "ok" where data must exist (e.g. Berlin UBA) |
| B7 | Island/rural honesty | Sylt/Eifel: distant stations labelled "regionale Referenz"; absence stays absence (no invented proximity) |

## C — API surface (HTTP-level, against `localhost:3001`)

| # | Check | Expected |
| --- | --- | --- |
| C1 | Invalid inputs (`lat=99`, `lon=abc`, missing params) | 400 with German error, never 500 |
| C2 | Demo gating without `ENABLE_DEMO` | `?demo=1` is ignored (live), demo never leaks |
| C3 | `/api/health`, `/api/readiness`, `/api/providers` | Consistent manifest version; readiness matches actual config |
| C4 | Boundary coords (52.0,5.87 border; 54.0,7.9 sea; 47.42,10.98 alpine) | Honest envelopes, no crash |
| C5 | Cache behavior | Second identical call faster + `cacheAgeSeconds` surfaced in evidence, never silently stale |

## D — UI module states (browser, per city; primary: Trier)

| # | Check | Expected |
| --- | --- | --- |
| D1 | All 17 Lens cards settle | Status pill on every card; no infinite spinner; no console errors |
| D2 | NINA card | Municipality name shown (ARS resolved) — the "ARS konnte nicht bestimmt werden" bug is gone |
| D3 | Klimanormalwerte card | Month + year values render (404 bug gone) |
| D4 | Luft: Stationsmessung card | Station + pollutant values render (404 bug gone) |
| D5 | Evidence Inspector | Opens per value: provider, license, attribution, data mode, times, spatial relation |
| D6 | Coverage matrix | Rows match module states (no contradiction) |
| D7 | Layer switching | Markers + legend swap correctly (weather/air-stations/air-model/places/transit) |
| D8 | Radar overlay toggle | WMS layer appears/disappears, attribution shown |
| D9 | A/B/C compare | Pins render; only comparable values side by side; data-mode chips visible |
| D10 | Time control (+h) | Weather hour follows the selected instant; forecast chip appears |
| D11 | Perf feel | Time from select → all cards settled measured; UI stays responsive during Autobahn fetch |

## E — Resilience & repeatability

| # | Check | Expected |
| --- | --- | --- |
| E1 | Rapid re-selection (3 cities in <5 s) | Final UI state belongs to the LAST selection (no stale envelope wins) |
| E2 | Repeat run of `npm run diagnose` | Stable statuses across runs (flaky sources visible via `--watch` history) |
| E3 | Offline module honesty | With one host blocked (spot check), that module reports source-error; others unaffected |

---

**Out of scope here:** Playwright E2E (runs in CI, fixture-based), GTFS import
round-trip (needs a feed), CAMS/Tankerkönig/FaSta live paths (need keys — the
harness will verify them automatically once a `.env` provides credentials).

---

## Run record — 2026-07-18

- **A (selection):** ✅ A1–A10 pass. A8 (pointer-jump race) root-caused — a
  stale reverse-geocode response overrode a newer selection — fixed in
  `apps/web/src/selection.ts` with 4 regression tests; Enter now confirms the
  first result (unit + E2E). A6/A7 verified live (Chorin resolves with state;
  offshore stays an honest provisional point).
- **B (data layer):** ✅ after fixes. Three sweeps (133 calls each): initial 12
  findings → 7 real bugs fixed (UBA host + decommissioned stations, BKG
  deegree bbox+PiP, CDC filename discovery, Autobahn numeric coordinates,
  Photon city-state, plus the A8 race and prewarm) → final state: every
  provider green fleet-wide. Remaining sporadic findings are Overpass
  public-instance capacity under repeated sweep load (rotating locations,
  fast successes in between; mirror fallback + visibly-stale cache absorb
  them in the app).
- **C (API surface):** ✅ all — invalid inputs 400, demo never leaks without
  `ENABLE_DEMO`, readiness consistent (22 manifest entries), boundary coords
  honest, warm cache ~80 ms.
- **D (UI modules):** ✅ via Playwright (12/12 incl. axe) + live API
  equivalents (NINA municipality, CDC values, UBA measurements for Trier &
  Berlin). Prewarm: national modules answer for a never-queried city in
  51–179 ms.
- **E (resilience):** ✅ race tests, repeat-run stability, honest source-errors
  under throttling; production bundle (`build:server`) boots, serves API + SPA.
- **Gate:** 226 Vitest + 12 Playwright green locally AND in CI (`916f2df`).
