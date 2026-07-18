# QA report — live-verification & hardening cycle (2026-07-18)

Defect register of the autonomous debugging loop: every finding with severity,
root cause, durable fix, protection (tests) and verification evidence. The live
instrument is `npm run diagnose` (adapter-level, real HTTP, 7+3 reference
locations) plus `/diagnose.html` (the same suite in the browser) — both built
in this cycle.

| # | Defect | Sev. | Root cause | Fix | Protection | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | UBA module HTTP 404 everywhere | hoch | Endpoint host `luftdaten.umweltbundesamt.de` no longer serves the API | Default base → `www.umweltbundesamt.de/api/air_data/v3` (`config.ts`) | `live-fixes.test.ts` host assert | diagnose: UBA 200/partial at all locations |
| 2 | UBA "keine Messwerte" in Berlin/Hamburg/Köln | hoch | Station directory keeps ~1 200 DECOMMISSIONED stations (e.g. „zDDR_B Alex_MD", closed 1990); nearest-3 picked dead stations | Activity-column filter ([5]/[6]) + prefer stations that RETURN measurements (each with real distance) | 2 unit tests (dead-station skip, honest unavailable) | Berlin now `DEBE068 Berlin Mitte` with values |
| 3 | NINA „ARS konnte nicht bestimmt werden" | hoch | BKG WFS runs deegree — GeoServer's `cql_filter` silently returns nothing | WFS 2.0 bbox + LOCAL point-in-polygon, axis-order-robust; typeName configurable | 5 unit tests (containment, axis swap, none-contains, AGS padding) | Trier ARS `072110000000`, Berlin `110000000000` durch die API bestätigt |
| 4 | Klimanormalwerte HTTP 404 | mittel | Hardcoded CDC filenames drift across revisions | Directory-autoindex discovery by pattern; unresolvable → honest source-error | 3 unit tests (index parse, resolution, missing-file null) | values at all 10 locations |
| 5 | Autobahn showed 0 events everywhere | hoch | Live API sends `coordinate.lat/long` as NUMBERS; string-only Zod schema silently dropped every road's payload | Schema accepts both; numbers normalized | 2 unit tests (numeric live shape, string doc shape) | Köln 8 events (A4 roadworks), A1 alone 226 |
| 6 | Pollen „Bundesland nicht bestimmbar" (Berlin/Hamburg) | mittel | Photon omits `state` for city-states | Derive state from city/name for Berlin/Hamburg/Bremen | 2 unit tests | Berlin → „Brandenburg und Berlin" ok |
| 7 | **Pointer jump** — map snapped to an earlier point after search | hoch | Race: throttled reverse-geocode of an older click resolved AFTER a newer selection and overwrote it; plus stale `demoMode` closure in the click handler | Guarded selection flow (`selection.ts`): stale responses only apply while their provisional selection is current; demoMode via ref | 4 regression tests (slow reverse vs. search, rapid double click, failure keeps provisional) + E2E keyboard/Enter flows | manual + suite assertion „Suche Trier → 1. Treffer = Trier" |
| 8 | Enter without arrow selection did nothing | niedrig | keydown only confirmed with `active >= 0` | Enter confirms highlighted OR first result | unit + Playwright test | type-then-Enter lands on Trier |
| 9 | First selection slow (cold national datasets) | mittel | Autobahn snapshot (~400 req), ODL full layer, UBA directory, CDC tables, pollen/UV bulletins all cold on first use | Startup prewarm (production entry only) | server option `prewarm` excluded from tests | fresh city (Dresden): 51–179 ms per national module |
| 10 | Overpass 429 cascade / Berlin 504; client killed legal queries | mittel | Client timeout 15 s < server-side `[timeout:25]` → abort + expensive re-submit; no fallback instance | Per-request timeout 30 s, zero blind retries, public-mirror fallback (`OVERPASS_FALLBACK_URL`), pacing in the sweep | 2 unit tests (mirror serve, both-limited honest 429) | successes 1.9–7 s; residual sweep-load timeouts are instance capacity (app serves visibly-stale cache) |
| 11 | Transient gateway errors surfaced as outages | niedrig | 502/503/504 never retried | ONE bounded retry for 502/503/504 (429 and other HTTP: never) | 2 unit tests | http.test.ts green |
| 12 | CI red: Prettier | niedrig | file left unformatted after an `eslint --fix` pass | format + commit | CI format gate | CI green `916f2df` |
| 13 | **GTFS import crashed on the nationwide feed** | hoch | `stop_times.txt` > Node's 512 MB string limit — `getData().toString()` threw `Cannot create a string longer than 0x1fffffe8`; sync CSV parse would also materialize millions of rows | Streaming per-line decode from the decompressed buffer with an RFC-4180 record parser (quotes, doubled quotes, embedded newlines, BOM, CRLF); `csv-parse` dependency removed | 2 regression tests (record parser, quoted/BOM/CRLF import) | import of the 243 MB Germany feed (see gtfs-import.log / progress.md) |

**Non-defects surfaced by the suite** (honest states, verified as correct):
Pegel „kein Bundespegel ≤ 30 km" (München/Eifel), GEOFON empty catalogue (204),
offshore/alpine absences, `configuration-required` for key-gated providers.

**Gate status at report time:** 228 Vitest + 13 Playwright green locally and in
CI; lint/typecheck/prettier clean; web + single-file server builds pass;
`/diagnose.html`: 11/11 workflow assertions PASS.

**Known environmental constraint:** both public Overpass instances throttle
sustained sweep load (rotating, transient; app-level mitigations: 6 h cache
with visible staleness, mirror fallback, fair-use serialization). Self-hosting
documented as the path for bulk use.
