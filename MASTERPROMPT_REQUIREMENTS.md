# Masterprompt Compliance Specification — The Invisible City

```yaml
spec_version: 1.0.0
date: 2026-07-19
requirements_total: 214
deviations: 21
ambiguities: 10
generated_by: compliance-blueprint session 2026-07-19 (deterministic render from structured records)
```

Binding requirement inventory for the Invisible City Dashboard, extracted from the four
pinned source layers below. **This document defines WHAT must hold; the machine-readable
companion [MASTERPROMPT_TEST_MATRIX.yaml](MASTERPROMPT_TEST_MATRIX.yaml) defines HOW each
requirement is verified (scenarios, oracles, killing mutations, layers, evidence, status).**
Governance rules for both live in [TEST_GOVERNANCE.md](TEST_GOVERNANCE.md); fixture rules in
[TEST_DATA_AND_FIXTURE_POLICY.md](TEST_DATA_AND_FIXTURE_POLICY.md); evidence-manifest schema
in [TEST_EVIDENCE_MANIFEST.schema.json](TEST_EVIDENCE_MANIFEST.schema.json).

## Source register (pinned)

| Layer | Source | sha256 | Role |
| --- | --- | --- | --- |
| S1 | `docs/MASTERPROMPT.md` | `7c63c30e7240406832202d93b50652456b3f40912e59951b3c43ed7913e9ecf8` | Masterprompt v2.0 (§0–§13, verified July 2026) — canonical, user-supplied, verbatim incl. embedded citation-link artifacts |
| S2 | `(register B below)` | `—` | Deviation register — as-built deltas vs S1, adjudicated against docs/decisions.md |
| S3 | `docs/product-charter.md` | `1c3338dd131100cfe2405aed3bcd0df675fb9b7ca0fec1379aa26452eeb57bb9` | Product charter (restates S1) |
| S3 | `docs/evidence-policy.md` | `432014c2d45a55f80d1f56e32b475be96b042830724f644225a7f83bba92f9b4` | Evidence policy |
| S3 | `docs/map-semantics.md` | `546a67eb8b8ee047540036bdcfc6164d34e2717fbb04b4c2a33c57c8570ba612` | Map semantics |
| S3 | `docs/privacy.md` | `5b0360bf27f4bbdff1e93df266d057ca1fd096b0a7f69e2ef1e143e2b5f545b2` | Privacy |
| S3 | `docs/spatial-contract.md` | `0bb23ec93db5c27ef67d1521065467afe083a3be8f9683614fc0a28d02b831dd` | Central spatial-selection contract |
| S3 | `docs/testing.md` | `666581e5cdc79a3b498e79516920f762d61df76e6b026c53747b3d960dffe3b6` | Testing strategy |
| S3 | `docs/data-sources.md` | `9413eac80c39ec2b5c2bb6dbe354f2a06566cc4f5830654ba73d6e9ccfb83601` | Data sources & provider manifest summary |
| S3 | `docs/decisions.md` | `bbc33fcbe7cd1bc56099f17e1c17ddac78ec255f1784a3bdbf36246ab50d46a3` | Decision log (deviation authority) |
| S3 | `docs/qa-checklist.md` | `fa8ca8d37cb969fd3ac42a759d64b5f5ba25acabb16a558d326e0d61fe0b23bd` | QA checklist (manual visual rubric) |
| S3 | `docs/providers-db-tankerkoenig.md` | `87bf1ac9b70076a3944d10d27e6dd4a96e19945a0b79363dbbf71bb34c3aabc4` | DB FaSta & Tankerkönig integration reference |
| S3 | `docs/live-testplan.md` | `339fe9be46e0d167910ba63b5d1585ca308e8470187eddd055746f1973df8060` | Live test plan + run record 2026-07-18 |
| S3 | `README.md` | `4bfc22bbc568653f6b062e3b9487c35437f26f6e2ab29362372d47b336684057` | README (reality policy restatement) |
| S4 | `compliance-sources/goal-directive-2026-07-18.md` | `e978f3dba6fb9eb327d6611c17357aa1bcbc4ba147ac6257f8e296e62005ce37` | User goal directives 2026-07-18 (marked reconstruction — see AMB-05) |

Hashes pin the exact source texts this extraction was performed against. If any source file
changes, this document's extraction must be re-audited against the new hash (governance rule 1).

## Reading rules

- **IDs are immutable.** A requirement statement is NEVER edited in place. Corrections
  happen by supersession: the old entry gains `superseded_by: <new id>` and stays in the
  document; the new entry gets a new ID. `statement_sha256` pins each statement.
- **Quotes are verbatim, whitespace-normalized.** Every `quote` is a literal substring of its
  pinned source after collapsing whitespace runs (line-wrap only). This is machine-checked at
  render time — a quote that stops matching its source fails the build of this document.
- **Risk score** = Severity (1–5, impact of violation) × Likelihood (1–5, chance of
  regression/violation). **Priority** derives deterministically: score ≥ 16 → P0, 10–15 → P1,
  5–9 → P2, ≤ 4 → P3 (explicit override permitted with justification; none currently used).
- **Verifiability classes:** `deterministic` (machine-checkable oracle, killing mutation
  mandatory) · `statistical-environmental` (depends on live third-party state; triaged, never
  CI-gating) · `manual-rubric` (named rubric + attestation) ·
  `not-deterministically-verifiable` (**flagged**: no deterministic oracle exists even in
  principle; rubric mandatory).
- **Status vocabulary** (normative in the matrix): `covered` (named existing test + oracle +
  evidence) · `partial` (some oracles covered, gaps named) · `planned` (no existing
  verification; honest gap) · `manual-only` · `not-deterministic`. Nothing is `covered`
  without a named existing test — this is machine-enforced at render time.
- **Layer duplicates:** where S4 directives or §10/§13 acceptance restate S1 requirements,
  the entries cross-reference instead of duplicating oracles (see AMB-08).

## Coverage accounting (honest totals)

| Dimension | Counts |
| --- | --- |
| By status | covered: 176 · manual-only: 12 · partial: 20 · planned: 6 |
| By verifiability | deterministic: 204 · manual-rubric: 7 · not-deterministically-verifiable: 1 · statistical-environmental: 2 |
| By priority | P0: 1 · P1: 77 · P2: 104 · P3: 32 |
| By source layer | S1: 173 · S3: 13 · S4: 28 |

Extraction is dedup-based (AMB-08): §10 stage acceptance and §13 DoD are modeled as
cross-referencing acceptance bundles, so the total is lower than a naive per-sentence count
would be — every normative S1 sentence is nonetheless traceable to exactly one ID.

## Register A — Ambiguities, contradictions, untestable risks

| ID | Affects | Issue | Interpretation chosen | Residual risk |
| --- | --- | --- | --- | --- |
| **AMB-01** | ALL MP-* | The canonical Masterprompt text was not in the repository until 2026-07-18; the 17 §-anchors cited in code/tests were written against the cloud-session copy. | The user-supplied text now pinned as docs/MASTERPROMPT.md (sha256 in the source register) is THE canonical S1; all §-anchors resolve against it and were spot-checked during extraction. | None after pinning; recorded for provenance history. |
| **AMB-02** | MP-4.1-01, GD-GFX-01 | "Calm, premium, polished, professional" are aesthetic judgments with no deterministic oracle. | Split: layout DEFECTS (overlap/clipping/overflow) get deterministic probes; the aesthetic residue is a manual rubric with named reviewer, target system and screenshot evidence — flagged not-deterministically-verifiable. | Reviewer subjectivity; mitigated by the fixed checklist and screenshot evidence. |
| **AMB-03** | MP-5.4-12, GD-DBTK-04, DEV-06 | Public-instance availability (Photon demo, Overpass public, OpenFreeMap) is environmental — live sweeps can fail without any product defect. | Live-path checks are classified statistical-environmental; a red diagnose finding on these hosts is triaged (capacity vs product bug) rather than auto-failing compliance. CI never depends on them (DOC-TEST-01). | A real product regression on these paths could initially be mistaken for provider capacity; the repeat-run protocol (E2 stability check) bounds this. |
| **AMB-04** | MP-3.1.D-01, DEV-16 | S1 §5.4 names the UBA endpoint as luftdaten.umweltbundesamt.de "Air Data API v4"; the live-verified working path is www.umweltbundesamt.de/api/air_data/v3. | Live verification outranks the seed value per §0 (re-verify at build time). The v4-vs-v3 label mismatch stays an open TO VERIFY item in data-sources.md. | If UBA publishes a v4 under the old host later, the adapter base host must be re-evaluated; tracked. |
| **AMB-05** | ALL GD-* | The S4 goal directives' original chat wording is not verbatim-recoverable (session context was summarized before pinning). | compliance-sources/goal-directive-2026-07-18.md is a marked reconstruction cross-checked against the same-day artifacts (spatial-contract.md, providers-db-tankerkoenig.md, qa-checklist.md, selection.ts + tests). GD quotes cite the reconstruction, never the lost original. | Paraphrase drift is possible; the user can amend the file (new dated file + supersession) if any directive is misstated. |
| **AMB-06** | MP-3.1.A-02 | S1 mandates search by "coordinates and selected POI types"; no named test evidences either input class. | The requirement is kept at full strength with status partial — NOT silently narrowed to name/address search. Establishing (or honestly failing) these two input classes is a P1 verification task. | Until tested, the search feature's S1 conformance is unproven for two of four input classes. |
| **AMB-07** | MP-7.1-04, MP-7.1-05, DEV-02 | docs/decisions.md 2026-07-17 records the switch to node:sqlite, but the pinned-versions table in the same file still lists better-sqlite3 ^12.2.0. | The dated decision entry wins (newest-first log); the table row is stale. | Must-fix documentation item: update the table row. Verified 2026-07-19: no package.json lists better-sqlite3 — the dependency itself is fully removed; only the decisions.md table row is stale. |
| **AMB-08** | MP-10.*, MP-13-* | §10 stage acceptance and §13 DoD restate many §2/§3 requirements; naive extraction would create duplicate IDs with divergent wording. | Stages and DoD are modeled as acceptance BUNDLES that cross-reference the implementing requirements; only genuinely novel norms (independent reviews, dense-zoom performance, no-call-without-manifest) get their own content. | None — the traceability is explicit in each bundle's interpretation. |
| **AMB-09** | MP-11-02 | §11 mandates a "rate limit (429 from Overpass/Nominatim)" scenario, but Nominatim is not used (Photon instead). | The scenario class applies to the geocoder actually in use: 429/throttle handling is required for Photon and Overpass. | None. |
| **AMB-10** | MP-3.1.F-03 | gtfs.de free-tier feeds are valid 30 days from publication; an imported feed silently ages toward invalidity. | Feed publication/validity metadata must be preserved and surfaced (already mandated by §3.1.F); an expired-validity feed must render as stale/limited, never as silently current. | An explicit expired-feed fixture test is PLANNED (listed in the matrix for MP-3.1.F-03 boundary cases). |

## Register B — Deviation register (as-built vs Masterprompt)

Disposition `superseding` = deliberate, documented decision that outranks the S1 seed value
(authority cited). Disposition `gap` = unresolved delta; a gap is a MUST-FIX (or must-accept
with expiry) item and can never be silently normalized.

| ID | S1 ref | S1 position | As built | Disposition | Authority | Residual |
| --- | --- | --- | --- | --- | --- | --- |
| **DEV-01** | §7.1 | Node.js 24 LTS; do NOT default to Node 22 unless a dependency requires it | engines.node >= 22.11.0; developed/verified on Node 22 (build environment had no Node 24); app runs on 22 and 24, Node 24 recommended for deployment | **superseding** | docs/decisions.md 2026-07-16 — Node version | None functional; the environment constraint, not a dependency, forced Node 22 — documented instead of blocking. |
| **DEV-02** | §7.1 | SQLite default better-sqlite3; node:sqlite permitted after feature-parity verification | node:sqlite behind a shim (exec/prepare/transaction/close) since 2026-07-17; zero native deps; cache schema unchanged | **superseding** | docs/decisions.md 2026-07-17 — node:sqlite replaces better-sqlite3 | decisions.md pinned-versions table still lists better-sqlite3 ^12.2.0 — documentation inconsistency tracked as AMB-07 (must-fix docs item). |
| **DEV-03** | §5.4 | Choose ONE primary base map (basemap.de or OpenFreeMap) | OpenFreeMap liberty primary; basemap.de documented as drop-in alternative | **superseding** | docs/decisions.md 2026-07-16 — Base map: OpenFreeMap | None — a choice S1 explicitly offered. |
| **DEV-04** | §3.1.C | Two documented DWD access paths; choose per adapter and record in manifest | Bright Sky chosen, labelled unofficial access layer, opendata.dwd.de MOSMIX fallback documented | **superseding** | docs/decisions.md 2026-07-16 — Weather via Bright Sky (labelled unofficial) | None — S1-sanctioned choice with required labelling. |
| **DEV-05** | §5.2 | Status enum proposed|verified|suspended|deprecated per manifest entry | Config-driven effective status: keyless providers always verified; credentialed providers base proposed, auto-upgrading to verified when env credentials exist (getEffectiveProvider) | **superseding** | docs/decisions.md 2026-07-17 — Config-driven provider activation (production posture) | None — strengthens the gate: unconfigured never serves, configured serves only through the same verified gate. |
| **DEV-06** | §5.4 | For production, SELF-HOST Nominatim or Photon; prefer a self-hosted Photon for autocomplete | Public photon.komoot.io in use (server-side, debounced, cached, DE-filtered); PHOTON_URL override exists; self-hosting tracked TO VERIFY | **gap** | docs/decisions.md 2026-07-16 — Geocoding: Photon, not public Nominatim; docs/data-sources.md TO VERIFY #2 | MUST-FIX before production posture is claimed for sustained public use: deploy self-hosted Photon and set PHOTON_URL. Until then geocoding availability is best-effort (AMB-03). |
| **DEV-07** | §2.1 / §3.2 | No scraping of undocumented endpoints; no unverified integrations | Thru.de/PRTR fully implemented in V1.1, then REMOVED 2026-07-17 because its only data path requires a manual CSV export; established the rule that every live module must be fully automatic | **superseding** | docs/decisions.md 2026-07-17 — Thru.de/PRTR removed: no manual-download dependencies | No greenhouse-gas module exists at all — an honest absence by product decision, documented in data-sources.md. |
| **DEV-08** | §2.4 / §6 | DataMode is the closed ten-value enum | 'reported' mode was added for PRTR (V1.1) and removed with Thru.de; enum is back to the canonical ten | **superseding** | docs/decisions.md 2026-07-17 (both entries) | None — current state conforms; history recorded here so the enum's stability is auditable. |
| **DEV-09** | §6 | Evidence type field list (no sourceTimeRaw) | Evidence extended with optional sourceTimeRaw preserving verbatim source time (UBA CET) | **superseding** | docs/evidence-policy.md — The Evidence record | None — additive, serves §3.1.B's preserve-original-time mandate. |
| **DEV-10** | §3 V1 scope | V1 provider set: DWD, UBA, optional CAMS, OSM/BKG, DELFI/gtfs.de, geocoding, base map | V1.1 expansion (2026-07-17): PEGELONLINE water levels, BfS ODL gamma dose, DWD pollen, DWD UV, DWD radar — all through the same adapter→Evidence→envelope pattern | **superseding** | docs/decisions.md 2026-07-17 — V1.1 provider expansion | None — each addition passed the §3.3-equivalent gate (documented source, license, spatial semantics, limitations). |
| **DEV-11** | §3 V1 scope | (same) | Tier-1/2 expansion (2026-07-18): NINA warnings, BKG VG250 assignment, Autobahn events, GEOFON earthquakes, CDC climate normals + fetchTextWithCache plumbing | **superseding** | docs/decisions.md 2026-07-18 — Tier-1/Tier-2 expansion (all fully automatic) | Autobahn scope honesty (federal motorways only) keeps MP-3.2-09 satisfied. |
| **DEV-12** | §3 V1 scope / §3.2 | No universal transit accessibility/lift-outage coverage promised | DB FaSta (elevators/escalators ≤3 km, honest UNKNOWN) + Tankerkönig fuel prices — both key-gated, CAMS activation pattern | **superseding** | docs/decisions.md 2026-07-18; docs/providers-db-tankerkoenig.md | FaSta stays per-station local status — explicitly NOT the universal coverage §3.2 excludes. |
| **DEV-13** | §3.1.E | POI categories: parks, stops, pharmacies, toilets, drinking water, selected facilities | Extended by emergency & health: defibrillators, hospitals, fire stations via the existing keyless OSM provider, with the 112/incompleteness caveat | **superseding** | docs/decisions.md 2026-07-18 — Emergency & health infrastructure | None — mapped-context rules apply unchanged (DOC-DS-05). |
| **DEV-14** | §2.1 | Never silently substitute a different provider | Overpass public-mirror fallback (overpass.kumi.systems, once, config-disableable, same OSM data) added 2026-07-18 for throttling resilience | **superseding** | docs/data-sources.md — Mirror fallback (2026-07-18) | Not a data-source substitution (same OSM data, documented, evidence unchanged); DOC-DS-01 pins the policy. |
| **DEV-15** | §7.2 | packages/ui (accessible components) and packages/test-fixtures as own workspaces | packages/ui never created — accessible components live in apps/web/src; fixtures live inside each package's test directory | **gap** | repository tree (no decision-log entry) | Structural-only, low impact; accepted unless component reuse across apps emerges. Registered so the §7.2 delta is never silent. |
| **DEV-16** | §3.1.D / §5.4 | UBA endpoint https://luftdaten.umweltbundesamt.de/ (Air Data API v4) | Live-verified 2026-07-18: that host 404s; working base is https://www.umweltbundesamt.de/api/air_data/v3; positional indices live-verified | **superseding** | docs/data-sources.md — UBA section (live-verified notes) | API version label (v3 vs v4) still TO VERIFY against current docs (AMB-04). |
| **DEV-17** | §11 | Testing = unit + integration + Playwright + quality gates | Additional live diagnostic layer: npm run diagnose (adapter×location sweep, JSON report, envelope invariants) + /diagnose.html in-browser suite with Dauerlauf mode | **superseding** | docs/live-testplan.md; docs/qa-checklist.md | None — additive verification infrastructure mandated by GD-TEST-01. |
| **DEV-18** | §0 (verified facts) | bund.dev documents Autobahn coordinate fields as strings | Live-verified 2026-07-18: coordinate.lat/long are NUMBERS; adapter accepts both; the strings-only schema silently dropped every event | **superseding** | docs/data-sources.md — Autobahn section | None — regression-tested (live-fixes suite). |
| **DEV-19** | §3.1.D | Show nearest station data | Nearest MEASURING station: ~1,200 decommissioned directory entries skipped; stations that actually return measurements preferred, real distances shown | **superseding** | docs/data-sources.md — UBA station directory semantics | Some legacy entries carry no end date yet report nothing (source data quality) — handled, documented. |
| **DEV-20** | §5.4 (BKG WFS) | WFS endpoint usable via standard query patterns (cql_filter INTERSECTS assumed) | sgx.geodatenzentrum.de runs deegree: no cql_filter support; adapter uses WFS 2.0 bbox KVP + local point-in-polygon, axis order normalized defensively | **superseding** | docs/data-sources.md — BKG VG250 query mechanics (live-verified) | None — live-verified for Trier/Berlin; typeNames overridable. |
| **DEV-21** | §0 (verified facts) | CDC normals reachable under stable documented filenames | Filenames drift across CDC revisions; adapter discovers actual names via directory autoindex; unresolvable → source-error | **superseding** | docs/data-sources.md — CDC filename discovery (live-verified) | None — regression-tested. |

## Requirements by domain

### Domain: Selection & map interaction (13)

#### GD-MAP-01

- **Source:** S4 · GD-MAP 1 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Search-selection and map-click must place the marker exactly at the selected place; the map flies there; Place Lens and all modules load for exactly those coordinates."
- **Statement:** Selection places the marker exactly at the selected coordinates, flies the map there, and all modules load for exactly those coordinates.
- **statement_sha256:** `8494bf1803462faa585f948f41bb07529b78f744f72db5369a2572170dc63a54`
- **Interpretation:** Coordinate-exactness across marker, camera and module requests; A1 of the live test plan (Trier ≈ 49.7596, 6.6439).
- **Preconditions & fixtures:** Search fixture for a known place.
- **Scenarios:**
  - GIVEN search 'Trier' and select WHEN the map settles THEN camera centre ≈ selection coords, marker at the same point, module requests carry those coords
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### GD-MAP-02

- **Source:** S4 · GD-MAP 2 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Zoom, pan, resize, layer switching, data refreshes, rerenders, retries and slow responses must NEVER move the selection or the marker."
- **Statement:** Only explicit user actions change the selection; zoom/pan/resize/layer switches/refreshes/rerenders/retries/slow responses never move it.
- **statement_sha256:** `1248c7beb64e23c720d8a2252a36663eef2130c55cbf456d1908d4e42912787f`
- **Interpretation:** Write-path discipline: selectPlace callers are SearchBox, selection.ts, compare-pin restore only (spatial-contract §1).
- **Preconditions & fixtures:** Selected place; interaction storm.
- **Scenarios:**
  - GIVEN a selection WHEN the user zooms/pans/switches layers while modules refresh THEN SelectedPlace and marker are bit-identical afterwards
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### GD-MAP-03

- **Source:** S4 · GD-MAP 3 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "a stale reverse-geocode result for an earlier map click must not snap the map back after the user has selected something else (the "pointer-jump race")."
- **Statement:** A stale asynchronous reverse-geocode result never overrides a newer selection: the later selection always wins.
- **statement_sha256:** `4f6c2c57b79cd6e022ba08b2ce3b5da5a1d3fc8a828a23ef5f2c5765574628d3`
- **Interpretation:** The root-caused A8 defect (fixed in apps/web/src/selection.ts): the async result applies only while its originating click is still the current selection.
- **Preconditions & fixtures:** Deferred reverse-geocode fixture.
- **Scenarios:**
  - GIVEN a map click whose reverse geocode is in flight WHEN the user search-selects another place before it resolves THEN the search selection stands; the stale result is discarded
  - GIVEN two rapid map clicks WHEN the first geocode resolves last THEN the second click's selection stands
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 4 = 20 → **P0**
- **Verification status (see matrix):** covered

#### GD-MAP-04

- **Source:** S4 · GD-MAP 4 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Repeated selection cycles must land correctly every time — no drift, no stale data attributed to the new place."
- **Statement:** Repeated selection cycles land correctly every time; no drift and no stale envelope attributed to the new place.
- **statement_sha256:** `d7e6c3ce8f4f11092a98e7fa85e8fbb797d73f65a255f5f94ca52c56075976b8`
- **Interpretation:** A9/E1 of the live plan: last selection wins across all modules.
- **Preconditions & fixtures:** Three-city cycle fixture.
- **Scenarios:**
  - GIVEN three rapid selections (<5 s) WHEN responses settle THEN every module's final state belongs to the LAST selection
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** partial

#### MP-3.1.A-01

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Interactive Germany map (MapLibre GL JS)."
- **Statement:** The product renders an interactive Germany map built on MapLibre GL JS.
- **statement_sha256:** `3d01c73cd1b6275c7d77fac85e65fb73d9a5dd9485cf9a9ded07b7a1db08dda5`
- **Interpretation:** MapLibre GL JS v5 per §7.1 (MP-7.1-03); the map is interactive (zoom/pan/click).
- **Preconditions & fixtures:** Built web app.
- **Scenarios:**
  - GIVEN the app loads WHEN the map initializes THEN a MapLibre canvas renders Germany and responds to interaction
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 1 = 5 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.A-03

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Map click to set a temporary analysis point; reverse-geocoded label where available."
- **Statement:** A map click sets a temporary analysis point immediately (provisional coordinate label) and upgrades the label via reverse geocoding where available.
- **statement_sha256:** `6bb305fe7adb92d524927b7eda185f8776f01899b5eb67a8ec300c18886e6911`
- **Interpretation:** Provisional 'Punkt lat, lon' appears synchronously; reverse geocode upgrades asynchronously under the stale-response guard (GD-MAP-03).
- **Preconditions & fixtures:** Map; reverse geocoding (fixture or live).
- **Scenarios:**
  - GIVEN the user clicks a city location WHEN the click lands THEN the point is selected immediately with a provisional label, later replaced by the geocoded name
  - GIVEN the user clicks offshore WHEN reverse geocoding yields nothing THEN the provisional coordinate label remains — no invented name
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.A-04

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Zoom, pan, keyboard navigation, touch interactions."
- **Statement:** The map supports zoom, pan, keyboard navigation and touch interactions.
- **statement_sha256:** `8e1de1c4440f6a5df165ec3a23e566c406b02d90faf5fed2a21e59df1e384551`
- **Interpretation:** MapLibre built-ins must remain enabled; keyboard map navigation is part of the accessibility path (MP-3.1.K-01).
- **Preconditions & fixtures:** Map instance.
- **Scenarios:**
  - GIVEN the map WHEN the user zooms/pans by mouse, keyboard and touch THEN the viewport changes; the selection does not (GD-MAP-02)
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** manual-only

#### MP-3.1.A-05

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Search result selection AND map-click MUST produce the same SelectedPlace contract."
- **Statement:** Search selection and map click produce the identical SelectedPlace contract — same shape, same downstream behaviour.
- **statement_sha256:** `d8e5104f8007e53cae9004cfafa9774a58aa81646b34ee0e977333ef27472f3d`
- **Interpretation:** One store, one type; modules cannot distinguish the origin of the selection.
- **Preconditions & fixtures:** Both selection paths.
- **Scenarios:**
  - GIVEN a place selected via search and the same coords via map click WHEN SelectedPlace is inspected THEN both satisfy the same Zod contract and drive identical module requests
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.B-01

- **Source:** S1 · §3.1.B · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "One selected location; one selected point in time; "Now" and short-term forward time selection."
- **Statement:** There is exactly one selected location and one selected point in time; the time control offers Now plus short-term forward selection.
- **statement_sha256:** `241043515c2d556a0775ae465ee6020068a4f20ce9e83f81935dd1a8c0ab7834`
- **Interpretation:** Single source of truth in the store; the time control moves a shared instant consumed by every time-aware module.
- **Preconditions & fixtures:** Store; time control.
- **Scenarios:**
  - GIVEN a selected place WHEN the user advances the time (+h) THEN every time-aware module (weather hour, radar frame) follows the same instant
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-4.3-01

- **Source:** S1 · §4.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "only ONE primary analytical layer dominates at a time (Weather & warnings | Air: station observations | Air: regional model | Transit context | Place & mapped context | Data availability)."
- **Statement:** Exactly one primary analytical layer dominates at a time, from the six defined layers.
- **statement_sha256:** `29017552ad0d2eb87e3936850c5a37b56ed55b86b94b13affc412b393ebc6d02`
- **Interpretation:** Layer switching is exclusive; the registry defines the six layers (air-model present but disabled until CAMS activation).
- **Preconditions & fixtures:** Layer controls.
- **Scenarios:**
  - GIVEN a layer is active WHEN the user switches THEN the previous layer's markers/legend give way to the new one; never two analytical layers at once
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-4.3-02

- **Source:** S1 · §4.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Every layer must have a legend and identify source, data mode, spatial meaning, time applicability and limitations."
- **Statement:** Every analytical layer has a legend identifying source, data mode, spatial meaning, time applicability and limitations.
- **statement_sha256:** `561fbf439fce51d3719717f3d5402893f78603a2408cd5acf5cfabceee58f0b9`
- **Interpretation:** The layer registry carries these attributes; the Legend component renders them per active layer.
- **Preconditions & fixtures:** Layer registry.
- **Scenarios:**
  - GIVEN each registered layer WHEN activated THEN its legend shows the five attributes
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-6-05

- **Source:** S1 · §6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "type SelectedPlace = { id: string; label: string; coordinates: { latitude: number; longitude: number }; locality?: string; municipality?: string; state?: string; country: "DE"; };"
- **Statement:** SelectedPlace has the specified shape with country fixed to DE; both selection paths produce it (MP-3.1.A-05).
- **statement_sha256:** `13551c6ec21ab9655b0e706bbc0173d340edd3e0eaf97d67a412fa7bfa04386c`
- **Interpretation:** Zod-validated at API boundaries; Germany-only selection enforced at search level.
- **Preconditions & fixtures:** Contracts; selection paths.
- **Scenarios:**
  - GIVEN any selection WHEN validated THEN the SelectedPlace contract holds; country is DE
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-10.1-01

- **Source:** S1 · §10 Stage 1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Acceptance: same SelectedPlace contract for search and map click; keyboard path works; inspector works with demo fixtures; A/B/C comparison always includes data mode."
- **Statement:** Stage 1 acceptance: same SelectedPlace contract for both selection paths; keyboard path works; inspector works on demo fixtures; A/B/C comparison always includes data mode.
- **statement_sha256:** `1d48939d90af2797cc0281103010aaeccda5f0c9cc50efc4cc513241cbd02133`
- **Interpretation:** Bundle over MP-3.1.A-05, MP-3.1.K-01, MP-3.1.H-01/02, MP-3.1.G-02.
- **Preconditions & fixtures:** Demo mode.
- **Scenarios:**
  - GIVEN demo mode WHEN the four criteria are exercised THEN all pass
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

### Domain: Search & geocoding (4)

#### GD-MAP-05

- **Source:** S4 · GD-MAP 5 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "The keyboard path (type query, ArrowDown, Enter) must behave identically to the mouse path; Enter confirms the highlighted or first result."
- **Statement:** The keyboard search path behaves identically to the mouse path; Enter confirms the highlighted or first result.
- **statement_sha256:** `ebcf9a6ee5cc07093eca584b92ead4ed3b0804b0b3888ea231541523986e2911`
- **Interpretation:** Includes the Enter-without-arrows case (root-caused during A-run).
- **Preconditions & fixtures:** Search fixtures.
- **Scenarios:**
  - GIVEN a typed query WHEN ArrowDown+Enter THEN the highlighted result is selected exactly like a click
  - GIVEN a typed query WHEN Enter without arrows THEN the first result is confirmed
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.A-02

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Search by place name, address, coordinates and selected POI types."
- **Statement:** Search supports place names, addresses, coordinates and selected POI types as inputs.
- **statement_sha256:** `ceaa1ab11c221eb0aaea9972792ad8546799c76a38a264911922968d8889f931`
- **Interpretation:** Place-name + address search is live (Photon). Coordinate input and POI-type search: verify presence; if absent this is a coverage gap to surface, not to paper over.
- **Preconditions & fixtures:** Search box; geocoding adapter (fixtures).
- **Scenarios:**
  - GIVEN the search box WHEN the user types 'Trier', 'Alexanderplatz Berlin', '49.75, 6.64', or a POI-type query THEN each input class resolves to selectable results or an honest empty state
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 3 = 9 → **P2**
- **Verification status (see matrix):** partial
- **Notes:** Name/address search covered; direct coordinate-string input and POI-type search coverage not evidenced by a named test — matrix keeps this partial until proven.

#### MP-5.4-11

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Nominatim public API https://nominatim.openstreetmap.org: MAX 1 request/second; valid identifying User-Agent required;"
- **Statement:** The public Nominatim API constraints are respected: the product does NOT use public Nominatim as its geocoder (Photon instead); any OSM geocoding is server-side, cached, identified by User-Agent, without client-side autocomplete or bulk queries.
- **statement_sha256:** `422a04df2a2c708303117254a1237d432ba9da73949f3e927f4ef30f0e9a89f0`
- **Interpretation:** As built: Photon chosen precisely because the OSMF policy forbids this usage pattern (DEV-06); the requirement holds as a negative (no public-Nominatim dependency) plus the general rate/caching discipline.
- **Preconditions & fixtures:** Search path.
- **Scenarios:**
  - GIVEN search-as-you-type WHEN requests flow THEN they hit the product API → Photon (debounced, cached, UA-identified); nominatim.openstreetmap.org is never called
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-06

#### MP-5.4-12

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Prefer a self-hosted Photon for autocomplete."
- **Statement:** For production autocomplete, a self-hosted Photon (or Nominatim) is preferred; the public Photon demo (no availability guarantee) is a documented interim with a TO VERIFY task.
- **statement_sha256:** `0eb5c15341c8fe7539acdfe28483b84a003e4f023b76f2b0e4034a5b2313ead8`
- **Interpretation:** As built: public photon.komoot.io with PHOTON_URL override — a tracked deviation (DEV-06), not a silent one.
- **Preconditions & fixtures:** Config.
- **Scenarios:**
  - GIVEN a production deployment WHEN configured THEN PHOTON_URL can point to a self-hosted instance without code change
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 3 = 9 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-06

### Domain: Spatial contract & semantics (21)

#### DOC-SPATIAL-01

- **Source:** S3 · spatial-contract.md §2 · `docs/spatial-contract.md`
- **Quote (verbatim, whitespace-normalized):** "GeoJSON order | `[lon, lat]` converted ONCE per adapter at the parse boundary (Photon, ODL, BKG); BKG additionally normalizes ambiguous WFS axis order by German-bounds heuristic"
- **Statement:** GeoJSON [lon, lat] order is converted exactly once per adapter at the parse boundary; BKG's ambiguous WFS axis order is normalized via the German-bounds heuristic.
- **statement_sha256:** `59d99f9827fbca6304ca301ca316d8c11a81ea48bfc7211aa0b052c3258af1ff`
- **Interpretation:** Axis-order bugs were a live-found defect class (deegree); the single-conversion rule prevents double-swaps.
- **Preconditions & fixtures:** Adapter fixtures with both axis orders (BKG).
- **Scenarios:**
  - GIVEN a BKG response in either axis order WHEN parsed THEN coordinates land as correct WGS84 lat/lon (Germany bounds check)
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-20

#### DOC-SPATIAL-02

- **Source:** S3 · spatial-contract.md §3 · `docs/spatial-contract.md`
- **Quote (verbatim, whitespace-normalized):** "UBA air stations | nearest MEASURING stations (decommissioned/dormant directory entries skipped); ≤ 5 km labelled nah, else „regionale Referenz""
- **Statement:** UBA station selection considers only measuring stations: decommissioned/dormant directory entries are skipped, stations actually returning measurements are preferred, each shown with its real distance.
- **statement_sha256:** `196f82ccba3954c3733c84146309bc10b54207ad17c5fcf4487b66c98a8265b8`
- **Interpretation:** The live-verified fix for the ~1,200 decommissioned entries (zDDR stations near Berlin-Mitte); selection, never interpolation.
- **Preconditions & fixtures:** Station-directory fixtures with decommissioned entries.
- **Scenarios:**
  - GIVEN a directory whose nearest entries are decommissioned WHEN stations are selected THEN active measuring stations win, with their real (larger) distances shown
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-19

#### DOC-SPATIAL-03

- **Source:** S3 · spatial-contract.md §3 · `docs/spatial-contract.md`
- **Quote (verbatim, whitespace-normalized):** "PEGELONLINE | hard radius 30 km (federal waterways only) | „Kein Pegel … im Umkreis von 30 km" — coverage statement, no substitute"
- **Statement:** The provider radius/containment registry holds as documented: PEGELONLINE 30 km, Autobahn 30 km motorways-only, GEOFON 200 km/90 d, POIs 1 200 m, FaSta 3 km, Tankerkönig 5 km, CDC/UV nearest-with-distance, CAMS containing cell, radar containing 1 km cell, pollen Bundesland partregions, NINA district point-in-polygon.
- **statement_sha256:** `be142dd9c8f4bd05b578e40ace40cee876e7764e5e5d5bb8c6dda0dd18da6440`
- **Interpretation:** The 15-row applicability table as one registry norm; every row change requires a doc change (GD-SPATIAL-03 is the meta-rule; this is the concrete current registry).
- **Preconditions & fixtures:** Adapters + doc.
- **Scenarios:**
  - GIVEN each bounded provider WHEN its constant is compared with the registry THEN they match
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** partial
- **Notes:** Rules individually tested; the automated registry↔code audit is PLANNED.

#### DOC-SPATIAL-04

- **Source:** S3 · spatial-contract.md §4 · `docs/spatial-contract.md`
- **Quote (verbatim, whitespace-normalized):** "BKG only accepts the polygon that CONTAINS the point (nearest-feature fallback only when exactly one feature returned)."
- **Statement:** BKG territorial assignment accepts only the polygon containing the point; the nearest-feature fallback applies only when exactly one feature is returned.
- **statement_sha256:** `cfb65015b9f9b182c31d43739791ce902306b5bc69703394ab5e0622f81e26db`
- **Interpretation:** Prevents wrong-Gemeinde assignment at bbox edges.
- **Preconditions & fixtures:** Multi-feature bbox fixtures.
- **Scenarios:**
  - GIVEN a bbox query returning two Gemeinden WHEN assigned THEN the containing polygon wins; the nearer-but-not-containing one is rejected
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-20

#### GD-SPATIAL-01

- **Source:** S4 · GD-SPATIAL 1 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Exactly one authoritative `SelectedPlace`; every module reads it; none owns a private copy."
- **Statement:** Exactly one authoritative SelectedPlace exists in the app store; every module reads it and none owns a private copy.
- **statement_sha256:** `843c1de5865bf20ef911bd0d155f70319b5ee68c2cf8c1150c2d37319b03df24`
- **Interpretation:** Spatial-contract §1: the store field is the single authority.
- **Preconditions & fixtures:** Web source.
- **Scenarios:**
  - GIVEN the web source WHEN audited THEN modules consume the store selection; no component keeps its own place state
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### GD-SPATIAL-02

- **Source:** S4 · GD-SPATIAL 2 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Single canonical implementations for coordinate handling (WGS84, GeoJSON `[lon, lat]` converted once per adapter at the parse boundary), distance (one haversine), distance display (German formatting), and time display (Europe/Berlin)."
- **Statement:** Coordinate handling, distance computation, distance display and time display each have exactly one canonical implementation; no module-private duplicates.
- **statement_sha256:** `60f7482bd937b93fe4e5b2eaf5e940c574657d4cd4f004f11f78daf7f7eddacf`
- **Interpretation:** distanceMeters in @invisible-city/evidence, formatDistanceGerman, formatBerlin; GeoJSON order converted once per adapter.
- **Preconditions & fixtures:** Source tree.
- **Scenarios:**
  - GIVEN the source WHEN scanned for duplicate haversine/format logic THEN only the canonical implementations exist; adapters import them
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### GD-SPATIAL-03

- **Source:** S4 · GD-SPATIAL 3 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Per-provider applicability rules (radius, containment, reference-location, region assignment) are explicit, documented in `docs/spatial-contract.md`, and domain-aware — never a bare "closest wins"."
- **Statement:** Every provider's nearby-data rule is explicit, documented in the spatial contract, and domain-aware.
- **statement_sha256:** `fffeb4e416ab11da147ad998ee16abfca685afe928a9f0af690065b888ea7ebc`
- **Interpretation:** The 15-row applicability table (DOC-SPATIAL-05 carries the row-level norms).
- **Preconditions & fixtures:** Spatial contract + adapters.
- **Scenarios:**
  - GIVEN each provider WHEN its spatial rule is compared with the doc table THEN code and table agree
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### GD-SPATIAL-04

- **Source:** S4 · GD-SPATIAL 4 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "A station/probe beyond 5 km is a "regionale Referenz", never a local value; distance is always shown."
- **Statement:** Beyond 5 km, stations/probes are 'regionale Referenz' with distance always shown — never a local value.
- **statement_sha256:** `a22539d11ba45b2f2d25ec803bfba37f7e950422b64bb2e10b35165ab5ca7d50`
- **Interpretation:** Twin of MP-3.1.D-07 from the user-directive side; applies to UBA AND ODL AND CDC/UV reference locations.
- **Preconditions & fixtures:** Distant-station fixtures.
- **Scenarios:**
  - GIVEN distant sources across UBA/ODL/CDC/UV WHEN rendered THEN role labelling + distance everywhere
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### GD-SPATIAL-05

- **Source:** S4 · GD-SPATIAL 5 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "No qualifying data ⇒ an honest `unavailable` with a German statusDetail that names the radius/rule — never a silent nearest-anyway substitution, never a fabricated local report."
- **Statement:** When nothing qualifies under a provider's spatial rule, the module returns unavailable with a German statusDetail naming the radius/rule — never nearest-anyway substitution.
- **statement_sha256:** `abe7af392ad433563f5efd280931574ecae248a8a83d2d71ca9f4e7c8a691637`
- **Interpretation:** E.g. 'Kein Pegel … im Umkreis von 30 km', 'Keine meldepflichtige Tankstelle im Umkreis von 5 km'.
- **Preconditions & fixtures:** Out-of-coverage fixtures.
- **Scenarios:**
  - GIVEN a place with no qualifying gauge/station/facility WHEN the module renders THEN unavailable + rule-naming German detail; no out-of-radius data
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### GD-SPATIAL-06

- **Source:** S4 · GD-SPATIAL 6 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Boundary behaviour (inside/at/beyond radius, rural, island, offshore, alpine, border) is defined and tested."
- **Statement:** Spatial boundary behaviour is defined and tested: inside/at/beyond radius plus rural, island, offshore, alpine and border reference points.
- **statement_sha256:** `e15c3f3d54a8d323797e3317dc97f88813d11b04092f2e4f4c47ff078a0d021b`
- **Interpretation:** The geographic edge-case catalogue (Eifel, Sylt, offshore 54.0/7.9, alpine 47.42/10.98, border 52.0/5.87).
- **Preconditions & fixtures:** Edge-point fixtures.
- **Scenarios:**
  - GIVEN the edge-point catalogue WHEN adapters run against it THEN each yields the documented honest outcome
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.B-02

- **Source:** S1 · §3.1.B · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Display time in Europe/Berlin; correct daylight-saving handling."
- **Statement:** All displayed times are Europe/Berlin with correct DST handling.
- **statement_sha256:** `e50b8c6805ea75e5bc2254f2a7d5edec327a24eeade6af3ef9618bb5c0f92c7e`
- **Interpretation:** formatBerlin is the single display path; DST boundaries verified by unit tests.
- **Preconditions & fixtures:** Time helpers.
- **Scenarios:**
  - GIVEN instants on both sides of a DST switch WHEN formatted THEN wall-clock output reflects the correct offset (+01:00/+02:00)
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.D-04

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Render as a visible raster/grid context; NEVER downscale or interpolate to a user address."
- **Statement:** CAMS renders as a visible raster/grid context and is never downscaled or interpolated to a user address.
- **statement_sha256:** `5ec48843daf0e06265040112c9fcc375bf95c64d421004cb9ecff6b444defdf0`
- **Interpretation:** Grid-cell value with centre offset (MP-2.2-03); map layer (when active) is raster/grid, no smooth surface.
- **Preconditions & fixtures:** CAMS extraction fixtures.
- **Scenarios:**
  - GIVEN an extracted CAMS value WHEN rendered THEN the spatial context is grid (~10 km) with the offset shown; no address-level presentation
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.D-07

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "a distant station is a regional reference, never local;"
- **Statement:** A distant air station (>5 km as implemented) is presented as a regional reference, never as local air quality.
- **statement_sha256:** `165bbb4567b335aaaf33f0baf589a584b8460a870d571b667e37b5933974dc6b`
- **Interpretation:** stationSpatialRole threshold 5 km (DOC-SPATIAL-04); ring marker + 'regionale Referenz' label.
- **Preconditions & fixtures:** Fixtures with distant stations (Eifel/Sylt patterns).
- **Scenarios:**
  - GIVEN nearest station 18 km away WHEN rendered THEN regional-reference labelling on card and map (ring), distance stated
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-6-02

- **Source:** S1 · §6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "type SpatialContext = | { kind: "station"; stationId: string; distanceMeters?: number; stationType?: string } | { kind: "grid"; resolutionKm?: number; gridId?: string } | { kind: "geometry"; geometryType: "point" | "line" | "polygon" } | { kind: "coverage"; description: string } | { kind: "unknown" };"
- **Statement:** SpatialContext is the discriminated union (station|grid|geometry|coverage|unknown) and every evidence record carries one.
- **statement_sha256:** `22bd3002d10b55f065d066548025265246ccecb8cd115fb40bd9b025cf115f1a`
- **Interpretation:** The spatial discriminator makes visual-precision honesty enforceable (§8.1).
- **Preconditions & fixtures:** Contracts + adapters.
- **Scenarios:**
  - GIVEN each adapter's evidence WHEN validated THEN spatial.kind is one of the five with the matching fields
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-8.1-01

- **Source:** S1 · §8.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Core rule: visual precision must NOT exceed data precision."
- **Statement:** Map visual precision never exceeds data precision: point data renders as points, grid data as cells, area data as areas — nothing implies finer resolution than the source.
- **statement_sha256:** `c6e003a7b7fde54e816b5a35a2d5e0a71f15f4afb4441942698ebbb82530922a`
- **Interpretation:** The umbrella rule concretized by §8.2–8.5; enforced through the SpatialContext discriminator + marker semantics.
- **Preconditions & fixtures:** Layer renders per spatial kind.
- **Scenarios:**
  - GIVEN each data kind on the map WHEN rendered THEN the visual form matches the spatial kind (marker/cell/polygon) — no smoothing, no upscaling
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-8.2-01

- **Source:** S1 · §8.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Air quality: station data = point markers only, no interpolation; CAMS = grid/raster, no smooth street-level heatmap;"
- **Statement:** Air stations render as point markers only (no interpolation); CAMS renders as grid/raster (no smooth street-level heatmap).
- **statement_sha256:** `322070cb7352ab6fd8542cf4f4d157faf902b1a20d81a9795224c27631c2b2d2`
- **Interpretation:** The air layers' render contract; ≤5 km circle vs >5 km ring per map-semantics.md.
- **Preconditions & fixtures:** Air layer fixtures.
- **Scenarios:**
  - GIVEN station values on the air layer WHEN rendered THEN individual point markers appear at station coordinates — no surface between them
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-8.2-02

- **Source:** S1 · §8.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "show uncertainty via legend/label/inspector/optional restrained transparency; never color the map as if each street had a measured value."
- **Statement:** Air-quality uncertainty is communicated via legend/label/inspector; the map is never colored as if each street had a measured value.
- **statement_sha256:** `f299083abf5ba4c87762c83becbb202931c91ce513acc6a26cda1dc1485cde4c`
- **Interpretation:** Legend + inspector carry the uncertainty communication; no street-resolution AQ paint.
- **Preconditions & fixtures:** Air layers.
- **Scenarios:**
  - GIVEN the air layer active WHEN viewed THEN the legend explains the point/grid semantics; streets carry no AQ coloring
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-8.3-01

- **Source:** S1 · §8.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Weather: show forecast/observation distinction; warnings are source-defined areas/events, not inferred local severity;"
- **Statement:** The weather layer keeps forecast/observation distinction visible; warnings render as source-defined areas/events without inferred local severity.
- **statement_sha256:** `60bfb32138af8e753d871d4fd843cef11b092cb2f946fe08ac50f25375b9e7b7`
- **Interpretation:** Warning polygons come from the WFS geometries; no local severity derivation.
- **Preconditions & fixtures:** Weather/warning fixtures.
- **Scenarios:**
  - GIVEN an active warning WHEN mapped THEN the source polygon renders with source severity attributes — nothing recomputed locally
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-8.3-02

- **Source:** S1 · §8.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "never imply a pin is a DWD measurement station."
- **Statement:** The selection pin is never implied to be a DWD measurement station.
- **statement_sha256:** `f43d3db4aa346029a06368807c4a9799547896c1a7a61e152cd17b3af4a510ea`
- **Interpretation:** The pin is the analysis point; weather values are forecast/observation for the area, and wording/marker semantics never call the pin a station.
- **Preconditions & fixtures:** Weather UI.
- **Scenarios:**
  - GIVEN weather values at a pin WHEN reviewed THEN no text/marker suggests a measuring station at the pin
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-8.4-01

- **Source:** S1 · §8.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Transit: stop markers show stop context; scheduled/realtime distinctions stay visible; missing realtime is neutral grey, not a failure; cluster dense stops/POIs."
- **Statement:** Transit stop markers show mapped stop context; scheduled/realtime stay visually distinct; missing realtime renders neutral grey (not failure-colored); dense stops/POIs cluster.
- **statement_sha256:** `de549317e34499286171650baf773f7020f670d80060043509dc9068c7cbf9ee`
- **Interpretation:** Neutral-absence styling is the §8.4 concretization of absence≠error.
- **Preconditions & fixtures:** Transit layer fixtures.
- **Scenarios:**
  - GIVEN stops without realtime coverage WHEN mapped THEN markers/status render neutral grey — not red/error styling
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-8.5-01

- **Source:** S1 · §8.5 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "POIs: contextual symbols only; green means "mapped context", not "good"; never infer openness, accessibility, safety or operating state."
- **Statement:** POIs render as contextual symbols; green signifies mapped context (not quality); openness/accessibility/safety/operating state are never inferred.
- **statement_sha256:** `2dbe6e1cf14d0f844efa3d98f08b5af5d88593f51b80bcc9b955558ddea60b71`
- **Interpretation:** Cross-ref MP-3.1.E-03; the color-semantics half is map-specific.
- **Preconditions & fixtures:** Places layer.
- **Scenarios:**
  - GIVEN the places layer WHEN viewed with its legend THEN the legend defines green as mapped context; no state-implying iconography
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

### Domain: Data truthfulness, evidence & wording (57)

#### DOC-DS-04

- **Source:** S3 · data-sources.md CDC semantics · `docs/data-sources.md`
- **Quote (verbatim, whitespace-normalized):** "a STATISTICAL REFERENCE for context ("is today unusual?") — never a current condition or forecast; the normals station may differ from the weather-module station (combine, never fuse — stated in the Evidence)."
- **Statement:** Climate normals render as a statistical reference only — never as current conditions; the potentially different normals station is stated (combine, never fuse).
- **statement_sha256:** `8b11a631a8ded3bc0c6babf9899bf810469891ccad330fdd928a624d41716f86`
- **Interpretation:** The reference-vs-current semantics rule for the CDC module.
- **Preconditions & fixtures:** CDC fixtures.
- **Scenarios:**
  - GIVEN normals beside live weather WHEN rendered THEN modes and stations stay distinct; no blended 'anomaly' value is computed
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### DOC-DS-05

- **Source:** S3 · data-sources.md emergency/health · `docs/data-sources.md`
- **Quote (verbatim, whitespace-normalized):** "a missing AED/hospital does **not** mean none exists — in an emergency, call 112."
- **Statement:** The emergency/health POI module explicitly states that missing AED/hospital data does not mean none exists and that 112 applies in emergencies; no availability or operating claims.
- **statement_sha256:** `2d858f4f4df9c59b655eddc0d5afd8c8e11a1847b80c16c536740f6683be5d58`
- **Interpretation:** The life-safety honesty clause for the Notfall & Gesundheit module (DEV-13).
- **Preconditions & fixtures:** Emergency-POI fixtures.
- **Scenarios:**
  - GIVEN the emergency module with zero mapped AEDs WHEN rendered THEN the completeness caveat + 112 note appear; no 'no AED here' claim
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-13

#### GD-TRUTH-01

- **Source:** S4 · GD-TRUTH 1 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "every displayed value traces to a real provider response, with provenance (provider, license, attribution, data mode, times, spatial relation, limitations) inspectable per value."
- **Statement:** Every displayed value traces to a real provider response with full per-value inspectable provenance.
- **statement_sha256:** `d2d33c0013aa3cf30b8fbf7b2300c9b7baa3ca8f944a6bd991438945ea704ae9`
- **Interpretation:** Twin of MP-3.1.H-01/02 + MP-6-04 from the directive side.
- **Preconditions & fixtures:** Any envelope.
- **Scenarios:**
  - GIVEN any value WHEN inspected THEN full provenance renders
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-0-03

- **Source:** S1 · §0 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Prefer an explicit, visible limitation over a plausible-looking but unverified output. A visible limitation is a SUCCESSFUL product outcome."
- **Statement:** Wherever data cannot be verified for the selected place/time, the product shows an explicit visible limitation instead of any plausible-looking unverified output.
- **statement_sha256:** `225c1c2019f22eb0e7de4e5d0ef9d9b1b6fde037744713fbbeb46d630dc14055`
- **Interpretation:** Product-wide design principle; concretized per module by the unavailable/configuration-required/source-error states (MP-3.1.J-*) and the no-data statusDetail rules (DOC-SPATIAL-*).
- **Preconditions & fixtures:** Module with an injected no-data condition.
- **Scenarios:**
  - GIVEN a place outside a provider's coverage (e.g. no gauge within 30 km) WHEN the module renders THEN a German limitation naming the rule is shown; no substitute value appears
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** partial

#### MP-1-01

- **Source:** S1 · §1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "The user selects a place and a time. The product combines only permitted, documented source interfaces"
- **Statement:** The core interaction is: select one German place and one time; the product then presents only permitted, documented source interfaces' data for that selection — weather/warnings (DWD), station air (UBA/Länder), optional CAMS background, mapped place context, transit availability, up to-three-place comparison, and per-claim provenance.
- **statement_sha256:** `d6daaf48c35fd1a392eb6894a27ac57125c37c1912f2e32aa5d82d5651347ddc`
- **Interpretation:** Umbrella product-scope requirement; each clause is concretized by §3.1 requirements. Tested end-to-end by the selection flow plus module rendering.
- **Preconditions & fixtures:** Demo mode for deterministic E2E; live mode for diagnose harness.
- **Scenarios:**
  - GIVEN the app is open WHEN the user searches a place, selects it and adjusts the time THEN all modules render data for exactly that place/time with provenance available per value
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-1-02

- **Source:** S1 · §1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Core product promise (German, keep verbatim): "Ein Ort. Ein Zeitpunkt. Eine Karte. Belastbare Datenquellen – mit sichtbaren Grenzen.""
- **Statement:** The German core promise "Ein Ort. Ein Zeitpunkt. Eine Karte. Belastbare Datenquellen – mit sichtbaren Grenzen." is kept verbatim in the product/documentation.
- **statement_sha256:** `c1f44772948c27d5b0d3750bf380e5225308b4ce4c3fe8c846cf886789a78397`
- **Interpretation:** Verbatim string must exist in the product charter and/or README (it does in both); optional in UI.
- **Preconditions & fixtures:** Repo checkout.
- **Scenarios:**
  - GIVEN the repository WHEN docs are scanned THEN the exact promise string is present
- **Verifiability:** deterministic
- **Risk:** severity 1 × likelihood 1 = 1 → **P3**
- **Verification status (see matrix):** planned

#### MP-2.1-01

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "The application is an INTEGRATION layer, not a replacement for DWD, UBA, CAMS, DELFI, transport operators, municipal portals, BKG, geocoding or map providers."
- **Statement:** The application integrates source data through documented, permitted technical interfaces and never positions itself as a replacement for the source institutions.
- **statement_sha256:** `9c64c3b595729e5e0e5d1375d6579a1905421f5de679b687b614ef703f1c5e7c`
- **Interpretation:** Every live data path goes through a documented interface listed in the provider manifest; product copy attributes institutions.
- **Preconditions & fixtures:** Provider manifest; adapter registry.
- **Scenarios:**
  - GIVEN any live data request WHEN traced THEN it targets a manifest-documented endpoint of the responsible institution
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-2.1-02

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "embed third-party dashboards as the main product experience (no iframes of foreign dashboards);"
- **Statement:** Never embed third-party dashboards as the product experience; no iframes of foreign dashboards exist in product code.
- **statement_sha256:** `14681d492e12cdc3a8788a33b90f5a358a0ae298c25b0afcbdb0f68fcf3d7b9f`
- **Interpretation:** Negative requirement — absence is the assertion.
- **Preconditions & fixtures:** Product source tree.
- **Scenarios:**
  - GIVEN the web source WHEN scanned for iframes THEN no iframe embeds a third-party dashboard
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** planned

#### MP-2.1-03

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "scrape visual dashboards, charts or undocumented endpoints;"
- **Statement:** Never scrape visual dashboards, charts or undocumented endpoints; every fetch targets a documented technical interface.
- **statement_sha256:** `3cebf79be2d71d60f57fab8fd2f041972476819892be3917e6fc014534926243`
- **Interpretation:** Enforced structurally: adapters only call manifest-documented endpoints; the Thru.de removal (DEV-07) is the precedent — when only scraping would work, the module is removed.
- **Preconditions & fixtures:** Adapter source; manifest.
- **Scenarios:**
  - GIVEN each adapter's endpoint WHEN checked against provider documentation THEN the endpoint is a documented API, not a UI/export scrape
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** partial

#### MP-2.1-04

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "copy source UI design, visualizations or copyrighted content;"
- **Statement:** Never copy a source's UI design, visualizations or copyrighted content.
- **statement_sha256:** `eed2f04ce51dd76a25a90936370b7fa7256946607bbe00f61c3f9303b903bdd5`
- **Interpretation:** Design-level negative requirement; not mechanically checkable.
- **Preconditions & fixtures:** Running app; source portals for reference.
- **Scenarios:**
  - GIVEN the product UI WHEN compared with source portals (DWD, UBA web UIs) THEN no copied layouts, charts or assets
- **Verifiability:** manual-rubric
- **Rubric:** Reviewer compares product UI against the major source portals: no copied visual assets, chart styles or layout clones.
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** manual-only

#### MP-2.1-05

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "use data when its license, attribution, permitted access or technical interface is unclear;"
- **Statement:** Never use data whose license, attribution, permitted access or technical interface is unclear; unclear aspects block activation (TO VERIFY) or keep the provider proposed.
- **statement_sha256:** `d7995e449e5bad67d84fe612a2db41898d647be2b1769f22f62558b0bf462a42`
- **Interpretation:** Implemented via manifest license/attribution fields (mandatory), the verified-status gate, and the BVL hard-off precedent (auth semantics unverified ⇒ no adapter).
- **Preconditions & fixtures:** Manifest.
- **Scenarios:**
  - GIVEN a provider with unverified auth semantics (BVL Lebensmittelwarnung) WHEN the API is called for its data THEN nothing is served; the manifest entry stays proposed with a hard-off gate
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-2.1-06

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "present a source as verified without a documented review;"
- **Statement:** A source is presented as verified only with a documented review (manifest review date + docs/data-sources.md entry).
- **statement_sha256:** `9db2a23f2e962c5a0e93e0928034ce2e24b06df0fe9f5837c1da0acf9da26719`
- **Interpretation:** Manifest entries carry reviewDate; data-sources.md documents each review incl. live-verification notes with dates.
- **Preconditions & fixtures:** Manifest.
- **Scenarios:**
  - GIVEN any verified provider WHEN its manifest entry is read THEN a review date exists and docs/data-sources.md documents the review
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-2.2-01

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Combine context side by side; never fuse incomparable inputs into scores, rankings or pseudo-precise local claims."
- **Statement:** The system shows several relevant data views side by side but never fuses non-equivalent data into scores, rankings or pseudo-precise local truths.
- **statement_sha256:** `07a063bbb089ff87069d5140fe8c8be7810c27f7911ab4b15abb653e2c63f861`
- **Interpretation:** Enforced by the comparability engine (observed↔observed etc.), the absence of any score/ranking computation, and per-value data-mode discriminators.
- **Preconditions & fixtures:** Comparison fixtures with mixed modes.
- **Scenarios:**
  - GIVEN an observed station value and a modelled grid value for one place WHEN displayed or compared THEN they remain separate entries with distinct modes; no merged 'local air value' exists
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-2.2-02

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "A UBA station observation is not the air quality at every nearby street."
- **Statement:** A UBA station observation is never presented as the air quality of surrounding streets: values are bound to the station with distance, and >5 km stations are labelled regional reference.
- **statement_sha256:** `f5a6cf69dbae6c2e3a33c47f1d253abafc774db6db45e50213f5d42cd8774396`
- **Interpretation:** Station values render as point-bound with name/distance; wording never claims local air from a station.
- **Preconditions & fixtures:** Air module fixtures incl. distant stations.
- **Scenarios:**
  - GIVEN the nearest station is 18 km away WHEN the air module renders THEN the value shows the station name and 18 km distance with the 'regionale Referenz' role — never as the place's air quality
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-2.2-03

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "A CAMS grid value (~10 km cell) is not an address-level concentration."
- **Statement:** A CAMS grid value is never rendered or transformed as an address-level concentration; it stays a ~10 km cell value with the cell/centre offset visible.
- **statement_sha256:** `eba6cf5afaf8c282a69b3e1855ead941d75020916f625a74158e1f0d0d2a29e4`
- **Interpretation:** The nearest-grid-cell extraction returns the cell value with centre offset; no downscaling/interpolation exists.
- **Preconditions & fixtures:** CAMS extraction fixtures (grid + point).
- **Scenarios:**
  - GIVEN a CAMS grid and a user point inside a cell WHEN the value is extracted THEN the cell value and the offset to the cell centre are returned — never an interpolated point value
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-2.2-04

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "A DWD MOSMIX forecast is not a measurement at a pin."
- **Statement:** Forecast values are always mode-discriminated 'forecast' and never presented as measurements at the selected pin.
- **statement_sha256:** `8d10955f789b80e785de8eb85f837b00f22b9fe652addf61c94c4fccb38f41c6`
- **Interpretation:** Per-hour data mode from the weather adapter; the UI chip distinguishes beobachtet/prognose; the pin is never implied to be a station (see MP-8.3-02).
- **Preconditions & fixtures:** Weather fixtures with observation+forecast hours.
- **Scenarios:**
  - GIVEN a weather timeline crossing now WHEN hours render THEN past hours are observed, future hours forecast, each with its chip — never unlabeled
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-2.2-05

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "A planned departure is not a real-time departure."
- **Statement:** Planned (scheduled) departures are always labelled 'scheduled'/Fahrplan and never rendered as real-time departures.
- **statement_sha256:** `bf7cd468de8de9b3d14fbf9b3b20fb572d7b425a30c037608d0e17c57059cebb`
- **Interpretation:** GTFS static output carries mode scheduled; realtime only from the GTFS-RT path with its own mode.
- **Preconditions & fixtures:** GTFS fixtures.
- **Scenarios:**
  - GIVEN scheduled departures for a stop WHEN rendered THEN each is labelled scheduled; no realtime implication
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-2.2-06

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Missing service alerts do not mean normal transit operation."
- **Statement:** The absence of service alerts or realtime updates is never presented as normal operation or 'no disruption'.
- **statement_sha256:** `e4511e35e0c92f243c77c03e7ea92c4c1eda1003a18c2da04f03489211d56696`
- **Interpretation:** Realtime coverage is partial; empty alert lists yield neutral coverage wording, never 'Keine Störung'.
- **Preconditions & fixtures:** GTFS-RT fixtures with zero alerts.
- **Scenarios:**
  - GIVEN no alerts in the RT feed for nearby stops WHEN the transit module renders THEN wording states partial coverage/no data — never normal service
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-2.2-07

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "A mapped park does not prove shade, cooling, opening, safety or accessibility."
- **Statement:** Mapped parks/green areas are rendered as mapped context only; no shade, cooling, opening, safety or accessibility claim is derived from geometry.
- **statement_sha256:** `85ffcf4d004ae71e884d10ae4fb7bdc3c710fec3c3f4a62c0a053030e6beb64a`
- **Interpretation:** POI limitations state 'mapped context'; wording deny-list covers 'Schatten vorhanden'/'Kühlort'.
- **Preconditions & fixtures:** POI fixtures with park geometry.
- **Scenarios:**
  - GIVEN a mapped park near the selection WHEN rendered THEN it is labelled kartierter Kontext with completeness disclaimer; no derived amenity claims
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-2.2-08

- **Source:** S1 · §2.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "A mapped toilet or drinking-water point does not prove it is open or operating."
- **Statement:** Mapped toilets/drinking-water points carry no open/operating claim; operational status is never inferred from map presence.
- **statement_sha256:** `7c3b10186b322f71cbb5c84a850773b840eb099be9574d9dca65b7c10c0165e0`
- **Interpretation:** Same mechanism as MP-2.2-07 for these POI categories.
- **Preconditions & fixtures:** POI fixtures.
- **Scenarios:**
  - GIVEN a mapped drinking-water point WHEN rendered THEN mapped-context label only; no operating-state text
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-2.3-01

- **Source:** S1 · §2.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Prefer "Not available for this place or time" over a weak proxy, a generic estimate, a visually persuasive but unsupported map, a hidden provider fallback, or a universal score."
- **Statement:** Non-availability is stated explicitly for the selected place/time; the product never substitutes a weak proxy, generic estimate, unsupported visualization, hidden fallback or universal score.
- **statement_sha256:** `42f49faf0fcfdde102ee1137012e525fa8dd23f0be9570896fd12aa516f4378e`
- **Interpretation:** The rendered form is the German unavailable statusDetail per module (radius/rule named). Overlaps MP-0-03; kept separate because §2.3 also bans persuasive-map substitutes (map semantics oracle).
- **Preconditions & fixtures:** No-data fixtures per module.
- **Scenarios:**
  - GIVEN no qualifying data for a module WHEN it renders THEN an explicit German non-availability message appears; the map draws nothing implying data
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** partial

#### MP-2.4-01

- **Source:** S1 · §2.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Every source-backed output MUST identify its data mode: observed | forecast | modelled | mapped | scheduled | realtime | partial | cached | unavailable | demo."
- **Statement:** Every source-backed output identifies its data mode from the closed ten-value enum (observed, forecast, modelled, mapped, scheduled, realtime, partial, cached, unavailable, demo).
- **statement_sha256:** `48ff8a94bbdf5d664c5cf14cab872cb18a20e1f474ad7f4466322c835c069242`
- **Interpretation:** The DataMode type is the contract (MP-6-01); this requirement is the UI/API obligation that no value ships without one. As-built extension: DEV-08 documents that the 'reported' mode was added then removed with Thru.de — the enum is back to the canonical ten.
- **Preconditions & fixtures:** Contracts package; any module envelope.
- **Scenarios:**
  - GIVEN any rendered value WHEN inspected THEN a data-mode chip/evidence mode from the enum is attached
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-08

#### MP-3.1.B-03

- **Source:** S1 · §3.1.B · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Every module declares whether it supports the selected time and distinguishes data time, validity time, retrieval time and cache age."
- **Statement:** Every module declares selected-time support and distinguishes the four times: data time, validity time, retrieval time, cache age.
- **statement_sha256:** `8eaa292db79b684edadd73942a8f66c7f22f1559cfc10203a8556dc6880219a6`
- **Interpretation:** Evidence carries observedAt/validAt/forecastIssuedAt/publishedAt/retrievedAt/cacheAgeSeconds; the inspector renders them distinctly.
- **Preconditions & fixtures:** Evidence records; inspector.
- **Scenarios:**
  - GIVEN a cached forecast value WHEN inspected THEN issue time, valid time, retrieval time and cache age appear as distinct fields
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.C-05

- **Source:** S1 · §3.1.C · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "State whether a value is observed, forecast or unavailable."
- **Statement:** Every weather value states observed, forecast or unavailable — the three are never conflated.
- **statement_sha256:** `017546dafb22fd7e2ac3bf58e1f14003480b01c07269f860ca39cfed5fe27bfd`
- **Interpretation:** Per-hour/per-value mode; unavailable renders as an explicit state, not a blank.
- **Preconditions & fixtures:** Mixed-mode weather fixtures.
- **Scenarios:**
  - GIVEN a timeline with observation, forecast and a gap WHEN rendered THEN each value carries its mode; the gap renders unavailable
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.C-06

- **Source:** S1 · §3.1.C · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Preserve DWD attribution (see Source Governance §5.4). Do NOT create local microclimate, street-temperature or shade claims."
- **Statement:** DWD attribution is preserved on weather displays, and no local microclimate, street-temperature or shade claim is created.
- **statement_sha256:** `8c18da9d30924b37036f5ac060f9a5fb03ba92c7e8c2ca642189db4d5a3ab1d9`
- **Interpretation:** Attribution from manifest (Quelle: Deutscher Wetterdienst); deny-list wording covers microclimate/shade claims.
- **Preconditions & fixtures:** Weather UI; governance scan.
- **Scenarios:**
  - GIVEN weather values on screen WHEN evidence is inspected THEN DWD attribution is present; nowhere does the UI claim street-level or shade conditions
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.D-06

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "never merge station and model into one "local air value"; compare observed with observed and modelled with modelled only when time/pollutants/context are comparable"
- **Statement:** Station observations and model values are never merged into one local air value; comparisons pair observed with observed and modelled with modelled only, under comparable time/pollutant/context.
- **statement_sha256:** `b7da27f40a290ac4f72c51acc64caa9bc3eb645659a6c044b53bbaf7372c0317`
- **Interpretation:** The comparability engine implements this; the two air layers are separate modules and map layers.
- **Preconditions & fixtures:** Comparability fixtures.
- **Scenarios:**
  - GIVEN a station PM2.5 and a CAMS PM2.5 for one place WHEN compared THEN the pair is rejected with a German reason; both remain visible side by side
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.D-08

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "no "clean-air walk", routing, exposure calculation, health conclusion or "safest air" claim."
- **Statement:** The product contains no clean-air-walk, routing, exposure calculation, health conclusion or safest-air feature or claim.
- **statement_sha256:** `cd845ecdefbab46ca5777e96c47cea17068279a9f5c725e7c7ff90a7e03db710`
- **Interpretation:** Negative requirement; wording scan + absence of routing/exposure code.
- **Preconditions & fixtures:** Product source.
- **Scenarios:**
  - GIVEN the full UI WHEN scanned THEN no such feature or wording exists
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.D-09

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "If only a model is present, label it "regionaler modellierter Hintergrund"."
- **Statement:** When only model data (no station observation) is present, it is labelled 'regionaler modellierter Hintergrund'.
- **statement_sha256:** `fc174c6f4aa0ef2ff9926ab48d9c9039c0a902d3bbb2d398e3a33f4726093e18`
- **Interpretation:** Applies once CAMS is active; the label is the allowed §9 phrase.
- **Preconditions & fixtures:** CAMS active, no station in range (fixture).
- **Scenarios:**
  - GIVEN model-only air data WHEN rendered THEN the exact German label appears
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** planned

#### MP-3.1.E-03

- **Source:** S1 · §3.1.E · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "POIs are supplementary cartographic context, NOT operational guarantees. Do not show opening hours, accessibility, operating status, safety, shade, cooling or availability unless a separate verified local source explicitly supports the exact claim."
- **Statement:** POIs are supplementary cartographic context; opening hours, accessibility, operating status, safety, shade, cooling or availability are never shown without a separate verified local source.
- **statement_sha256:** `95bf72bd917314ed4c977a1211733db4ab95300935dbaa1d2b87c2edda822b6b`
- **Interpretation:** No such verified local source exists in V1 ⇒ none of these attributes may appear anywhere.
- **Preconditions & fixtures:** POI renders.
- **Scenarios:**
  - GIVEN any POI display WHEN reviewed THEN no operational attribute appears
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.F-05

- **Source:** S1 · §3.1.F · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Status is one of: confirmed | partial | not-covered | unknown | temporarily-unavailable. Show feed age, operator, coverage, limitations. Do NOT infer "no disruption" from missing data."
- **Statement:** Transit realtime status uses the closed five-value coverage enum with feed age/operator/coverage/limitations shown, and 'no disruption' is never inferred from missing data.
- **statement_sha256:** `2b20381b3ab4ee20fca9cf6ad89945bf8d9a0304bc7e0c65154d05ad4ae2ccdb`
- **Interpretation:** TransitCoverage enum (MP-6-06); overlaps MP-2.2-06 for the inference ban — kept for the enum + metadata obligations.
- **Preconditions & fixtures:** RT fixtures incl. empty feeds.
- **Scenarios:**
  - GIVEN an empty RT feed WHEN rendered THEN coverage-enum value + neutral wording; feed age shown; no normal-service claim
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.F-06

- **Source:** S1 · §3.1.F · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "V1 EXCLUDES: nationwide routing; universal departure boards; reliability scores; arrival/punctuality predictions; "good/bad transit" ratings; universal accessibility or lift-outage coverage; any assertion that "no alert" means normal service."
- **Statement:** V1 contains no nationwide routing, universal departure boards, reliability scores, punctuality predictions, transit ratings, universal accessibility/lift-outage coverage, or no-alert-means-normal assertions.
- **statement_sha256:** `beeefdd7e17eca0b0f339b3396876eb67410fd76eec72e812847b9be0e8a6881`
- **Interpretation:** Negative feature list. Note: DB FaSta (DEV-12) shows PER-STATION elevator status within 3 km — explicitly NOT universal coverage; its honest UNKNOWN semantics keep it inside this rule.
- **Preconditions & fixtures:** Product source; transit UI.
- **Scenarios:**
  - GIVEN the full transit UI WHEN reviewed THEN none of the excluded features exists; FaSta renders as local facility status, not universal coverage
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-12

#### MP-3.1.H-01

- **Source:** S1 · §3.1.H · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Evidence Inspector — for every material value, layer, comparison and derived display:"
- **Statement:** An Evidence Inspector exists and is reachable for every material value, layer, comparison and derived display.
- **statement_sha256:** `68eda59daed8bbf52c3e192fb026a57919580191749bc1a6e6d16764c9e42fce`
- **Interpretation:** Every value row exposes an inspect affordance opening the inspector for that value's evidence.
- **Preconditions & fixtures:** Any module with values.
- **Scenarios:**
  - GIVEN a rendered value WHEN the user activates its inspect control THEN the inspector opens showing that value's evidence
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.H-02

- **Source:** S1 · §3.1.H · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "value & unit; source provider & responsible institution; source URL/identifier; source category; data mode; method description; observation/forecast/publication/validity/ retrieval time as relevant; cache age & expiry; spatial relation (point station + distance; raster/grid resolution; polygon/geometry; provider coverage); completeness/provisional status; limitations; license & attribution requirements; original-source or methodology link where safe and permitted."
- **Statement:** The Evidence Inspector renders the complete field set: value/unit, provider/institution, source URL, category, mode, method, relevant times, cache age, spatial relation, completeness, limitations, license/attribution, original-source link where permitted.
- **statement_sha256:** `a6d5faf267e07d97009e2e0a505a40fa9a5f85e8826e69ecffc52c72de5ee294`
- **Interpretation:** Field-completeness contract of the inspector UI over the Evidence record.
- **Preconditions & fixtures:** Evidence fixtures covering station + grid spatial kinds.
- **Scenarios:**
  - GIVEN a station-based and a grid-based evidence record WHEN inspected THEN all applicable fields render, including the correct spatial form (distance vs resolution)
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.2-01

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "street-level shade maps;"
- **Statement:** V1 contains no street-level shade maps (neither implemented, promised, nor simulated).
- **statement_sha256:** `49c94137730dfc2a3493126c54e162e979fce62af7372574ed6e5c86e20ffa78`
- **Interpretation:** Negative feature requirement from the §3.2 exclusion list; the list is prefixed 'do not implement/promise/simulate as Germany-wide V1'.
- **Preconditions & fixtures:** Product source + UI.
- **Scenarios:**
  - GIVEN the full product WHEN reviewed for the feature THEN it does not exist and is nowhere promised
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 1 = 4 → **P3**
- **Verification status (see matrix):** covered

#### MP-3.2-02

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "tree-canopy/cooling/microclimate maps;"
- **Statement:** V1 contains no tree-canopy, cooling or microclimate maps.
- **statement_sha256:** `8313270be570c6599dfa7e805d4ed3d9cda852e6875fbf4de3c93162fd11a553`
- **Interpretation:** Exclusion-list negative.
- **Preconditions & fixtures:** Product source + UI.
- **Scenarios:**
  - GIVEN the product WHEN reviewed THEN no such map/module exists or is promised
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 1 = 4 → **P3**
- **Verification status (see matrix):** covered

#### MP-3.2-03

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "nationwide cooling-place coverage;"
- **Statement:** V1 claims no nationwide cooling-place coverage.
- **statement_sha256:** `8841a256b2939c49c1c69d456bce75c5b80a95b38b80208e18c87db0fb650ce2`
- **Interpretation:** Exclusion-list negative; 'Kühlort' is deny-listed wording (MP-9-08).
- **Preconditions & fixtures:** Product source + UI.
- **Scenarios:**
  - GIVEN the product WHEN reviewed THEN no cooling-place feature/claim exists
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 1 = 4 → **P3**
- **Verification status (see matrix):** covered

#### MP-3.2-04

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "street-level air pollution; local exposure estimates; air-quality walking routes;"
- **Statement:** V1 contains no street-level air-pollution rendering, no local exposure estimates and no air-quality walking routes.
- **statement_sha256:** `7b8e329a72be9fdef42633d1d261dbd1ca4e38925928be8ea484963620163a63`
- **Interpretation:** Three related exclusion items bundled (same mechanism, same oracle); cross-ref MP-3.1.D-08 and MP-8.2-01.
- **Preconditions & fixtures:** Product source + UI.
- **Scenarios:**
  - GIVEN the air features WHEN reviewed THEN point/grid semantics only; no street surfaces, exposure numbers or routes
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 1 = 5 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.2-05

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "citywide heat-escape routes;"
- **Statement:** V1 contains no citywide heat-escape routes.
- **statement_sha256:** `db8e72ce7cd208ac1cc290f9bfc5489e32cd78b090bb58f1735a2df1a6101f9e`
- **Interpretation:** Exclusion-list negative.
- **Preconditions & fixtures:** Product source + UI.
- **Scenarios:**
  - GIVEN the product WHEN reviewed THEN no such feature
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** manual-only

#### MP-3.2-06

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "universal toilet/drinking-water operational status; universal opening hours;"
- **Statement:** V1 claims no universal toilet/drinking-water operational status and no universal opening hours.
- **statement_sha256:** `f739a5dc1c27ba11b1e708e2b17641686667eae8601ce7f8fad0fcbb9981fcd6`
- **Interpretation:** Cross-ref MP-3.1.E-03 (positive-side rule).
- **Preconditions & fixtures:** POI renders.
- **Scenarios:**
  - GIVEN POI displays WHEN reviewed THEN no operational status or opening hours anywhere
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 1 = 4 → **P3**
- **Verification status (see matrix):** covered

#### MP-3.2-07

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "safety/crime/"safe-at-night" evaluations;"
- **Statement:** V1 contains no safety, crime or safe-at-night evaluations.
- **statement_sha256:** `5d6c90a3ff49fbab2c46aed421c2be1a14ad9a48655413b7f6adce48a8fa31c5`
- **Interpretation:** 'Sicherer Ort' is deny-listed (MP-9-06).
- **Preconditions & fixtures:** Product source + UI.
- **Scenarios:**
  - GIVEN the product WHEN reviewed THEN no safety evaluation exists
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 1 = 5 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.2-08

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "universal transit realtime/alerts/accessibility/lift outages; nationwide transit routing; transit reliability/quality scoring;"
- **Statement:** V1 claims no universal transit realtime/alerts/accessibility/lift-outage coverage, no nationwide routing, no reliability/quality scoring.
- **statement_sha256:** `61b082b41772a59e2d0d9bf11db399d08a61556236ae8f0512ad1abd504fc033`
- **Interpretation:** Cross-ref MP-3.1.F-06; DB FaSta remains per-station local status (DEV-12), not universal coverage.
- **Preconditions & fixtures:** Transit UI.
- **Scenarios:**
  - GIVEN transit features WHEN reviewed THEN coverage-scoped honesty only; none of the excluded claims
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 1 = 4 → **P3**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-12

#### MP-3.2-09

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "municipal roadworks/parking/events/sensor coverage; municipality ranking pages;"
- **Statement:** V1 contains no municipal roadworks/parking/events/sensor coverage and no municipality ranking pages.
- **statement_sha256:** `624e704da06a896d12439eb6639c613cc09ae11c782822a938a0c6cffadd5380`
- **Interpretation:** Autobahn roadworks (DEV-11) are FEDERAL MOTORWAY events, a different, documented scope — not municipal roadworks; the deviation register adjudicates this as non-conflicting.
- **Preconditions & fixtures:** Product source + UI.
- **Scenarios:**
  - GIVEN the product WHEN reviewed THEN no municipal-coverage module and no ranking page exist; Autobahn module states motorway-only scope
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-11

#### MP-3.2-10

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "quality-of-life/comfort/health/smart-city scores;"
- **Statement:** V1 computes no quality-of-life, comfort, health or smart-city scores.
- **statement_sha256:** `6c14985eb84b332fc3190fc939d8dde15d8ea6f3211fde559a965215ab3eb752`
- **Interpretation:** Cross-ref MP-3.1.G-04 (no comparison score) — this bans scores anywhere, not just in comparison.
- **Preconditions & fixtures:** Product source.
- **Scenarios:**
  - GIVEN the product WHEN reviewed THEN no composite score of any kind exists
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 1 = 5 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.2-11

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "generated values to fill a source-data gap; unverified third-party integrations;"
- **Statement:** V1 generates no values to fill source-data gaps and integrates no unverified third parties.
- **statement_sha256:** `6724a50cb2f8e1cdcd09e0038bb969de131ff978bff611ea3ef0e87ad90546eb`
- **Interpretation:** Cross-ref MP-2.1-07 (no invented values) and MP-5.2-02 (verified gate) — restated here as V1-scope exclusions.
- **Preconditions & fixtures:** Adapters; manifest.
- **Scenarios:**
  - GIVEN any gap in source data WHEN rendered THEN the gap remains visible; only manifest-verified providers serve
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.3-02

- **Source:** S1 · §3.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Never generalize a local capability into a Germany-wide claim."
- **Statement:** A local capability is never generalized into a Germany-wide claim; coverage boundaries stay explicit.
- **statement_sha256:** `0d8c3122d216f4c43e294fc646d4099c70955d559055ca2071ad35a883279dd8`
- **Interpretation:** Coverage descriptions + out-of-area non-availability wording enforce this (e.g. PEGELONLINE federal-waterways-only, Autobahn motorways-only).
- **Preconditions & fixtures:** Coverage-bounded providers.
- **Scenarios:**
  - GIVEN a place outside a provider's coverage WHEN rendered THEN explicit non-availability naming the coverage — no implied Germany-wide capability
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-5.2-02

- **Source:** S1 · §5.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Only "verified" providers may serve live production responses."
- **Statement:** Only providers with effective status verified serve live production responses; the runner refuses all others.
- **statement_sha256:** `2183572cec2fb217cd3957604dcebe777993fe80b80f13845aba895064271e67`
- **Interpretation:** getEffectiveProvider resolves status from config (DEV-05: keyless=verified, credentialed=proposed until configured); the runner throws → configuration-required for non-verified.
- **Preconditions & fixtures:** Runner + config.
- **Scenarios:**
  - GIVEN a proposed provider WHEN a live response is requested THEN the runner refuses; the API returns configuration-required
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-05

#### MP-6-01

- **Source:** S1 · §6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "type DataMode = "observed" | "forecast" | "modelled" | "mapped" | "scheduled" | "realtime" | "partial" | "cached" | "unavailable" | "demo";"
- **Statement:** The DataMode contract is the closed ten-value union exactly as specified; no ad-hoc modes exist.
- **statement_sha256:** `b7dafe440476d9cbb72dd71e539db2e00af3b99e14399f37f0f22340f69c6b6b`
- **Interpretation:** Zod enum in packages/contracts. DEV-08: 'reported' was temporarily added (Thru.de) and removed again — current state matches the canonical ten.
- **Preconditions & fixtures:** Contracts package.
- **Scenarios:**
  - GIVEN the contracts package WHEN the DataMode schema validates values THEN exactly the ten values pass; anything else is rejected
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-08

#### MP-6-03

- **Source:** S1 · §6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "type Evidence = { providerId: string; providerName: string; institution: string; sourceUrl?: string; license?: string; attribution?: string; mode: DataMode; method: string;"
- **Statement:** The Evidence record implements the specified shape (identity, license/attribution, mode, method, times, spatial, completeness, limitations, schemaVersion) and is Zod-validated on construction.
- **statement_sha256:** `3925b64e9c78fb4e397e22f1fbb97f180813c18f5968cebff5bb9926b0150609`
- **Interpretation:** As built adds sourceTimeRaw (documented in evidence-policy.md) — an additive extension (DEV-09).
- **Preconditions & fixtures:** Evidence package.
- **Scenarios:**
  - GIVEN makeEvidence input WHEN constructed THEN an invalid record throws (dev); all fields land as specified
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-09

#### MP-6-04

- **Source:** S1 · §6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "type EvidenceValue<T> = { value: T | null; unit?: string; status: "available" | "partial" | "stale" | "unavailable" | "error" | "demo"; evidence: Evidence[]; };"
- **Statement:** Every material value ships as EvidenceValue: nullable value, unit, closed status enum, attached evidence array.
- **statement_sha256:** `2276b091f8d33f2b07fbb6e306079fa41900aa394da77f75efc018c921768b9b`
- **Interpretation:** The envelope/value wrapper contract; value null pairs with non-available status.
- **Preconditions & fixtures:** Contracts.
- **Scenarios:**
  - GIVEN any module payload WHEN validated THEN values conform to EvidenceValue with evidence attached
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-6-07

- **Source:** S1 · §6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Rules: do not remove evidence during normalization; do not transform incompatible source modes into the same field without a mode discriminator; do not return a numeric default for unavailable data; all API responses expose source status and limitations."
- **Statement:** Normalization never removes evidence, never merges incompatible modes without a discriminator, never returns numeric defaults for unavailable data; every API response exposes source status and limitations.
- **statement_sha256:** `ede8f0132950c9bf39db182f741cbe849922ecad259fcef86d39af751fbd35e8`
- **Interpretation:** The four §6 rules as one enforcement bundle (each has its own oracle).
- **Preconditions & fixtures:** Adapters + API.
- **Scenarios:**
  - GIVEN a value with N limitations from manifest + call WHEN normalized THEN all limitations survive
  - GIVEN an unavailable metric WHEN serialized THEN value null — never 0 or NaN placeholder
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-9-01

- **Source:** S1 · §9 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "WORDING POLICY (careful German UI language — keep in German)"
- **Statement:** UI language is careful German; the §9 allowed vocabulary ('Prognose', 'Gemessen an Station …', 'Regional modellierter Hintergrund', 'Kartierter Kontext', 'Fahrplan verfügbar', 'Echtzeit teilweise abgedeckt', 'Keine verifizierten Daten verfügbar', 'Für diesen Vergleich nicht ausreichend vergleichbar') is the approved phrasing set and passes the wording guard.
- **statement_sha256:** `9f1e2f15b32191accaf8706e909ac3d33ce22b4d6c72a6f3b690847d741d501b`
- **Interpretation:** One requirement for the allow side: approved phrases must not be flagged by the deny scanner (false-positive guard) and UI status wording is German.
- **Preconditions & fixtures:** Wording helpers.
- **Scenarios:**
  - GIVEN the allowed phrases WHEN run through the wording guard THEN none is flagged; UI statusDetails are German
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-9-02

- **Source:** S1 · §9 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Disallowed: "Hier ist die Luft sauber"; "Sauberster Spaziergang"; "Die beste Gegend"; "Der zuverlässigste ÖPNV";"
- **Statement:** The absolute-claim phrases (clean-air-here, cleanest walk, best area, most reliable transit) never ship in product source or rendered output.
- **statement_sha256:** `d865b1d33945a9a21e452eed505dbc24093c629f8cc5455c0f0dd122e2aafe51`
- **Interpretation:** Deny-list scan over all product source (governance test) + runtime wording guard.
- **Preconditions & fixtures:** Governance scan.
- **Scenarios:**
  - GIVEN all product source WHEN scanned THEN none of these phrases (or trivial variants) appears
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 1 = 5 → **P2**
- **Verification status (see matrix):** covered

#### MP-9-03

- **Source:** S1 · §9 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** ""Keine Störung" (when coverage is absent);"
- **Statement:** 'Keine Störung' is never rendered when realtime coverage is absent.
- **statement_sha256:** `ec45e652eddabe7e9686555a9c94b25c8bd18765ec6107951f4065dbe5d7ab2a`
- **Interpretation:** Context-conditional ban — the phrase is forbidden exactly when it would over-claim (coverage absent).
- **Preconditions & fixtures:** RT-absent fixtures.
- **Scenarios:**
  - GIVEN no realtime coverage WHEN transit renders THEN no 'Keine Störung' text appears
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-9-04

- **Source:** S1 · §9 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** ""Sicherer Ort"; "Schatten vorhanden" (from park geometry); "Kühlort" (without verified local source);"
- **Statement:** Safety/shade/cooling claims ('Sicherer Ort', 'Schatten vorhanden' from geometry, 'Kühlort' without verified source) never ship.
- **statement_sha256:** `5443468f3d56afc589652eec81782118b66ad683fdd576c7c6399ed9dcc7f08f`
- **Interpretation:** Deny-list items; V1 has no verified source that could ever justify them.
- **Preconditions & fixtures:** Governance scan.
- **Scenarios:**
  - GIVEN product source WHEN scanned THEN no such claim exists
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 1 = 5 → **P2**
- **Verification status (see matrix):** covered

#### MP-9-05

- **Source:** S1 · §9 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** ""Live" (for cached/scheduled data); "Exakter Wert am Standort" (for a grid/station proxy)."
- **Statement:** 'Live' is never used for cached/scheduled data and 'Exakter Wert am Standort' never for grid/station proxies.
- **statement_sha256:** `6e9bd9a273b95cea1dc1b2544eee75d2b8146078166e18dcf0bdcc5e9e028bf9`
- **Interpretation:** Mode-conditional wording bans, enforced by the wording helper with mode context.
- **Preconditions & fixtures:** Wording helpers with mode input.
- **Scenarios:**
  - GIVEN a cached value WHEN labelled THEN 'Live' is rejected
  - GIVEN a station/grid value WHEN labelled THEN exact-at-location phrasing is rejected
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-FIN-01

- **Source:** S1 · Final instruction · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Do not emulate omniscience. Do not fill gaps with plausible-looking output. A visible limitation is a successful product outcome when it truthfully describes what can and cannot be known for the chosen place and time."
- **Statement:** The product never emulates omniscience or fills gaps with plausible output; visible limitations are treated as successful outcomes.
- **statement_sha256:** `5731ae2bdb98d3ea926691c344d3cc40942a11966ea0546d25efa4de9ee98cc0`
- **Interpretation:** Philosophical umbrella over MP-0-03/MP-2.3-01; no separate oracle — verified through its concretizations.
- **Preconditions & fixtures:** —
- **Scenarios:**
  - GIVEN the concretized requirements WHEN they pass THEN this umbrella holds
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-PRE-03

- **Source:** S1 · Preamble · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "The application does NOT create, simulate, interpolate, scrape, invent, silently repair or claim ownership of weather, air-quality, transit or municipal data."
- **Statement:** The application never creates, simulates, interpolates, scrapes, invents, silently repairs, or claims ownership of source data; it is exclusively an integration, evidence and comparison layer.
- **statement_sha256:** `5ee4e485bd4a8ca2b1aae25bfe9e2f9d2306676a3473b5391f4696227b685662`
- **Interpretation:** Umbrella truthfulness norm; concretized by MP-2.1-* and MP-2.2-*. Deterministic slices: no value synthesis on provider failure (adapters return null + status), no interpolation code paths, attribution always names the source institution.
- **Preconditions & fixtures:** Adapter test fixtures with failing/absent providers.
- **Scenarios:**
  - GIVEN a provider returns an error or empty data WHEN the module envelope is produced THEN data is null with an honest status — no synthesized, interpolated or repaired value appears
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

### Domain: Provider behaviour (per provider) (38)

#### DOC-DS-01

- **Source:** S3 · data-sources.md Overpass · `docs/data-sources.md`
- **Quote (verbatim, whitespace-normalized):** "the adapter tries the public mirror `overpass.kumi.systems` ONCE (same API, same OSM data, own per-host serialization; `OVERPASS_FALLBACK_URL`, empty disables). Both limited → honest source-error, unchanged."
- **Statement:** The Overpass mirror fallback fires at most once, targets the documented mirror with its own per-host serialization, is config-disableable, and both-limited still yields an honest source-error.
- **statement_sha256:** `5a02c193723286f8f898439a87566456f8193943ae51e72e66f80f8a6b52c518`
- **Interpretation:** The documented-substitution policy that keeps MP-2.1-08 satisfied.
- **Preconditions & fixtures:** Throttling fixtures.
- **Scenarios:**
  - GIVEN primary 429 and mirror 429 WHEN the adapter runs THEN source-error — no third host, no loop
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-14

#### DOC-DS-02

- **Source:** S3 · data-sources.md ODL · `docs/data-sources.md`
- **Quote (verbatim, whitespace-normalized):** "The FULL layer (~1,700 probes) is fetched and cached once (15 min); nearest probes are selected locally — this sidesteps WFS bbox axis-order pitfalls entirely."
- **Statement:** ODL fetches the full national probe layer once per TTL and selects nearest probes locally (shared national snapshot pattern; same pattern as Autobahn's aggregated snapshot).
- **statement_sha256:** `9dc05d012bee497f994b1f9893f295310675b67d009a752ab93038df70ace0a1`
- **Interpretation:** The national-snapshot caching pattern — one shared fetch serving all places, distance-filtered locally.
- **Preconditions & fixtures:** ODL/Autobahn fixtures.
- **Scenarios:**
  - GIVEN two places queried in one TTL window WHEN ODL serves both THEN one upstream fetch backs both responses
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### DOC-DS-03

- **Source:** S3 · data-sources.md CDC · `docs/data-sources.md`
- **Quote (verbatim, whitespace-normalized):** "The adapter reads the directory autoindex first and resolves the actual station-list/value-table names per parameter by pattern — unresolvable files stay an honest source-error, never a guessed URL."
- **Statement:** CDC normals filenames are discovered via the directory autoindex; unresolvable files yield source-error, never guessed URLs.
- **statement_sha256:** `56d55cac088ad869ab09327c48b190264dec50353c28f1ca5f2e24614cb3a0f5`
- **Interpretation:** The live-verified fix for CDC filename drift.
- **Preconditions & fixtures:** Autoindex fixtures incl. drifted names.
- **Scenarios:**
  - GIVEN a drifted CDC filename WHEN discovery runs THEN the actual name resolves via pattern; a missing pattern yields source-error
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-21

#### GD-DBTK-01

- **Source:** S4 · GD-DBTK 1-2 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Both activate automatically the moment their credentials appear in the local `.env`; until then the API returns an honest `configuration-required` envelope naming the exact variable(s); all other modules keep working."
- **Statement:** DB FaSta and Tankerkönig are full adapters behind the shared contract, auto-activating from .env credentials; unconfigured they return configuration-required naming the exact variables; other modules unaffected.
- **statement_sha256:** `c46a436600ce12ec4e83e618ca32473bf8d0a7bd0511ba124dbf378628e3c48d`
- **Interpretation:** TANKERKOENIG_API_KEY; DB_CLIENT_ID + DB_API_KEY (both required).
- **Preconditions & fixtures:** No credentials configured.
- **Scenarios:**
  - GIVEN no keys WHEN both modules are requested THEN configuration-required naming the exact variables; all other modules serve normally
  - GIVEN keys in .env WHEN the server starts THEN both providers resolve verified and serve live data
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-12

#### GD-DBTK-02

- **Source:** S4 · GD-DBTK 3 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "FaSta: facilities within 3 km with real distances; `UNKNOWN` state is rendered as "not determinable", never as "working"; no timetable claims."
- **Statement:** FaSta shows facilities within 3 km with real distances; UNKNOWN renders as 'Zustand nicht ermittelbar' (never as working); no timetable claims derive from FaSta data.
- **statement_sha256:** `3b0f592855ec89d0a9314d3338e2cf106c70833463cb98c9b5a18b6633ca1f16`
- **Interpretation:** The UNKNOWN-semantics honesty rule is the safety-critical clause.
- **Preconditions & fixtures:** FaSta fixtures with ACTIVE/INACTIVE/UNKNOWN.
- **Scenarios:**
  - GIVEN an UNKNOWN elevator WHEN rendered THEN the not-determinable wording appears with the explicit does-not-mean-functioning note
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### GD-DBTK-03

- **Source:** S4 · GD-DBTK 4 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Tankerkönig: stations within 5 km with distances; documented `false` prices become `null`, never `0`; missing fuel types stay missing; no invented prices or opening states."
- **Statement:** Tankerkönig shows stations within 5 km with distances; false prices become null (never 0); missing fuel types stay missing; nothing invented.
- **statement_sha256:** `26c275e0239e761f351834694821381e40ab832237577ca55b3554695310d9f7`
- **Interpretation:** The false→null normalization is the truthfulness-critical clause; €/l with delivered precision.
- **Preconditions & fixtures:** Tankerkönig fixtures incl. false prices.
- **Scenarios:**
  - GIVEN a station with e5:false WHEN normalized THEN the e5 price is null and renders as missing — never 0.00
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### GD-DBTK-04

- **Source:** S4 · GD-DBTK 5 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Both live-verifiable via the diagnose harness once keys exist."
- **Statement:** Both providers are live-verifiable through the diagnose harness the moment credentials exist; schemas marked TO VERIFY until the first keyed run.
- **statement_sha256:** `5bbf34699a97363c46bb41a883a1db9f47f231f938733fb19c9a5cf191d92916`
- **Interpretation:** Fulfilled 2026-07-18 evening: Tankerkönig list.php and FaSta v2 live-verified with real credentials (data-sources.md).
- **Preconditions & fixtures:** Credentials in .env.
- **Scenarios:**
  - GIVEN keys present WHEN npm run diagnose runs THEN both adapters are exercised live with schema validation
- **Verifiability:** statistical-environmental
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.B-04

- **Source:** S1 · §3.1.B · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "the UBA JSON API returns timestamps in CET/MEZ (no DST shift) — normalize deliberately to Europe/Berlin and preserve the original source time in Evidence."
- **Statement:** UBA timestamps (CET/MEZ, no DST) are deliberately normalized to Europe/Berlin and the original source string is preserved in Evidence (sourceTimeRaw).
- **statement_sha256:** `85da7ff2fd7bbbb2cc1fc1f09a0caee73f3bfc5b4ee1f687d6f9572a444a32e4`
- **Interpretation:** ubaCetToIso incl. the hour-24 convention; sourceTimeRaw carries the verbatim source value.
- **Preconditions & fixtures:** UBA fixtures with summer + winter timestamps.
- **Scenarios:**
  - GIVEN a summer UBA reading (CET source) WHEN normalized THEN the ISO instant is correct (CEST wall-clock shifts by one hour) and sourceTimeRaw holds the original
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.C-01

- **Source:** S1 · §3.1.C · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Weather forecast/observation only from a verified DWD-compatible, documented integration. Two documented access paths (choose per adapter and record in manifest):"
- **Statement:** Weather data comes only from a verified DWD-compatible documented integration; the chosen access path (opendata.dwd.de or Bright Sky) is recorded in the manifest.
- **statement_sha256:** `4db759c0ff1f799ab3e171f6ba04d23cfaec5c06f49e5484645eb0a50a870b6d`
- **Interpretation:** As built: Bright Sky chosen (DEV-04/decisions 2026-07-16), recorded in the manifest with the direct opendata path documented as fallback.
- **Preconditions & fixtures:** Manifest; weather adapter.
- **Scenarios:**
  - GIVEN the weather module WHEN its manifest entry is read THEN the endpoint is one of the two documented paths and the choice is recorded
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 1 = 4 → **P3**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-04

#### MP-3.1.C-02

- **Source:** S1 · §3.1.C · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "If Bright Sky is used, label it in the Evidence Inspector as an unofficial access layer over DWD data, and keep a direct-opendata.dwd.de fallback path documented."
- **Statement:** Bright Sky is labelled in Evidence as an unofficial access layer over DWD data, and the direct opendata.dwd.de fallback stays documented.
- **statement_sha256:** `20878324d87ec80df134c33cdbc082bd67e0f2c821f22a0c6b732726fa7a889f`
- **Interpretation:** Evidence method/limitations state the unofficial-layer fact; docs/data-sources.md documents the MOSMIX fallback.
- **Preconditions & fixtures:** Weather evidence records.
- **Scenarios:**
  - GIVEN a weather value WHEN inspected THEN the unofficial-access-layer note is visible; attribution remains Quelle: Deutscher Wetterdienst
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.C-03

- **Source:** S1 · §3.1.C · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Official warnings via the DWD GeoServer (verified): WFS at https://maps.dwd.de/geoserver/dwd/ows (layer dwd:Warnungen_Gemeinden), filterable via CQL; and/or the CAP products on the Open Data server. Show warning context SEPARATELY from general forecast."
- **Statement:** Official warnings come from the DWD GeoServer WFS (dwd:Warnungen_Gemeinden) or CAP products, and warning context renders separately from the general forecast.
- **statement_sha256:** `9ff4781e1d2eb048c00c442fc18e58a128ef925772d133c3087c2d36abe740c6`
- **Interpretation:** Separate module/envelope for warnings; never merged into the forecast card.
- **Preconditions & fixtures:** Warnings adapter fixtures.
- **Scenarios:**
  - GIVEN an active warning polygon covering the selection WHEN the UI renders THEN the warning appears in its own warning context, distinct from forecast values
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.C-04

- **Source:** S1 · §3.1.C · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Relevant baseline values where cleanly available: temperature; apparent temperature only where source/method is clear; precipitation; wind; gusts; official warning context; optional UV only after source and semantics are verified."
- **Statement:** Weather shows the baseline set (temperature, precipitation, wind, gusts, warnings); apparent temperature only with clear method; UV only after source verification.
- **statement_sha256:** `422a8ccc83359b1957aeb6e43e8bd7bfc05e9c9a5904e955b15ee86bf88f6695`
- **Interpretation:** As built, UV ships as its own verified DWD UV module (dwd-uvi) — satisfying the verification precondition (DEV-10). Apparent temperature: shown only if Bright Sky supplies it with documented method.
- **Preconditions & fixtures:** Weather fixtures.
- **Scenarios:**
  - GIVEN a weather response WHEN rendered THEN the baseline values appear with units; no unverified derived values (e.g. self-computed feels-like)
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-10

#### MP-3.1.D-01

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Show station name, identifier, station type where supplied, measurement timestamp, distance from selected location, provisional/partial/stale status, explicit station limitations."
- **Statement:** UBA station displays include station name, identifier, type (where supplied), measurement timestamp, distance from the selection, provisional/partial/stale status and explicit limitations.
- **statement_sha256:** `30cfa92cb820481a5928b1ff088dae1639d1de0d01be9e9c4c9ec36cd70b3e59`
- **Interpretation:** The full station metadata set is user-inspectable per value.
- **Preconditions & fixtures:** UBA fixtures with full metadata.
- **Scenarios:**
  - GIVEN a station measurement WHEN inspected THEN all listed metadata fields render; provisional status visible
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.D-02

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Data of the CURRENT year are provisional ("nicht endgültig geprüft"; final data published in June of the following year); UBA cannot guarantee completeness — surface this as data status."
- **Statement:** Current-year UBA data is surfaced as provisional with the completeness caveat as data status.
- **statement_sha256:** `9c68a681ef08e35eb5d69473ba65b6427edd875c2267c2f420b3ae1deb1c2628`
- **Interpretation:** completeness:'provisional' on evidence; UI shows the provisional state.
- **Preconditions & fixtures:** UBA fixtures dated current year.
- **Scenarios:**
  - GIVEN a current-year measurement WHEN its evidence renders THEN completeness is provisional and the caveat is user-visible
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.D-03

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Optional regional model context (CAMS European air quality), only after access, licensing, attribution, technical retrieval and product suitability are verified"
- **Statement:** CAMS regional model context activates only after access, licensing, attribution, technical retrieval and product suitability are verified; until then it stays non-live.
- **statement_sha256:** `874189afafe6f166d200d5c153ef1031f9c450015c3baface08847bacf434380`
- **Interpretation:** As built: real adapter, config-gated on CAMS_ADS_KEY; base status proposed; ADS schema TO VERIFY against a real key.
- **Preconditions & fixtures:** No CAMS_ADS_KEY configured.
- **Scenarios:**
  - GIVEN no CAMS key WHEN the air-model module is requested THEN configuration-required naming CAMS_ADS_KEY — no data, no demo
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.D-05

- **Source:** S1 · §3.1.D · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Show pollutant, valid time, model mode, grid resolution, source and model uncertainty where available. Provider caveat to surface: "Outputs may not be correlated enough with real concentrations"; "not suitable for clinical trials"."
- **Statement:** CAMS displays show pollutant, valid time, model mode, grid resolution and source, and surface the provider caveats verbatim.
- **statement_sha256:** `a5b6a0a7b61a60bc8149e73436bb57f8877139bc0204b9356dae43c722bb596e`
- **Interpretation:** Caveats live in evidence limitations; resolution in spatial context.
- **Preconditions & fixtures:** CAMS envelope (fixture).
- **Scenarios:**
  - GIVEN a CAMS value WHEN inspected THEN pollutant, valid time, model mode, ~10 km resolution and the two caveats are visible
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.E-01

- **Source:** S1 · §3.1.E · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Administrative context when obtainable (locality, municipality, state, country, optional boundary) — BKG VG250 boundaries and/or OSM."
- **Statement:** Administrative context (locality, municipality, state, country) is shown when obtainable, from BKG VG250 and/or OSM.
- **statement_sha256:** `4d46b4c4e08053710eb4a9174b7ad7936b85d91b694e1478f39cdc8eaeeaf46c`
- **Interpretation:** As built: Photon supplies locality/state; BKG VG250 supplies the official Gemeinde/ARS (dual evidence on NINA).
- **Preconditions & fixtures:** Geocoding + VG250 fixtures.
- **Scenarios:**
  - GIVEN a selected city WHEN the Lens renders THEN locality/municipality/state appear; the official ARS resolves via VG250
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.E-02

- **Source:** S1 · §3.1.E · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Selected mapped POIs/geometry: parks/green areas; transit stops; pharmacies; public toilets; drinking-water points; selected public facilities — via OpenStreetMap (Overpass API) with proper attribution. Cluster dense point layers. Show data age and completeness disclaimer."
- **Statement:** Selected POI categories come via Overpass with OSM attribution; dense layers cluster; data age and a completeness disclaimer are shown.
- **statement_sha256:** `5db4e6d1f0c7001023839c2ab73c0308e753f798e3c5638acbecec36a1bf87c1`
- **Interpretation:** As built the category set is extended by emergency/health (DEV-13) — a superseding extension, same rules.
- **Preconditions & fixtures:** Overpass fixtures.
- **Scenarios:**
  - GIVEN a dense urban selection WHEN the places layer renders THEN categories render clustered, attribution + completeness disclaimer visible
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-13

#### MP-3.1.F-01

- **Source:** S1 · §3.1.F · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "No universal transit-quality, routing, punctuality or real-time promise. Separate layers only:"
- **Statement:** Transit is presented as separate availability layers (stops, scheduled, realtime-coverage) with no universal quality, routing, punctuality or realtime promise.
- **statement_sha256:** `8d140114bf9e9a859b44d161af5e2ea561b97d2e12348dfaf4d7ab007f0329fc`
- **Interpretation:** Three distinct sub-contexts; each with its own mode and coverage wording.
- **Preconditions & fixtures:** Transit fixtures.
- **Scenarios:**
  - GIVEN the transit module WHEN rendered THEN stop context, scheduled context and realtime coverage are visually and semantically separate
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.F-02

- **Source:** S1 · §3.1.F · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Stop context: nearby stop name, coordinates, distance; line/mode only where reliably supplied; source and coverage label."
- **Statement:** Stop context shows nearby stop name, coordinates and distance; line/mode only where reliably supplied; with source and coverage label.
- **statement_sha256:** `af686bda8981d436e2776938392c09b1d3d376a682efc34a7bf689c31b622af3`
- **Interpretation:** Stops from OSM and/or imported GTFS; each carries distance + source.
- **Preconditions & fixtures:** Stop fixtures.
- **Scenarios:**
  - GIVEN nearby stops WHEN rendered THEN name/distance/source label per stop; line info only when the source supplies it
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.F-03

- **Source:** S1 · §3.1.F · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Scheduled timetable context: planned departures ONLY from a verified static source (DELFI GTFS via https://www.opendata-oepnv.de/ or gtfs.de feeds), valid and correctly matched to a stop; always label "scheduled"; show feed publication/update and validity period; never imply actual operation."
- **Statement:** Scheduled departures come only from a verified static GTFS source, correctly matched to the stop, always labelled scheduled, with feed publication/validity shown, never implying actual operation.
- **statement_sha256:** `f22ce0ed4128d738d7f37f3e38b6e04d3844450ea9c8ea8228e9f98b225c3097`
- **Interpretation:** Calendar-aware query (day-of-week, date ranges, calendar_dates exceptions, >24 h services); feed_info preserved into evidence.
- **Preconditions & fixtures:** Imported GTFS fixture feed.
- **Scenarios:**
  - GIVEN an imported feed and a matched stop WHEN departures render THEN each is scheduled-labelled, calendar-correct, and feed publication/validity appear in evidence
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.F-04

- **Source:** S1 · §3.1.F · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Realtime and service-alert context: ONLY for explicitly verified operator/area/mode coverage. In Germany, nationwide GTFS-Realtime coverage is PARTIAL"
- **Statement:** Realtime/service-alert context is shown only within explicitly verified coverage; German nationwide GTFS-RT coverage is treated as partial.
- **statement_sha256:** `f77d08d2e9f509a288da48199ba81198d9a4cf24e8d519d25d92121e740fcbe9`
- **Interpretation:** Coverage stays 'partial' until operator/area coverage is documented (TO VERIFY); realtime summaries only for nearby stops.
- **Preconditions & fixtures:** GTFS-RT fixtures.
- **Scenarios:**
  - GIVEN a configured RT feed WHEN summarized THEN coverage renders partial with operator/feed-age; never confirmed without documentation
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-5.4-01

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "License: Creative Commons BY 4.0 (CC BY 4.0)."
- **Statement:** DWD data is used under CC BY 4.0 (superseding legacy GeoNutzV wording), recorded in the manifest.
- **statement_sha256:** `54116bc11b5c2f171b1b75648d53d3d8d16e503c3984978527f2cb2abbfce952`
- **Interpretation:** License field of dwd-* providers = CC BY 4.0.
- **Preconditions & fixtures:** Manifest.
- **Scenarios:**
  - GIVEN the DWD manifest entries WHEN read THEN license is CC BY 4.0
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-5.4-02

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Attribution (verified official text form): "Quelle: Deutscher Wetterdienst" (or the DWD logo). For modified data: "Datenbasis: Deutscher Wetterdienst, ...". The string "© Deutscher Wetterdienst" is NOT the officially prescribed template"
- **Statement:** DWD attribution uses the verified form 'Quelle: Deutscher Wetterdienst'; the © form is not used (or is marked TO VERIFY).
- **statement_sha256:** `28f5169146e982213171b7e81c2da6703dd361c21b25c39ae952cccc88482fdb`
- **Interpretation:** Attribution strings in manifest + UI use the Quelle form.
- **Preconditions & fixtures:** Manifest; rendered attribution.
- **Scenarios:**
  - GIVEN DWD-backed values WHEN attribution renders THEN the Quelle form appears; no © Deutscher Wetterdienst
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 1 = 2 → **P3**
- **Verification status (see matrix):** covered

#### MP-5.4-04

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Warning geometries may carry EC_LICENSE "© GeoBasis-DE / BKG (year) (Daten modifiziert)" — preserve any embedded license field."
- **Statement:** Embedded license fields on DWD warning geometries (EC_LICENSE) are preserved into evidence, never stripped.
- **statement_sha256:** `ab75c2d8f0f3177af4b693c033317f0ad84f63ef5252214aca6f199b29b8d9d8`
- **Interpretation:** The warnings adapter forwards embedded license into evidence limitations/license.
- **Preconditions & fixtures:** Warning fixtures with EC_LICENSE.
- **Scenarios:**
  - GIVEN a warning feature carrying EC_LICENSE WHEN normalized THEN the embedded license text is preserved in the evidence
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-5.4-05

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "License: Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0), https://www.govdata.de/dl-de/by-2-0."
- **Statement:** UBA data is used under dl-de/by-2-0 with attribution 'Umweltbundesamt' (+ 'Daten verändert' where modified).
- **statement_sha256:** `824d1c776cae4237a589dc5dd367784661209b4b8d0d031ea822f39c350a00f9`
- **Interpretation:** Manifest license/attribution for uba-airdata.
- **Preconditions & fixtures:** Manifest.
- **Scenarios:**
  - GIVEN the UBA entry WHEN read THEN license dl-de/by-2-0, attribution Umweltbundesamt
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-5.4-06

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Attribution: "Generated using Copernicus Atmosphere Monitoring Service information [Year]"; state that neither the European Commission nor ECMWF is responsible for any use of the data."
- **Statement:** CAMS attribution uses the Copernicus form with year and the non-responsibility statement, visible whenever CAMS data shows.
- **statement_sha256:** `61a461e5b8fcd7c342d612cb33b0b271009a856c9786fbf4a10a3774052183b7`
- **Interpretation:** Manifest attribution + map/inspector visibility once activated (Stage 4 acceptance).
- **Preconditions & fixtures:** CAMS manifest entry; activated CAMS (future) for UI half.
- **Scenarios:**
  - GIVEN CAMS active WHEN model data renders THEN the Copernicus attribution is visible in map and inspector
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** partial

#### MP-5.4-07

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "License/attribution: DELFI e.V. attribution required (e.g. "NeTEx Datensatz, DELFI e.V." / "Datenquelle: DELFI e.V.");"
- **Statement:** DELFI-derived transit data carries DELFI e.V. attribution.
- **statement_sha256:** `755c6b7c0fb30f8d04c40f17a1ee2a54860b93ae1ae1e03a0a85e1b1f9e4593e`
- **Interpretation:** Manifest attribution for delfi-gtfs/-rt; gtfs.de additionally credited as generator (MP-5.4-08).
- **Preconditions & fixtures:** Manifest.
- **Scenarios:**
  - GIVEN GTFS-backed values WHEN attribution renders THEN Datenquelle: DELFI e.V. appears
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-5.4-08

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Realtime: GTFS-RT stream, CC BY-SA 4.0, "ohne Gewähr", partial operator coverage."
- **Statement:** gtfs.de GTFS-RT usage respects CC BY-SA 4.0, surfaces the 'ohne Gewähr' character and partial operator coverage, and credits gtfs.de as generator.
- **statement_sha256:** `0b5240f0b4a8c2fbdd9305e3154689a10cdbfcdc78a8681af9311d32a394d43c`
- **Interpretation:** Coverage 'partial' + limitations wording; license recorded.
- **Preconditions & fixtures:** RT manifest entry + fixtures.
- **Scenarios:**
  - GIVEN RT summaries WHEN rendered THEN partial coverage + no-guarantee limitation visible
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-5.4-10

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "License: ODbL. Attribution (verified): "© OpenStreetMap contributors", linked to openstreetmap.org/copyright, with a note that data is under ODbL."
- **Statement:** OSM-derived data (Overpass, Photon) carries ODbL license and '© OpenStreetMap contributors' attribution linked to the copyright page.
- **statement_sha256:** `2a9207deb04eef0103838bc79f9b5a4733b033b31c8d1ab524e5ef35e9e691b9`
- **Interpretation:** Manifest + rendered attribution.
- **Preconditions & fixtures:** Manifest; POI/search evidence.
- **Scenarios:**
  - GIVEN OSM-backed values WHEN attribution renders THEN the contributors string appears with the ODbL note
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-5.4-13

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Choose ONE primary base map; both are advertising-free."
- **Statement:** Exactly one primary base map is chosen (OpenFreeMap liberty as built; basemap.de as documented alternative), advertising-free, with correct attribution.
- **statement_sha256:** `ac28d3367905e3190e0da6b2cd9cad2c2d7fa441710bccd540d0d6aa0cd520b3`
- **Interpretation:** DEV-03 records the OpenFreeMap choice; attribution auto-added via MapLibre AttributionControl.
- **Preconditions & fixtures:** Map style config.
- **Scenarios:**
  - GIVEN the map loads WHEN tiles render THEN one base-map source is active and its attribution shows
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-03

#### MP-5.4-14

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Attribution (verified): "© BKG (Jahr des letzten Datenbezugs) dl-de/by-2-0"
- **Statement:** BKG VG250 data is used under dl-de/by-2-0 with the © BKG attribution form.
- **statement_sha256:** `d2e997b87be82f7a37117b215f90bd83b205a45885780b2f61c307dbdd287c7d`
- **Interpretation:** Manifest fields for bkg-vg250.
- **Preconditions & fixtures:** Manifest.
- **Scenarios:**
  - GIVEN VG250-backed context WHEN attribution renders THEN © GeoBasis-DE / BKG with year appears
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 1 = 2 → **P3**
- **Verification status (see matrix):** covered

#### MP-6-06

- **Source:** S1 · §6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "type TransitCoverage = "confirmed" | "partial" | "not-covered" | "unknown" | "temporarily-unavailable";"
- **Statement:** TransitCoverage is the closed five-value enum.
- **statement_sha256:** `fcf75fe0869a0f9c4c2dd4b2ccf28d4c9cdf8d75d3ba148565ed5eddb9013ed2`
- **Interpretation:** Cross-ref MP-3.1.F-05.
- **Preconditions & fixtures:** Contracts.
- **Scenarios:**
  - GIVEN any transit coverage value WHEN validated THEN it is one of the five
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-10.2-01

- **Source:** S1 · §10 Stage 2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Acceptance: observed/forecast/unavailable never conflated; all values expose source + valid time; warning context separate; provider failure visible; tests cover valid, missing, malformed responses; DWD attribution present."
- **Statement:** Stage 2 acceptance: weather modes never conflated; source+valid time on all values; warnings separate; failure visible; valid/missing/malformed covered by tests; DWD attribution present.
- **statement_sha256:** `402684b9553d333f332df835d9d7a5022886b9103363963933443e26efe3fe2f`
- **Interpretation:** Bundle over MP-3.1.C-03/05/06, MP-2.1-07, MP-5.3-01, MP-11-02.
- **Preconditions & fixtures:** Weather fixtures.
- **Scenarios:**
  - GIVEN the weather module WHEN its criteria run THEN all pass
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-10.3-01

- **Source:** S1 · §10 Stage 3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Acceptance: no interpolation; distant station labelled as distant; provisional/partial state shown; source + station metadata retained; no "local air quality" claim from a distant station."
- **Statement:** Stage 3 acceptance: no interpolation; distant stations labelled distant; provisional/partial shown; station metadata retained; no local-air claim from distant stations.
- **statement_sha256:** `b5be98f03ec40f277d12c8d4abe6e9ddac9fd328480be979df9cd1f16957fa3a`
- **Interpretation:** Bundle over MP-2.2-02, MP-3.1.D-01/02/07.
- **Preconditions & fixtures:** UBA fixtures.
- **Scenarios:**
  - GIVEN the air module WHEN criteria run THEN all pass
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-10.4-01

- **Source:** S1 · §10 Stage 4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Acceptance: no address-level transformation; no station/model fusion; model vs analysis/forecast clear; comparison only among compatible model values; Copernicus attribution visible in map and inspector."
- **Statement:** Stage 4 (CAMS) acceptance: no address-level transformation; no station/model fusion; analysis/forecast distinction clear; comparisons only among compatible model values; Copernicus attribution visible in map and inspector.
- **statement_sha256:** `6a8c25035c7a40c8e3cb113c5f6559f987662ce401ec92e1e9b57efc1cf59d2c`
- **Interpretation:** Bundle over MP-2.2-03, MP-3.1.D-04/06, MP-5.4-06. UI-visibility criteria become fully checkable only when CAMS is activated with a real key.
- **Preconditions & fixtures:** CAMS extraction fixtures; activation for UI half.
- **Scenarios:**
  - GIVEN CAMS gated off WHEN requested THEN configuration-required
  - GIVEN CAMS active WHEN criteria run THEN all pass incl. visible attribution
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** partial

#### MP-10.5-01

- **Source:** S1 · §10 Stage 5 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Acceptance: POIs labelled mapped context; no opening/accessibility/availability assertion; performance acceptable at dense zoom; OSM attribution present."
- **Statement:** Stage 5 acceptance: POIs labelled mapped context; no operational assertions; acceptable performance at dense zoom; OSM attribution present.
- **statement_sha256:** `fbdd0d2b412b4f772c142b01ee4dca83c393d72990e6ac2b35af9e8c78b0107c`
- **Interpretation:** Bundle over MP-3.1.E-02/03, MP-5.4-10. Dense-zoom performance is the one novel criterion — clustering + measured render behaviour.
- **Preconditions & fixtures:** Dense-POI fixtures.
- **Scenarios:**
  - GIVEN a dense urban area at high zoom WHEN the places layer renders THEN interaction stays responsive (clustered), no jank-level regression
- **Verifiability:** statistical-environmental
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** partial

#### MP-10.6-01

- **Source:** S1 · §10 Stage 6 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Acceptance: scheduled and realtime cannot be visually confused; absence of realtime never means normal service; no routing; no reliability rating; coverage gaps explicit."
- **Statement:** Stage 6 acceptance: scheduled vs realtime never visually confusable; absence of realtime never implies normal service; no routing; no reliability rating; coverage gaps explicit.
- **statement_sha256:** `b0fe25ab8e0b77e63117471bd25237f932fc2785a1de274ba303ed1b8d3fafb3`
- **Interpretation:** Bundle over MP-2.2-05/06, MP-3.1.F-*, MP-8.4-01.
- **Preconditions & fixtures:** Transit fixtures.
- **Scenarios:**
  - GIVEN the transit module WHEN criteria run THEN all pass
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

### Domain: Caching & staleness (9)

#### GD-TRUTH-04

- **Source:** S4 · GD-TRUTH 4 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Cached/stale data is served only when visibly labelled with its age; "Live" wording is never applied to cached or scheduled data."
- **Statement:** Cached/stale data serves only visibly age-labelled; 'Live' never applies to cached/scheduled data (directive twin of MP-3.1.J-03/MP-7.4-02).
- **statement_sha256:** `1f92f57808e7f32ee9999b56cc6565d1448897ba5fbbf3252bc8b5459ec404f3`
- **Interpretation:** Cross-ref bundle.
- **Preconditions & fixtures:** Stale fixtures.
- **Scenarios:**
  - GIVEN the stale-serving fixtures WHEN run THEN age labels present; no Live wording
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.J-03

- **Source:** S1 · §3.1.J · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Retain last good response only when visibly labelled with its age."
- **Statement:** A last-good (stale) response is retained/served only when visibly labelled with its age.
- **statement_sha256:** `b18f4e8ecb4a5edf8d56185227dba9f733fabedee09045dae0e3e572475cadbe`
- **Interpretation:** Stale-cache policy in the runner: stale data allowed only with status stale + cacheAgeSeconds surfaced.
- **Preconditions & fixtures:** Cache fixtures beyond TTL.
- **Scenarios:**
  - GIVEN a cached response past TTL and a failing provider WHEN the module renders THEN the stale value shows with its age label — or nothing, never an unlabelled stale value
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.K-04

- **Source:** S1 · §3.1.K · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Cache per source terms; progressive loading, clustering, request cancellation, deduplication, rate limiting, error-safe retries;"
- **Statement:** Caching follows source terms; the client/server implement progressive loading, clustering, request cancellation, deduplication, rate limiting and error-safe retries.
- **statement_sha256:** `018906851fe471e68483718a6371f90221f863b97aa9c6c16b4e9536c91310f8`
- **Interpretation:** Source-aware TTLs per provider; per-host serialization for Overpass; bounded retries never on 4xx auth/429.
- **Preconditions & fixtures:** HTTP layer tests.
- **Scenarios:**
  - GIVEN parallel Overpass demands WHEN issued THEN requests serialize per host; 429 maps to rate-limited without retry
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.K-05

- **Source:** S1 · §3.1.K · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "do NOT load nationwide bulk datasets into the browser (respect Overpass/Nominatim usage policies — see §5)."
- **Statement:** Nationwide bulk datasets are never loaded into the browser; Overpass/Nominatim usage policies are respected.
- **statement_sha256:** `4e78eafe1e8192dd0f719c4c3d396624719edbb7366016307710ff6ab78e34b5`
- **Interpretation:** Bulk work (GTFS import, Autobahn snapshot, ODL full layer) happens server-side; the browser receives filtered per-place responses.
- **Preconditions & fixtures:** API + web request paths.
- **Scenarios:**
  - GIVEN any module request from the browser WHEN traced THEN the response is a per-place filtered payload, never a nationwide dataset
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** partial

#### MP-5.4-03

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Availability: NOT guaranteed. Verbatim: "Es besteht derzeit kein Anspruch auf Verfügbarkeit dieser Dienste." → Cache, visible outages and data status are MANDATORY."
- **Statement:** Because DWD service availability is not guaranteed, caching, visible outage states and data status are mandatory for DWD-backed modules.
- **statement_sha256:** `e76633804f014c2d9086a9faf5df5083b1b538388e167da9af0ee90a46f88259`
- **Interpretation:** Also restated in the Leitentscheidung; cache TTLs exist for DWD providers, outages render source-error/stale-labelled.
- **Preconditions & fixtures:** DWD outage fixtures + cache.
- **Scenarios:**
  - GIVEN a DWD outage with a warm cache WHEN the module renders THEN either the visibly-aged cached value or a visible outage state — never silence
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-5.4-09

- **Source:** S1 · §5.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Fair-use: one query at a time, NO parallel queries; queue >15 s → HTTP 429."
- **Statement:** Overpass usage enforces the fair-use policy: one query at a time (per-host serialization), 429 honored without retry storm; sustained/bulk use is out of scope for the public instance.
- **statement_sha256:** `7308399214ea89c2ed5d73ac3194fe7859bc746148c9e212cd1506d88188c285`
- **Interpretation:** policedFetch serializes Overpass requests; 429 maps to rate-limited; the documented mirror is the only alternative path (DEV-14).
- **Preconditions & fixtures:** HTTP layer.
- **Scenarios:**
  - GIVEN two concurrent Overpass demands WHEN issued THEN they execute sequentially; a 429 yields rate-limited without immediate retry
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-14

#### MP-7.4-01

- **Source:** S1 · §7.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "store retrieval time, expiry time, provider ID, request fingerprint, schema version, response hash, evidence; cache keys include place/time/layer params;"
- **Statement:** Cache rows store retrieval time, expiry, provider ID, request fingerprint, schema version and payload; keys include place/time/layer parameters.
- **statement_sha256:** `ff5a03ecc1eed144fd07218922da9d061c83230217488bf64d537cc8dcd8fd19`
- **Interpretation:** requestFingerprint stability + row schema; fingerprints keyed on query params.
- **Preconditions & fixtures:** Cache layer.
- **Scenarios:**
  - GIVEN two identical requests and one differing in place WHEN fingerprinted THEN identical requests share a key; the differing one does not
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-7.4-02

- **Source:** S1 · §7.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "never present cache age as live freshness; a stale response is usable only if visibly marked;"
- **Statement:** Cache age is never presented as live freshness; stale responses are usable only visibly marked (and 'Live' wording never applies to cached data).
- **statement_sha256:** `72c9f929f8eedf240bc49cb1ad96470ac21ebc7be8181443f60b62b7a42e0c4e`
- **Interpretation:** Duplicate anchor of MP-3.1.J-03 from the caching side + the §9 'Live' ban.
- **Preconditions & fixtures:** Stale fixtures.
- **Scenarios:**
  - GIVEN a cached value WHEN rendered THEN cacheAgeSeconds is surfaced; no 'Live' labelling
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-FIN-02

- **Source:** S1 · Verbindliche Leitentscheidung · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Die Architektur kombiniert Quellen und Kontexte, nicht deren fachliche Berechnungen: DWD für Wetter, UBA/Länder für Stationsmessungen, optional CAMS für regionales Modell, nur verifizierte Transit-/POI-Quellen."
- **Statement:** The binding architecture decision: combine sources and contexts, never their domain calculations; DWD/UBA/CAMS/verified transit+POI in their lanes; DWD's no-availability-guarantee makes cache, visible outages and data status mandatory.
- **statement_sha256:** `bb4a9ad2097d82c03485db03c042275da00eeb3410d0c8f4e834fb9f23ab6147`
- **Interpretation:** German binding coda; umbrella over MP-2.2-01, MP-5.4-03 — no separate oracle.
- **Preconditions & fixtures:** —
- **Scenarios:**
  - GIVEN the concretized requirements WHEN they pass THEN the Leitentscheidung holds
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

### Domain: Error & degraded states (10)

#### DOC-SPATIAL-05

- **Source:** S3 · spatial-contract.md §4 · `docs/spatial-contract.md`
- **Quote (verbatim, whitespace-normalized):** "One provider's failure/absence never blocks the others: every module fetches independently; the runner isolates errors per envelope"
- **Statement:** Failure isolation is per envelope: one provider's failure or absence never blocks any other module's fetch or render.
- **statement_sha256:** `916d96b7f1fc1f5d677ca8e98d70ec9457d8affdb45688acda7d0fcdb7c8c79f`
- **Interpretation:** Independent fetches; per-envelope error mapping; UI renders each card from its own envelope.
- **Preconditions & fixtures:** One-provider-outage fixtures.
- **Scenarios:**
  - GIVEN one provider hard-failing WHEN a place loads THEN that card shows source-error; all other cards settle normally
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### GD-TRUTH-02

- **Source:** S4 · GD-TRUTH 2 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Honest absence is a first-class outcome and visually distinct from failure (absence ≠ error); configuration-required states name the exact missing environment variable."
- **Statement:** Honest absence renders visually distinct from failure, and configuration-required states name the exact missing environment variable.
- **statement_sha256:** `5fb600deea6b46abe1b0f6c166663904cdbd0c61f4ca112c85b464c244284aec`
- **Interpretation:** Yellow-vs-red distinction (qa-checklist); 'Konfiguration erforderlich' + exact env var name (e.g. CAMS_ADS_KEY).
- **Preconditions & fixtures:** Absence + error + config-gated fixtures.
- **Scenarios:**
  - GIVEN an honest absence and a source error WHEN rendered THEN the two states are visually distinct
  - GIVEN an unconfigured key-gated module WHEN rendered THEN the exact env var name appears
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-2.1-07

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "invent a value when a provider fails;"
- **Statement:** When a provider fails, no value is invented: the envelope carries data null and an error/unavailable status.
- **statement_sha256:** `d26ed0003d84407993eac93cac598eb2ace64d298233c42a9b4c1e4752d04a68`
- **Interpretation:** The single most safety-critical truthfulness rule; enforced per adapter by failure-injection tests and the envelope invariant data null ⇔ non-ok status.
- **Preconditions & fixtures:** Failure injection per adapter.
- **Scenarios:**
  - GIVEN a provider request fails (network, 5xx, malformed) WHEN the module envelope is produced THEN data is null, status is source-error/unavailable, statusDetail explains — no fabricated value
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-2.1-08

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "silently substitute a different provider;"
- **Statement:** No silent provider substitution: any fallback provider (e.g. the Overpass mirror) is documented, uses the same source data, and is visible in Evidence.
- **statement_sha256:** `f4b139fbb451bcc1a6e41e316f267a16997e4ab5faf58feeaf7ebf4892740d60`
- **Interpretation:** The Overpass mirror fallback (DEV-14) is the boundary case: same OSM data, documented in data-sources.md, single retry, still fails honestly when both limited. A substitution to a different DATA source would violate this.
- **Preconditions & fixtures:** Adapter fixtures simulating primary failure.
- **Scenarios:**
  - GIVEN the Overpass primary throttles (429) WHEN the adapter retries the documented mirror THEN the evidence still names OSM/Overpass and the mirror use is per documented policy; both limited ⇒ honest source-error
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-14

#### MP-3.1.I-01

- **Source:** S1 · §3.1.I · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Coverage and availability matrix (core feature, not a debug screen) — per location, a simple, non-judgmental matrix"
- **Statement:** A per-location coverage/availability matrix is a core product feature, simple and non-judgmental.
- **statement_sha256:** `36b4167dae566ed7baed711a18d19822124a29c158131155463dbe7fe183033b`
- **Interpretation:** Matrix rows per module with factual availability wording (available / distance / partial / not covered), no alarm colors for ordinary absence (MP-4.1-02).
- **Preconditions & fixtures:** Module envelopes for a place.
- **Scenarios:**
  - GIVEN a selected place WHEN the matrix renders THEN each module has a factual availability row consistent with its envelope
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.I-02

- **Source:** S1 · §3.1.I · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Air station: 18 km away · Regional air model: available, approx. 10-km grid · Nearby stops: available · Scheduled transit: available/not confirmed · Transit realtime: partial/not covered"
- **Statement:** Matrix rows carry graded, spatially honest wording (distance for stations, grid note for models, partial/not-covered for realtime) rather than binary available/unavailable.
- **statement_sha256:** `4d0a052489722343dfc1e840967e61b7131ffa6eeb2d3e4ea28a931aeca61ac8`
- **Interpretation:** The matrix communicates HOW available (distance, resolution, coverage grade).
- **Preconditions & fixtures:** Envelope fixtures with distant station / partial coverage.
- **Scenarios:**
  - GIVEN a place whose nearest station is 18 km away WHEN the matrix renders THEN the air row states the distance, not a bare 'available'
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.J-01

- **Source:** S1 · §3.1.J · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Explicit UI states: loading, available, partial, stale, unavailable, source error, configuration required, demo."
- **Statement:** The UI implements the eight explicit module states: loading, available, partial, stale, unavailable, source-error, configuration-required, demo — visually distinct.
- **statement_sha256:** `61c7b72bb9afa3128ba6cbec8e65142eca542d8591a3d0613f55f8d36cf9fc29`
- **Interpretation:** Every module card renders exactly one of these as a status pill; each state is styleable/distinguishable (absence ≠ error per GD-TRUTH-02).
- **Preconditions & fixtures:** Fixtures driving each state.
- **Scenarios:**
  - GIVEN fixtures inducing each of the eight states WHEN the module renders THEN the matching state pill appears; no state is conflated with another
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.J-02

- **Source:** S1 · §3.1.J · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Explain what is missing, why it matters, what cannot be concluded."
- **Statement:** Degraded/absent states explain what is missing, why it matters, and what cannot be concluded.
- **statement_sha256:** `f84f25533e3fe62a96202fbc7e21b10acf2b23da53b2b3f0c45ff9ca40b08ba9`
- **Interpretation:** statusDetail strings + limitation notes fulfil this; German, rule-naming (DOC-SPATIAL-05).
- **Preconditions & fixtures:** No-data / error fixtures.
- **Scenarios:**
  - GIVEN an unavailable module WHEN rendered THEN the note names the missing thing and the non-conclusion (e.g. no gauge ≠ no water)
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-5.3-01

- **Source:** S1 · §5.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "validate every external response at runtime; reject malformed/semantically invalid data;"
- **Statement:** Every external response is runtime-validated (Zod); malformed or semantically invalid data is rejected, surfacing as source-error.
- **statement_sha256:** `85d9503e686fecb090a5731766f4a5ea91163021e21b694a876659ee9739058c`
- **Interpretation:** Schema mismatch never yields partial/invented parses.
- **Preconditions & fixtures:** Malformed fixtures per adapter.
- **Scenarios:**
  - GIVEN a malformed provider payload WHEN the adapter parses THEN rejection ⇒ source-error envelope; no partial value leaks
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** covered

#### MP-5.3-02

- **Source:** S1 · §5.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "never conceal source failure; do not auto-suspend permanently from a single transient error; record health telemetry internally; suspend only per documented policy; surface temporary outage as temporary;"
- **Statement:** Source failure is never concealed; a single transient error never permanently suspends a provider; temporary outage surfaces as temporary; suspension follows documented policy only.
- **statement_sha256:** `f4e187a3cd6c9329d0397fcf79fa635e618364c5c16d53ea538e2fbf2bfc1f22`
- **Interpretation:** Transient failures produce per-request source-error envelopes; the provider remains available for the next request; no hidden circuit-breaker blacklists without policy.
- **Preconditions & fixtures:** Failure then recovery fixtures.
- **Scenarios:**
  - GIVEN one failing request then a healthy one WHEN both run THEN the first yields source-error, the second serves data — no lasting suspension
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** partial
- **Notes:** Error surfacing covered; an explicit recovery-after-failure regression and health-telemetry check are PLANNED.

### Domain: Demo/live separation (5)

#### GD-TRUTH-03

- **Source:** S4 · GD-TRUTH 3 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Demo data is opt-in, permanently banner-labelled, and never mixes with live data in any panel, conclusion or comparison; provider failure never triggers a silent demo fallback."
- **Statement:** Demo is opt-in, permanently bannered, never mixed with live, never a silent fallback (directive twin of MP-3.1.J-04/05/06).
- **statement_sha256:** `86280fdaa55a40e1742702b85e58a05ec5821edc128e56ca40c35fc0e40ad7fc`
- **Interpretation:** Cross-ref bundle; oracles live on the MP twins.
- **Preconditions & fixtures:** Demo + live fixtures.
- **Scenarios:**
  - GIVEN the demo/live matrix of MP-3.1.J WHEN run THEN all pass
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-2.1-09

- **Source:** S1 · §2.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "silently fall back to demo data."
- **Statement:** Provider failure never triggers a silent demo fallback; demo data appears only in explicit opt-in demo mode.
- **statement_sha256:** `d69deedb7a8fb2303a25cb0bb61f5bbf145fe98af2c1d4c06b93f4a303e560f0`
- **Interpretation:** Server rejects demo unless ENABLE_DEMO=1; failure paths return error envelopes with demo:false.
- **Preconditions & fixtures:** Server without ENABLE_DEMO; failure injection.
- **Scenarios:**
  - GIVEN live mode and a total provider outage WHEN modules render THEN error/unavailable states show; no demo-stamped data appears anywhere
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.J-04

- **Source:** S1 · §3.1.J · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Demo mode is opt-in and permanently labelled while active: "DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN"."
- **Statement:** Demo mode is opt-in and, while active, permanently labelled with the exact banner text 'DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN'.
- **statement_sha256:** `500a1e49d568d38f2b9367915791fe1cbe43d5b82a8e11bdbd21bf814f127cdb`
- **Interpretation:** Banner persists across navigation/layer switches; exact string.
- **Preconditions & fixtures:** ENABLE_DEMO=1 server; demo session.
- **Scenarios:**
  - GIVEN demo mode active WHEN the user navigates all surfaces THEN the banner stays visible with the exact text
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.J-05

- **Source:** S1 · §3.1.J · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Demo/live data cannot coexist in the same conclusion, panel or comparison."
- **Statement:** Demo and live data never coexist in one conclusion, panel or comparison.
- **statement_sha256:** `f22729be251688f7b17c68dcf12ced7d2f97dc87fd7ea8096c7973efbaa9c501`
- **Interpretation:** Demo is a whole-session mode server-side; comparability engine additionally refuses demo↔live pairs.
- **Preconditions & fixtures:** Demo + live envelopes (fixtures).
- **Scenarios:**
  - GIVEN a demo value and a live value WHEN a comparison is attempted THEN it is refused; panels render either all-demo or all-live
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.J-06

- **Source:** S1 · §3.1.J · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Provider failure must NEVER cause an unannounced demo fallback."
- **Statement:** Provider failure never causes an unannounced demo fallback (duplicate-by-design of MP-2.1-09 at the module level).
- **statement_sha256:** `519734cb0944f7d8eb27dcbe3186eb75e4de4538072f4284b47757ead55da582`
- **Interpretation:** Kept as its own ID because §3.1.J is the module-level acceptance anchor cited in code.
- **Preconditions & fixtures:** Failure injection in live mode.
- **Scenarios:**
  - GIVEN live mode with all providers failing WHEN modules render THEN error states only; demo flag false everywhere
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

### Domain: Comparison A/B/C (6)

#### DOC-EVID-01

- **Source:** S3 · evidence-policy.md Comparability · `docs/evidence-policy.md`
- **Quote (verbatim, whitespace-normalized):** "only when the parameter matches and the time contexts are within `MAX_COMPARABLE_SKEW_SECONDS` (2 h)."
- **Statement:** Comparability additionally requires matching parameters and time contexts within the 2-hour skew constant; any mismatch yields a German reason and the comparison is withheld.
- **statement_sha256:** `292e6e26c02c45740c7c0f30532cfff7406a9bdb4bc77370d674a91ee0447157`
- **Interpretation:** The concrete comparability constant not specified in S1 — the operational definition of 'simultaneously meaningful'.
- **Preconditions & fixtures:** Comparison fixtures at/beyond the skew.
- **Scenarios:**
  - GIVEN two observed PM2.5 values 3 h apart WHEN compared THEN withheld with the German reason
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.A-06

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Up to three persistent comparison pins: A, B, C."
- **Statement:** The user can pin up to three places (A, B, C) as persistent comparison pins.
- **statement_sha256:** `8cf9c246cb009243f9cc19a27d3751d90f048eaf53033b58371516eeb7cc40a6`
- **Interpretation:** Pins persist across selection changes; pinning never moves the primary selection (DOC-SPATIAL-01).
- **Preconditions & fixtures:** Comparison UI.
- **Scenarios:**
  - GIVEN three places pinned WHEN the user selects a fourth place THEN pins A/B/C remain; a fourth pin is refused or replaces per documented UI rule
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.G-01

- **Source:** S1 · §3.1.G · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Pin up to three places; compare only compatible, simultaneously meaningful data."
- **Statement:** Comparison covers up to three pinned places and only compatible, simultaneously meaningful data.
- **statement_sha256:** `0b74dd515b659323c0471a1cb837a015b393506a00770732a27a0acc51be0088`
- **Interpretation:** The comparability engine gates every compared pair; incompatible pairs are withheld with a reason.
- **Preconditions & fixtures:** Comparison fixtures with mixed compatibility.
- **Scenarios:**
  - GIVEN pins with one comparable and one incomparable value pair WHEN the compare strip renders THEN the comparable pair shows side by side; the incomparable pair shows the German withhold reason
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.G-02

- **Source:** S1 · §3.1.G · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Display data mode beside every value, e.g. "PM2.5 9 µg/m³ · modelled · approx. 10 km" vs. "PM2.5 11 µg/m³ · observed · station 1.4 km"."
- **Statement:** In comparison, the data mode (and spatial qualifier) is displayed beside every value.
- **statement_sha256:** `8fe27ea4722647f90c0a4b77e58a058d0a93c637ef3d5e2d79a8886a533551a6`
- **Interpretation:** Per-value mode chips inside the compare strip; spatial context (distance/grid) alongside.
- **Preconditions & fixtures:** Compare fixtures.
- **Scenarios:**
  - GIVEN compared air values of different modes WHEN rendered THEN each value carries its mode chip and spatial qualifier
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.G-03

- **Source:** S1 · §3.1.G · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Compare: weather context; warning status; air-quality data mode & values; station distance where applicable; transit data availability; POI proximity/context; source freshness; data coverage."
- **Statement:** The comparison covers the listed dimensions: weather, warning status, air (mode+values+station distance), transit availability, POI context, source freshness, coverage.
- **statement_sha256:** `498b722b19dafc1c73ffc88742af243ad654c797cee30125d65b334e79e24e75`
- **Interpretation:** Dimension completeness of the compare strip.
- **Preconditions & fixtures:** Three pinned demo places.
- **Scenarios:**
  - GIVEN pins A/B/C in demo mode WHEN the compare strip renders THEN each listed dimension appears as a comparison row/section
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** partial
- **Notes:** Core dimensions tested; full dimension-by-dimension completeness assertion PLANNED.

#### MP-3.1.G-04

- **Source:** S1 · §3.1.G · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Do NOT calculate an overall score, a "best place" rank, or a universal recommendation. Use transparent factual comparison statements only."
- **Statement:** No overall score, best-place rank or universal recommendation is calculated; comparison output is transparent factual statements only.
- **statement_sha256:** `2deb489c12e7d8f4971d67cde5be0cdb5954690973a172799d8f5bdd084801ae`
- **Interpretation:** Negative requirement over the compare feature.
- **Preconditions & fixtures:** Compare UI.
- **Scenarios:**
  - GIVEN any comparison WHEN rendered THEN no score, rank, medal, sorting-by-goodness or recommendation appears
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

### Domain: Accessibility & product experience (11)

#### GD-GFX-01

- **Source:** S4 · GD-GFX 1 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "The UI must be visually polished, uncluttered and legible on desktop (≥1280px), tablet (768px) and mobile (375px), at 100% and 150% browser zoom: no overlap, no clipping, no overflow; legends and controls readable and reachable."
- **Statement:** The UI is visually polished and defect-free (no overlap/clipping/overflow) across desktop 1280+, tablet 768, mobile 375, at 100% and 150% zoom; legends and controls readable and reachable.
- **statement_sha256:** `f52ccaf51721e589e32148989d34ab7243e63eee253900b7679a7bd269b82f21`
- **Interpretation:** The layout-defect half is deterministic (overflow assertions possible); 'polished' is rubric (AMB-02).
- **Preconditions & fixtures:** Release build; three viewports × two zooms.
- **Scenarios:**
  - GIVEN each viewport×zoom combination WHEN the app renders with open panels THEN no element overlaps/clips/overflows; controls remain reachable
- **Verifiability:** manual-rubric
- **Rubric:** docs/qa-checklist.md Layout section, executed per release on Windows 11 across the six viewport×zoom combinations, with screenshots attached to the attestation.
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** manual-only

#### MP-3.1.A-07

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Clear selected, hover and keyboard-focus states."
- **Statement:** Interactive elements have clear, distinguishable selected, hover and keyboard-focus states.
- **statement_sha256:** `7f9738ca12abf7b3892dab8f967133d3b1eec3be50ac5a71ff9e960d13e81195`
- **Interpretation:** Focus visibility ties into MP-3.1.K-01 (focus == hover).
- **Preconditions & fixtures:** Running UI.
- **Scenarios:**
  - GIVEN keyboard traversal WHEN focus moves through search, results, layers THEN a visible focus indicator tracks every stop
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.A-08

- **Source:** S1 · §3.1.A · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Mobile: accessible bottom sheets; desktop: panels."
- **Statement:** On mobile the Lens/Inspector render as accessible bottom sheets; on desktop as panels.
- **statement_sha256:** `8a04fcbd08a07c2a33fc38c9e9e0deee4c7e93325d15ccef5285107a1a45e159`
- **Interpretation:** Cross-ref MP-4.2-02; mobile breakpoint 375px per GD-GFX-01.
- **Preconditions & fixtures:** Responsive build.
- **Scenarios:**
  - GIVEN a 375px viewport WHEN the user opens Lens/Belege THEN they open as bottom sheets, keyboard-dismissable, map stays primary
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-3.1.K-01

- **Source:** S1 · §3.1.K · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Keyboard-accessible controls, panels and map alternatives; focus == hover."
- **Statement:** All controls, panels and map alternatives are keyboard-accessible; everything reachable by hover is reachable by keyboard focus.
- **statement_sha256:** `72b07a54faa375f2cb0801a1112b7caa8d9e804fe129b2e3a9be0784900c7b7f`
- **Interpretation:** No hover-only information (also MP-4.2-03); tab order covers search → results → layers → panels.
- **Preconditions & fixtures:** Running UI.
- **Scenarios:**
  - GIVEN keyboard-only usage WHEN the user tabs through the app THEN every interactive element and every hover-revealed information is reachable
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.1.K-02

- **Source:** S1 · §3.1.K · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Respect prefers-reduced-motion; color must never be the sole carrier of data status."
- **Statement:** prefers-reduced-motion is respected, and color is never the sole carrier of data status (text/shape always accompany).
- **statement_sha256:** `c2e84d77603be26bf5d44c9a5da947f57fdaafbca17758e751a8787ecea63d1f`
- **Interpretation:** Status pills carry text; markers differ by shape; animations gated on the media query.
- **Preconditions & fixtures:** Reduced-motion emulation; status fixtures.
- **Scenarios:**
  - GIVEN prefers-reduced-motion WHEN the app runs THEN it renders without motion-dependent behavior
  - GIVEN any status indicator WHEN inspected THEN a text label or shape accompanies the color
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-4.1-01

- **Source:** S1 · §4.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Desired impression: calm; premium; data-rich but uncrowded; map-first; legible; fast; transparent; professional rather than governmental; confident without pretending certainty."
- **Statement:** The product's visual impression is calm, premium, data-rich but uncrowded, map-first, legible, fast, transparent, professional, and confident without pretending certainty.
- **statement_sha256:** `a26150e4c8148cb663e35e41c05727541d988535ac3695696446e8672c3d31b2`
- **Interpretation:** Aesthetic quality target; inherently not deterministically verifiable — flagged, with the GD-GFX manual rubric as the check.
- **Preconditions & fixtures:** Running UI on the target system.
- **Scenarios:**
  - GIVEN the release build WHEN the manual visual review runs THEN the reviewer attests the impression rubric per checklist
- **Verifiability:** not-deterministically-verifiable ⚠ FLAGGED
- **Rubric:** docs/qa-checklist.md manual visual checklist (layout, legibility, uncluttered modules) + reviewer judgment on calm/premium impression; performance feel covered by D11 of the live test plan.
- **Risk:** severity 3 × likelihood 3 = 9 → **P2**
- **Verification status (see matrix):** manual-only

#### MP-4.1-02

- **Source:** S1 · §4.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Avoid: rainbow maps; alarmist red states for ordinary missing coverage; widget clutter; giant "truth scores"; fake AI recommendations; visual claims beyond evidence."
- **Statement:** The UI avoids rainbow maps, alarmist red for ordinary missing coverage, widget clutter, giant truth scores, fake AI recommendations, and visual claims beyond evidence.
- **statement_sha256:** `7b277518f7aea141b277d9a6e5507512d068aac4cda4c42b8655b00b46547668`
- **Interpretation:** Partially deterministic: missing-coverage states must not use error/red styling (absence renders neutral/yellow, error red — GD-TRUTH-02); no score/recommendation elements exist. Clutter is rubric.
- **Preconditions & fixtures:** Status-state fixtures.
- **Scenarios:**
  - GIVEN a module with honest absence and one with source error WHEN rendered THEN absence styling is neutral, error styling distinct — absence never alarmist red
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-4.2-01

- **Source:** S1 · §4.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Desktop layout: Left "Place Lens" (compact context + data-mode chips); Centre "Interactive Map" (dominant, layer controls, legend, A/B/C pins); Right "Evidence Inspector". Bottom: time control; compare strip; concise coverage status."
- **Statement:** The desktop layout is: left Place Lens, centre dominant map with layer controls/legend/pins, right Evidence Inspector, bottom time control + compare strip + coverage status.
- **statement_sha256:** `c5154caf37c2ee5b3d9d489c812a26c5d33e8898e486f5afb4dbebe84d238141`
- **Interpretation:** Structural layout contract on ≥1280px.
- **Preconditions & fixtures:** Desktop viewport.
- **Scenarios:**
  - GIVEN a 1280px+ viewport WHEN the app renders THEN the five structural regions exist in their positions
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** manual-only

#### MP-4.2-02

- **Source:** S1 · §4.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Mobile: map primary; Lens and Inspector as accessible bottom sheets; no critical info hover-only."
- **Statement:** On mobile the map is primary, Lens and Inspector open as accessible bottom sheets, and no critical information is hover-only.
- **statement_sha256:** `3501c61ed94d5084417bdcb2e80f4085d7211a87457d93401a9f5af1ceda002f`
- **Interpretation:** Same as MP-3.1.A-08 plus the hover-only ban (which applies globally).
- **Preconditions & fixtures:** 375px viewport.
- **Scenarios:**
  - GIVEN mobile viewport WHEN the user opens Lens/Belege THEN bottom sheets open accessibly; every critical info is reachable without hover
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-PRE-01

- **Source:** S1 · Preamble · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Build a polished, local-first, map-first web application for Germany."
- **Statement:** The product is a polished, local-first, map-first web application scoped to Germany, combining permitted and documented data interfaces into one coherent premium user experience.
- **statement_sha256:** `bac909584e2b0a525843c5cbeda8c372334aaa218d3812b70105a6c055d90806`
- **Interpretation:** Local-first: fully runnable on a local machine without a cloud dependency (public-cloud deployment is separately gated by MP-3.2-19). Map-first: the interactive map is the primary surface, not an accessory widget.
- **Preconditions & fixtures:** Repository checked out; npm install completed; no external credentials required for the core experience.
- **Scenarios:**
  - GIVEN a clean clone on a supported Node version WHEN the user runs npm run dev and opens the web app THEN the application starts locally and renders the interactive Germany map as the dominant surface
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-PRE-02

- **Source:** S1 · Preamble · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "The product must feel like ONE coherent spatial product — not a directory of government portals, a set of embedded iframes, or a collection of unrelated dashboards."
- **Statement:** The product presents as one coherent spatial product: no embedded third-party iframes as product surface, no portal-directory structure, no visually unrelated dashboard collection.
- **statement_sha256:** `7e113a4d009a0156366446064bd4a01a1ad753e2cdabc7fb9761176741b53cce`
- **Interpretation:** Structural half is deterministic (no <iframe> of foreign dashboards in product code — overlaps MP-2.1-02); coherence half is a manual design judgment.
- **Preconditions & fixtures:** Built app; product source tree.
- **Scenarios:**
  - GIVEN the running application WHEN the user navigates every primary surface THEN all modules share one design system and no third-party page is embedded as product UI
- **Verifiability:** manual-rubric
- **Rubric:** Reviewer confirms: one visual language (tokens), no portal-link-list information architecture, no embedded foreign pages.
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** manual-only

### Domain: Security, secrets & privacy (8)

#### DOC-PRIV-01

- **Source:** S3 · privacy.md Third-party requests · `docs/privacy.md`
- **Quote (verbatim, whitespace-normalized):** "Requests carry an identifying `User-Agent` and respect each provider's rate and caching policy"
- **Statement:** All outbound provider requests carry an identifying User-Agent and respect per-provider rate/caching policies.
- **statement_sha256:** `8defa8696fca121f3e2223269f3022fb1e5e72d92aa786b31a256cbaa02aced1`
- **Interpretation:** The UA half is concrete and testable; the rate/cache half cross-refs MP-3.1.K-04.
- **Preconditions & fixtures:** HTTP layer.
- **Scenarios:**
  - GIVEN any provider request WHEN sent THEN the identifying UA header is present
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### GD-SEC-01

- **Source:** S4 · GD-SEC 1 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Credentials live ONLY in the untracked local `.env`; `.env.example` documents variable NAMES only; nothing key-like is committed to the repo, fixtures, docs or tests."
- **Statement:** Credentials exist only in the untracked .env; .env.example carries names only; no key-like material in repo, fixtures, docs or tests.
- **statement_sha256:** `a02fcc38ce8ec37d222e0c9ff76dd52a0fc1f787e1e5a7bfdc60fd4b0049133d`
- **Interpretation:** Gitignore coverage + repo-wide secret scan.
- **Preconditions & fixtures:** Repo tree.
- **Scenarios:**
  - GIVEN the repository WHEN secret-scanned THEN .env is ignored, .env.example has empty values, no committed file contains key-like strings
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** partial

#### GD-SEC-02

- **Source:** S4 · GD-SEC 2 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Keys are never bundled client-side; the browser talks only to the product's own API; a guard test enforces that no secret or `process.env` reference reaches the frontend bundle."
- **Statement:** Keys never reach the client bundle; the browser talks only to the product API; the guard test enforces the bundle boundary.
- **statement_sha256:** `e5a570e0a26675671b16c2d88c055c4ebe50d1ee49ad9a86aa78dc5c7394c132`
- **Interpretation:** The nonfunctional security suite is the named enforcement.
- **Preconditions & fixtures:** Built bundle.
- **Scenarios:**
  - GIVEN the production bundle WHEN scanned THEN no process.env, server-only headers, provider-package code or PRIVATE-TOKEN material
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### GD-SEC-03

- **Source:** S4 · GD-SEC 3 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Rotation rule: any credential that has ever appeared in a chat, screenshot, log or commit is treated as exposed and must be rotated at the provider portal; the new value goes directly into `.env`, nowhere else."
- **Statement:** Any credential that appeared in chat/screenshot/log/commit is treated as exposed and rotated at the provider portal; new values go only into .env.
- **statement_sha256:** `91efbb274e4e368200b159a6d9f293ab89bc2f78409ead462ec544c7cfde016f`
- **Interpretation:** Operational process rule (documented in providers-db-tankerkoenig.md); auditable per incident.
- **Preconditions & fixtures:** A credential-exposure event.
- **Scenarios:**
  - GIVEN a key that appeared in session logs WHEN handled THEN rotation at the portal is performed and recorded; the old key is dead
- **Verifiability:** manual-rubric
- **Rubric:** Per exposure incident: rotation performed at the provider portal, dated note recorded, old credential verified non-functional.
- **Risk:** severity 5 × likelihood 3 = 15 → **P1**
- **Verification status (see matrix):** manual-only

#### GD-SEC-04

- **Source:** S4 · GD-SEC 4 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "readiness reports per-provider configured/live status without echoing values; invalid or revoked keys surface as source-error envelopes carrying the HTTP status only."
- **Statement:** Readiness reports per-provider status without echoing credential values; invalid/revoked keys surface as source-error with HTTP status only (no key material in errors).
- **statement_sha256:** `46e500e79fca8fdaad3e195b76de02c5391e6d8039abc91c7740fc444b9a674c`
- **Interpretation:** Non-leaking validation: /api/readiness and error envelopes never contain secret substrings.
- **Preconditions & fixtures:** Configured + invalid-key fixtures.
- **Scenarios:**
  - GIVEN a configured provider WHEN /api/readiness is called THEN status appears without the key value
  - GIVEN a revoked key WHEN the provider errors 401/403 THEN the envelope carries only the HTTP status
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** partial

#### MP-3.1.K-03

- **Source:** S1 · §3.1.K · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "No user accounts in V1; no advertising, tracking or location-history retention; geolocation only after explicit browser permission; no secrets in frontend code."
- **Statement:** V1 has no user accounts, no advertising/tracking, no location-history retention; geolocation only after explicit permission; no secrets in frontend code.
- **statement_sha256:** `b52c30781601311e8747d9e0b76d1af2d8a6aa0349271780a87c046c51bb0061`
- **Interpretation:** Privacy posture per docs/privacy.md; the no-secrets half is enforced by the non-functional guard (GD-SEC-02).
- **Preconditions & fixtures:** Frontend bundle; source tree.
- **Scenarios:**
  - GIVEN the built frontend WHEN scanned THEN no tracker scripts, no account flows, no secret material
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-3.2-12

- **Source:** S1 · §3.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "public-cloud deployment unless separately approved."
- **Statement:** V1 is not deployed to public cloud without separate approval; the product runs local-first.
- **statement_sha256:** `3d06752524f6913c8e412267c0e4aa07138d858c4d56e1c6d3bbdef436918de4`
- **Interpretation:** Deployment-process requirement; the repo ships local/standalone paths only (Docker/pkg for the user's own machine).
- **Preconditions & fixtures:** Repo deployment configs.
- **Scenarios:**
  - GIVEN the repo WHEN reviewed THEN no cloud deployment pipeline exists without documented approval
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** manual-only

#### MP-7.4-03

- **Source:** S1 · §7.4 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "never cache precise user location history as an analytics feature."
- **Statement:** No precise user location history is cached or retained as an analytics feature; cache keys are provider request fingerprints, not user movement logs.
- **statement_sha256:** `f0e33afc888069b8da9d4b6eaf6e3053268485225359cca462195c16a29fed74`
- **Interpretation:** docs/privacy.md documents the posture; cache rows carry no user identity.
- **Preconditions & fixtures:** Cache schema.
- **Scenarios:**
  - GIVEN the cache database WHEN inspected after usage THEN rows are provider-request-keyed without user identifiers or history semantics
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 1 = 4 → **P3**
- **Verification status (see matrix):** partial
- **Notes:** Posture documented; a cache-schema assertion is PLANNED.

### Domain: Architecture, testing process, documentation & ops (32)

#### DOC-TEST-01

- **Source:** S3 · testing.md CI network · `docs/testing.md`
- **Quote (verbatim, whitespace-normalized):** "Integration tests therefore **inject** fixtures and failures rather than hitting the network, and the E2E suite uses Demo Mode. This is deliberate: the product's honest-failure behaviour is itself tested, and no test depends on a live third-party service."
- **Statement:** No CI-gating test depends on a live third-party service: integration injects fixtures/failures, E2E runs demo mode; live verification is exclusively the diagnose harness's job.
- **statement_sha256:** `ab2ebc918641fb604590b8835575a4921ac3b67b14089b81f9b4cb89c46bc8c7`
- **Interpretation:** The network-boundary policy per test layer — the backbone of the fixture policy (TEST_DATA_AND_FIXTURE_POLICY.md).
- **Preconditions & fixtures:** Test suite.
- **Scenarios:**
  - GIVEN CI with all egress blocked WHEN the full gate runs THEN everything passes — proving no hidden live dependency
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### GD-GFX-02

- **Source:** S4 · GD-GFX 2 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "pixel-screenshot CI baselines were deliberately rejected as dishonest (platform font rendering + network tiles → flaky); DOM-state assertions run in CI instead, visual review runs manually per release on the target system (Windows 11)."
- **Statement:** Visual regression strategy: deterministic DOM-state assertions in CI, release-blocking manual visual review on the target system; pixel baselines deliberately excluded as dishonest in this environment.
- **statement_sha256:** `d2dc5356a281394330990ba7b70f1a8828a6996b5d36315c1d58e132bbbff951`
- **Interpretation:** A testing-strategy norm — the exclusion is itself the requirement (adding flaky pixel gates would violate it).
- **Preconditions & fixtures:** CI config.
- **Scenarios:**
  - GIVEN the CI pipeline WHEN audited THEN no pixel-screenshot comparison gate exists; the manual checklist is release-blocking
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 2 = 4 → **P3**
- **Verification status (see matrix):** covered

#### GD-TEST-01

- **Source:** S4 · GD-TEST 1 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Every workflow and every provider data path is covered by tests: unit and integration (fixtures, failure injection), Playwright E2E (demo mode, deterministic), plus a live diagnostic sweep"
- **Statement:** Every workflow and provider data path has test coverage across unit/integration (fixtures), E2E (demo) and the live diagnose sweep.
- **statement_sha256:** `9f040ceea44a082e21badf2819f468c401477cf84fd2cdfa2ead1b7a12ddde29`
- **Interpretation:** The three-layer coverage directive; the diagnose harness (DEV-17) covers what fixtures cannot.
- **Preconditions & fixtures:** Full suite + harness.
- **Scenarios:**
  - GIVEN the provider list WHEN coverage is audited THEN each provider appears in fixture tests AND the diagnose sweep; each workflow in E2E
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-17

#### GD-TEST-02

- **Source:** S4 · GD-TEST 3 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "Live findings become root-caused fixes with regression tests — never symptom-patches."
- **Statement:** Every live finding is root-caused and fixed with a regression test; symptom-patching is not acceptable.
- **statement_sha256:** `55bad3315f79214c91d0853ec2a4f20addccc9b890f680052422b43c8b3d8496`
- **Interpretation:** Evidenced by the 2026-07-18 run record: 7 real bugs → root causes → regression tests in live-fixes.test.ts.
- **Preconditions & fixtures:** A live finding.
- **Scenarios:**
  - GIVEN a diagnose finding WHEN fixed THEN the commit carries a regression test reproducing the root cause
- **Verifiability:** manual-rubric
- **Rubric:** Audit each live-finding fix: does a regression test exist that fails on the pre-fix code? (The live-fixes suite is the precedent.)
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** manual-only

#### GD-TEST-03

- **Source:** S4 · GD-TEST 4 · `compliance-sources/goal-directive-2026-07-18.md`
- **Quote (verbatim, whitespace-normalized):** "The full gate (`npm run verify` + Playwright) must be green locally and in CI before completion claims."
- **Statement:** Completion claims require the full gate (npm run verify + Playwright) green locally AND in CI.
- **statement_sha256:** `deb636e6fa0d4982809aae394bf634c4d1801477f79b4459a4f722fbf02da92b`
- **Interpretation:** Twin of MP-0-04/MP-11-04; the both-environments clause is the directive-specific addition.
- **Preconditions & fixtures:** CI + local runs.
- **Scenarios:**
  - GIVEN a completion claim WHEN audited THEN green local and CI evidence exists (e.g. the 916f2df record)
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** planned

#### MP-0-01

- **Source:** S1 · §0 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Act at all times: serious, considered, reality-based, deep, forensic, heuristic, transparent, intelligent. Ignore marketing and advertising language of any source."
- **Statement:** The building agent works reality-based and forensically and ignores marketing language of sources; product copy never adopts promotional source language.
- **statement_sha256:** `0910fbd7429cc0419553da05eb8a00517d0b561eafc52a0e38ac8a5d5da3ee69`
- **Interpretation:** A conduct directive for the builder. The product-observable slice: UI/doc texts describe sources factually (institution, license, coverage) without promotional adjectives from provider marketing.
- **Preconditions & fixtures:** Product source tree.
- **Scenarios:**
  - GIVEN any provider description in UI or docs WHEN reviewed THEN wording is factual/technical, not promotional
- **Verifiability:** manual-rubric
- **Rubric:** Reviewer samples provider descriptions in UI + docs/data-sources.md: factual tone, no adopted marketing claims.
- **Risk:** severity 2 × likelihood 2 = 4 → **P3**
- **Verification status (see matrix):** manual-only

#### MP-0-02

- **Source:** S1 · §0 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Where a fact (endpoint, license, attribution string, coverage) is not verified in this prompt, DO NOT invent it: mark it in code and docs as "TO VERIFY" and add it to docs/data-sources.md as an open verification task before activating the provider."
- **Statement:** Every unverified fact (endpoint, license, attribution, coverage) is marked TO VERIFY in code and docs and tracked as an open verification task in docs/data-sources.md before the affected provider activates.
- **statement_sha256:** `f172cf0be5957409dde1165ce6adb2f19cd4f60515ccf94c536829d50b209ed4`
- **Interpretation:** Materialized as manifest toVerify arrays plus the consolidated TO VERIFY list in docs/data-sources.md. Activation gating itself is MP-5.2-02.
- **Preconditions & fixtures:** Manifest + docs in repo.
- **Scenarios:**
  - GIVEN a provider whose license wording is not yet confirmed against the live terms page WHEN the manifest and docs/data-sources.md are inspected THEN the item appears as TO VERIFY in both
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** partial
- **Notes:** Manifest field presence is tested; docs↔manifest toVerify equivalence has no automated check yet (PLANNED).

#### MP-0-04

- **Source:** S1 · §0 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Every acceptance criterion below is testable. Do not declare a stage complete until its acceptance criteria pass in CI."
- **Statement:** Stage completion may be declared only when the stage's acceptance criteria pass in CI; completion claims without CI evidence are invalid.
- **statement_sha256:** `4478e39e103cc44a2f486698c7135c6fb54e62858f1ceb7ef27f86ed22554c31`
- **Interpretation:** The governance layer of this blueprint (TEST_GOVERNANCE.md rule 4/6) formalizes this: verdicts require conforming evidence manifests referencing CI runs.
- **Preconditions & fixtures:** CI pipeline producing test artifacts.
- **Scenarios:**
  - GIVEN a stage is claimed complete WHEN the claim is audited THEN a CI run (green) covering that stage's criteria is referenced
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 3 = 12 → **P1**
- **Verification status (see matrix):** planned

#### MP-3.3-01

- **Source:** S1 · §3.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "FUTURE LOCAL ENRICHMENTS — opt-in, location-specific, only after source review, each requiring: named authority/operator; documented source & license; legal/technical permission; spatial reference; temporal semantics; validated schema; coverage description; visible attribution; explicit non-availability outside its verified area."
- **Statement:** Any future local enrichment is opt-in, location-specific, and passes the nine-element gate (authority, source+license, permission, spatial reference, temporal semantics, validated schema, coverage description, visible attribution, explicit out-of-area non-availability) before activation.
- **statement_sha256:** `f95c71c672c9b2c4b47017fc72f1ffb2c793f1c4fe5b3b5898982bcd17f57961`
- **Interpretation:** A checklist-gate for future providers; the manifest field set (MP-5.2-01) carries the machine-readable half.
- **Preconditions & fixtures:** A candidate enrichment (e.g. BVL).
- **Scenarios:**
  - GIVEN a proposed local enrichment WHEN activation is requested THEN all nine elements are documented or activation is refused
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** partial

#### MP-5.1-01

- **Source:** S1 · §5.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Source hierarchy: (1) official German federal/state authorities; (2) official European institutional services; (3) transport operators and verified associations; (4) official municipal sources; (5) documented supplementary cartographic sources; (6) other sources only after explicit approval."
- **Statement:** Providers are selected per the six-level source hierarchy; category-6 sources require explicit approval.
- **statement_sha256:** `d14ae1a86066b6e87d5f644d536945f75b1be2ef0d013b0e658c575e66aae73d`
- **Interpretation:** Every manifest provider carries a source category consistent with the hierarchy.
- **Preconditions & fixtures:** Manifest.
- **Scenarios:**
  - GIVEN each manifest provider WHEN categorized THEN its category maps into the hierarchy; no unapproved category-6 source is live
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-5.1-02

- **Source:** S1 · §5.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "No source is permanently presumed valid; review every integration against current documentation, license, attribution and technical terms before activation."
- **Statement:** No source is permanently presumed valid; each integration is reviewed against current documentation/license/attribution/terms before activation, with the review recorded.
- **statement_sha256:** `11302695c5de6ced84ac1b6944e5ec2bf4add85df43f56c9322b6d370a737845`
- **Interpretation:** reviewDate per manifest entry + data-sources.md review notes; re-verification tracked via TO VERIFY.
- **Preconditions & fixtures:** Manifest + docs.
- **Scenarios:**
  - GIVEN an activated provider WHEN audited THEN a dated review exists
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered

#### MP-5.2-01

- **Source:** S1 · §5.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Provider manifest — versioned, machine-readable, per provider: provider ID; display name; responsible institution; source category; original source URL; technical endpoint/ configuration; access method; license; attribution text; coverage; update cadence; supported data modes; supported geographic semantics; validation schema version; cache policy; status (proposed | verified | suspended | deprecated); review date; known limitations."
- **Statement:** A versioned machine-readable provider manifest exists with the full 18-field set per provider.
- **statement_sha256:** `c9c55c4c6d08df11019c0480277d2546cd75f58e4270b3edc6a8b3ef86382210`
- **Interpretation:** packages/providers/src/manifest.ts, version 2026-07-18.1, 22 entries.
- **Preconditions & fixtures:** Manifest module.
- **Scenarios:**
  - GIVEN the manifest WHEN validated THEN every entry carries all mandatory fields and a version string exists
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-7.1-01

- **Source:** S1 · §7.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Node.js 24 LTS (Active LTS "Krypton", released 2025-05-06, EOL 2028-04-30). Do NOT default to Node 22 (Maintenance LTS, EOL 2027-04-30) unless a dependency requires it;"
- **Statement:** The target runtime is Node 24 LTS; Node 22 only where the environment requires it, documented in decisions.md.
- **statement_sha256:** `c559b5151e3283204229edc8c0d4e60922cc9e630f8b7c4d9e43d0d7fbaca7af`
- **Interpretation:** DEV-01: build env had Node 22.22.2; engines set to >=22.11 with Node 24 recommended — a documented superseding deviation, not silent drift.
- **Preconditions & fixtures:** package.json engines; decisions.md.
- **Scenarios:**
  - GIVEN the repo WHEN engines and decisions are read THEN the Node-version decision is documented with rationale; app runs on 22 and 24
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 2 = 4 → **P3**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-01

#### MP-7.1-02

- **Source:** S1 · §7.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "npm workspaces; TypeScript (strict mode); React + Vite frontend; Fastify backend."
- **Statement:** The stack is npm workspaces, strict TypeScript, React+Vite frontend, Fastify backend.
- **statement_sha256:** `d7b2286d6b7e0fc57ee0d64d62199de09e4af4842679479308033a73cdf969bd`
- **Interpretation:** Structural stack requirement; verified by config presence + build.
- **Preconditions & fixtures:** Repo.
- **Scenarios:**
  - GIVEN the repo WHEN built THEN workspaces resolve, tsc strict passes, Vite builds the web, Fastify serves the API
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-7.1-03

- **Source:** S1 · §7.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "MapLibre GL JS v5 (current stable line; latest v5 is 5.24.0, the final v5 release series; 3-Clause BSD)."
- **Statement:** MapLibre GL JS stays on the v5 line for V1; v6 is not adopted.
- **statement_sha256:** `410ad98d37caa8889521c6009f0f50bf169cfbe942ff5e839ae99c5def9de3e6`
- **Interpretation:** Pinned ^5.6.0 (decisions.md).
- **Preconditions & fixtures:** package.json.
- **Scenarios:**
  - GIVEN dependencies WHEN read THEN maplibre-gl is a v5 range
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 1 = 2 → **P3**
- **Verification status (see matrix):** planned

#### MP-7.1-04

- **Source:** S1 · §7.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "SQLite for local cache/reference metadata: default better-sqlite3. The built-in node:sqlite is a viable alternative (Release Candidate as of Node 24.15.0,"
- **Statement:** SQLite backs the local cache; the driver choice (better-sqlite3 default, node:sqlite permitted after parity verification) is documented in decisions.md.
- **statement_sha256:** `de4c9925f7aeafe4c8ca6ec8d0fdfe1d96ab33635bbd46ffb71b8bbe261e9f01`
- **Interpretation:** DEV-02: started on better-sqlite3, later switched to node:sqlite behind a shim with the parity concerns (transaction wrapper) explicitly handled — a permitted, documented path. NOTE: decisions.md 2026-07-17 records the switch while the pinned-versions table still lists better-sqlite3 — flagged as AMB-07.
- **Preconditions & fixtures:** sqlite shim + decisions.md.
- **Scenarios:**
  - GIVEN the cache layer WHEN exercised THEN SQLite round-trips work on the documented driver; the shim provides transaction semantics
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 2 = 6 → **P2**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-02

#### MP-7.1-05

- **Source:** S1 · §7.1 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Version policy: where a specific version is not verified at build time, use the current stable/LTS release and record the pinned version in docs/decisions.md."
- **Statement:** Dependency versions follow current stable/LTS and are recorded in docs/decisions.md.
- **statement_sha256:** `97e415cb3ec332df8fff0ad5df934f198d96a4c5301b9de3bb7e38bfda89b55a`
- **Interpretation:** The pinned-versions table exists; exact resolutions in package-lock.json.
- **Preconditions & fixtures:** decisions.md.
- **Scenarios:**
  - GIVEN the decision log WHEN read THEN a pinned-version table covers the core dependencies
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 1 = 2 → **P3**
- **Verification status (see matrix):** partial
- **Notes:** Table exists; automated docs-vs-package consistency check PLANNED. See AMB-07 for the known better-sqlite3 row staleness.

#### MP-7.2-01

- **Source:** S1 · §7.2 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "apps/ web/ (React + MapLibre) api/ (Fastify API + provider orchestration) packages/ contracts/ (Zod + types) evidence/ (evidence/availability/limitations) providers/ (source adapters) map-style/ (layer styles, legends, tokens) ui/ (accessible components) test-fixtures/ (demo + provider fixtures)"
- **Statement:** The workspace layout follows the specified boundaries: apps/web, apps/api, packages/contracts, evidence, providers, map-style (+ ui and test-fixtures per charter).
- **statement_sha256:** `c0e63f6a2d4d8a913d3f07e261f34007b2711bd68ab4ad334741b6dac87db514`
- **Interpretation:** DEV-15: packages/ui was never created (components live in apps/web) and fixtures live within package test dirs — an adjudicated deviation (gap: structural, low impact) rather than silent drift.
- **Preconditions & fixtures:** Repo tree.
- **Scenarios:**
  - GIVEN the repo WHEN listed THEN the workspace dirs exist per the as-built layout; the ui/test-fixtures deviation is registered
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 1 = 2 → **P3**
- **Verification status (see matrix):** covered
- **Deviation refs:** DEV-15

#### MP-7.3-01

- **Source:** S1 · §7.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "each adapter is isolated and exposes normalized contracts: source -> fetch/permitted download -> runtime validation -> provider-specific normalization -> Evidence attachment -> cache with source-aware TTL -> normalized API response -> map/lens/inspector/comparison UI."
- **Statement:** Every adapter follows the isolated pipeline: fetch → runtime validation → normalization → Evidence attachment → source-aware cache → normalized API response.
- **statement_sha256:** `4bba35e1458108e32af001d32c49464814297078176f145c614a0388cb8a6348`
- **Interpretation:** The runner + adapter pattern; per-adapter tests exercise each pipeline step.
- **Preconditions & fixtures:** Providers package.
- **Scenarios:**
  - GIVEN any adapter WHEN run against a fixture THEN the output is a normalized envelope with evidence and cache metadata
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-7.3-02

- **Source:** S1 · §7.3 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "NO provider parsing logic in React components."
- **Statement:** React components contain no provider parsing logic; they consume normalized envelopes only.
- **statement_sha256:** `c517f5d8be00b5218cffcc93d25436e9ba2eae9b876e3c4f9af3a991bd13b7e0`
- **Interpretation:** Frontend never imports the providers package (also a security boundary — GD-SEC-02).
- **Preconditions & fixtures:** Web source.
- **Scenarios:**
  - GIVEN apps/web/src WHEN scanned THEN no import of packages/providers; no raw provider payload parsing
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-10.0-01

- **Source:** S1 · §10 Stage 0 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Acceptance: local start works; lint, typecheck, tests pass; demo mode permanently labelled; no live source call exists without a provider-manifest entry."
- **Statement:** Stage 0 acceptance: local start works; lint/typecheck/tests pass; demo mode permanently labelled; no live source call exists without a provider-manifest entry.
- **statement_sha256:** `fb00f9fb2d10f26c992d76430ad096a94eaab6e16d9474e6d4b3971bb42de739`
- **Interpretation:** Acceptance bundle. Cross-refs: MP-PRE-01 (local start), MP-11-04 (gates), MP-3.1.J-04 (demo label), MP-5.2-02 (manifest gate). The no-call-without-manifest clause is broader than the verified gate: EVERY outbound source call must trace to a manifest entry.
- **Preconditions & fixtures:** Repo; CI.
- **Scenarios:**
  - GIVEN the Stage 0 criteria WHEN CI runs + the host audit executes THEN all four criteria hold
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-10.7-01

- **Source:** S1 · §10 Stage 7 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Performance and cache behavior; mobile sheets + keyboard interaction; robust empty/error/stale states; complete attribution, source docs, privacy docs, release report; independent reviews."
- **Statement:** Stage 7 hardening covers performance/cache behaviour, mobile+keyboard interaction, robust empty/error/stale states, complete attribution and docs, and independent reviews.
- **statement_sha256:** `4f9a3e22eb74018a2dab86cb1eeab95db9b4063b80d475eefd9c90f37cfd01eb`
- **Interpretation:** The 'independent reviews' clause is the novel norm: reviews not performed by the change author (ties to TEST_GOVERNANCE rule 4 agent-separation).
- **Preconditions & fixtures:** Release candidate.
- **Scenarios:**
  - GIVEN a release candidate WHEN hardening review runs THEN an independent reviewer (human or separate adversarial agent) signs the checklist
- **Verifiability:** manual-rubric
- **Rubric:** Release checklist signed by a reviewer distinct from the implementation author; attestation names reviewer + date + scope.
- **Risk:** severity 3 × likelihood 3 = 9 → **P2**
- **Verification status (see matrix):** manual-only

#### MP-11-01

- **Source:** S1 · §11 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Unit: evidence construction/propagation; data-mode rendering; timezone & DST handling (incl. UBA CET normalization); provider status rules; cache freshness/staleness; station-distance logic; comparability rules; transit coverage status; demo/live separation; wording-policy helpers."
- **Statement:** Unit tests exist and pass for all ten mandated topics: evidence construction/propagation, data-mode rendering, timezone/DST incl. UBA CET, provider status rules, cache freshness, station distance, comparability, transit coverage, demo/live separation, wording helpers.
- **statement_sha256:** `6f0d5a54bdf37b8c34ced197fc88332dde41caf79d6b0ee4140400afc284ef33`
- **Interpretation:** Each topic maps to a named existing describe block (see layers).
- **Preconditions & fixtures:** Vitest suite.
- **Scenarios:**
  - GIVEN npm test WHEN run THEN all ten topic suites exist and pass
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-11-02

- **Source:** S1 · §11 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Integration (fixtures): valid response; missing value; partial; provisional; stale cache; malformed schema; timeout; rate limit (429 from Overpass/Nominatim); source outage; provider coverage gap; incompatible comparison; demo source."
- **Statement:** Integration tests exercise the twelve fixture scenarios (valid, missing, partial, provisional, stale, malformed, timeout, 429, outage, coverage gap, incompatible comparison, demo) per applicable adapter.
- **statement_sha256:** `76104dc5737bba060f391d04d596a066099acf196f53ed4bea0b8cb69de18553`
- **Interpretation:** The fixture-scenario checklist; the matrix `cases` fields per provider requirement instantiate it.
- **Preconditions & fixtures:** Fixture library.
- **Scenarios:**
  - GIVEN the integration suite WHEN run THEN each of the twelve scenario classes is exercised somewhere with honest-outcome assertions
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** covered

#### MP-11-03

- **Source:** S1 · §11 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Playwright: search + map-click selection; layer switching; inspector opening; time control; A/B/C pin + comparison; weather/air/transit state labels; explicit unavailable/partial/ stale views; keyboard navigation; reduced-motion; mobile bottom-sheet flow; demo banner + demo/live exclusion."
- **Statement:** Playwright E2E covers the eleven mandated flows: selection (search+click), layer switching, inspector, time control, A/B/C, state labels, unavailable/partial/stale views, keyboard, reduced-motion, mobile sheets, demo banner+exclusion.
- **statement_sha256:** `4a93f0eb60fa30fd4b629b4977595a6833697c34a2ca16cc51bb0e177cb3ac77`
- **Interpretation:** 13 existing specs cover most; the explicit unavailable/partial/stale walkthrough is the known gap (partial).
- **Preconditions & fixtures:** Playwright suite (demo mode).
- **Scenarios:**
  - GIVEN npx playwright test WHEN run THEN the flow catalogue passes; missing flows are tracked planned
- **Verifiability:** deterministic
- **Risk:** severity 4 × likelihood 2 = 8 → **P2**
- **Verification status (see matrix):** partial

#### MP-11-04

- **Source:** S1 · §11 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Quality gates before V1 complete: lint passes; formatting passes; strict typecheck passes; unit/integration/E2E pass; production build passes; manual review of attribution + visible limitations passes; no blocked source-governance issue remains undocumented."
- **Statement:** V1 completion requires the seven quality gates: lint, formatting, strict typecheck, unit/integration/E2E, production build, manual attribution/limitations review, and no undocumented blocked source-governance issue.
- **statement_sha256:** `3db46a9e3ff19a353c3ea617d88d0e5049a53a718344085a30cbe15f13084621`
- **Interpretation:** npm run verify + Playwright + manual review + TO VERIFY registry currency.
- **Preconditions & fixtures:** CI + release checklist.
- **Scenarios:**
  - GIVEN a V1-complete claim WHEN audited THEN all seven gates have green evidence
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-12-01

- **Source:** S1 · §12 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "Maintain: README.md (setup, run, tests, env vars, architecture, limits); docs/ product-charter.md; architecture.md; data-sources.md (provider manifest summary, license, attribution, coverage, limitations, and every "TO VERIFY" item); evidence-policy.md; map-semantics.md; privacy.md; testing.md; decisions.md (incl. pinned dependency versions); progress.md; release-v1.md."
- **Statement:** The eleven mandated documents exist and are maintained: README + the ten docs/ files with their specified contents.
- **statement_sha256:** `fcba258923d35542359a595ad4ae8e7ce55e8b292d2520b2afc7caf90ec983b0`
- **Interpretation:** File presence + content-scope audit.
- **Preconditions & fixtures:** Repo.
- **Scenarios:**
  - GIVEN the repo WHEN audited THEN all eleven files exist with their mandated content areas
- **Verifiability:** deterministic
- **Risk:** severity 3 × likelihood 1 = 3 → **P3**
- **Verification status (see matrix):** covered

#### MP-12-02

- **Source:** S1 · §12 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "progress.md records after each stage: implemented work; tested behavior; known gaps; active providers; provider coverage; blocked source issues; next smallest shippable slice."
- **Statement:** progress.md records per stage: implemented work, tested behaviour, known gaps, active providers, coverage, blocked issues, next smallest shippable slice.
- **statement_sha256:** `0e6f883a84c5e3de36b6eed4ee966d2f907acf10dfb90fe3e44fb7b3d7acf676`
- **Interpretation:** Content contract for the progress log.
- **Preconditions & fixtures:** progress.md.
- **Scenarios:**
  - GIVEN each completed stage WHEN progress.md is read THEN the seven content areas are present for that stage
- **Verifiability:** deterministic
- **Risk:** severity 2 × likelihood 2 = 4 → **P3**
- **Verification status (see matrix):** partial

#### MP-13-01

- **Source:** S1 · §13 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "1. User chooses a German place by search or map click. 2. User chooses a relevant time."
- **Statement:** DoD 1-2: the user can choose a German place by search or map click and choose a relevant time.
- **statement_sha256:** `c9f1c84068245be02f7872fe7c9091e232e9608239e9295d00969648d2b44aef`
- **Interpretation:** Acceptance anchors over MP-3.1.A-*, MP-3.1.B-01.
- **Preconditions & fixtures:** Demo mode.
- **Scenarios:**
  - GIVEN the app WHEN selection+time flows run THEN both succeed
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 1 = 5 → **P2**
- **Verification status (see matrix):** covered

#### MP-13-02

- **Source:** S1 · §13 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "3. User inspects DWD-backed weather/warning context. 4. User inspects UBA station-based air context, where available. 5. User inspects optional CAMS regional context only if correctly integrated and visibly modelled (~10 km grid, Copernicus attribution). 6. User sees supplementary mapped place/POI context (OSM attribution). 7. User inspects transit information availability without false realtime/routing/ reliability claims."
- **Statement:** DoD 3-7: the user inspects DWD weather/warnings, UBA station air where available, CAMS only-if-correctly-integrated, mapped POI context with OSM attribution, and transit availability without false claims.
- **statement_sha256:** `1d2019b3b7f95f90f2e6669a242afa28cf7813276637be4ed1ce71f8767f2c0d`
- **Interpretation:** Acceptance over the provider modules; CAMS clause satisfied by honest gating while unconfigured.
- **Preconditions & fixtures:** Live or demo envelopes.
- **Scenarios:**
  - GIVEN a selected place WHEN modules render THEN each context is inspectable per its rules; CAMS shows configuration-required until integrated
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-13-03

- **Source:** S1 · §13 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "8. User pins and compares A/B/C places. 9. Every material claim has inspectable source, time, data mode, spatial meaning, limitations. 10. Data gaps are first-class UI states. 11. Demo data is visibly and technically separate from live data."
- **Statement:** DoD 8-11: A/B/C comparison works; every material claim is fully inspectable; data gaps are first-class UI states; demo is visibly and technically separate.
- **statement_sha256:** `fcac9e17c520763a6492b882f54721c52098384dbab104be1d17dc198b6023e6`
- **Interpretation:** Acceptance over MP-3.1.G/H/I/J.
- **Preconditions & fixtures:** Demo mode.
- **Scenarios:**
  - GIVEN the app WHEN the four criteria run THEN all pass
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

#### MP-13-04

- **Source:** S1 · §13 · `docs/MASTERPROMPT.md`
- **Quote (verbatim, whitespace-normalized):** "12. The application is accessible, tested, documented, locally runnable. 13. It makes NO claim outside the source evidence. 14. Every activated provider is CC/DL-DE/ODbL/Copernicus-attributed as required, and no provider is live without a "verified" manifest entry."
- **Statement:** DoD 12-14: accessible/tested/documented/locally runnable; no claim outside source evidence; every activated provider correctly attributed and gated on a verified manifest entry.
- **statement_sha256:** `201387a8a61a88f865eded3217db57a5028bac7991b0b6edb735a37748619e8d`
- **Interpretation:** Acceptance over MP-3.1.K, §9 scans, §5 governance.
- **Preconditions & fixtures:** Full suite + manifest.
- **Scenarios:**
  - GIVEN the release candidate WHEN the three criteria are audited THEN all hold with evidence
- **Verifiability:** deterministic
- **Risk:** severity 5 × likelihood 2 = 10 → **P1**
- **Verification status (see matrix):** covered

---

*End of specification. 214 requirements. Statements are immutable; supersession only.*
