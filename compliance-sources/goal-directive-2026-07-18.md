# Goal directives — user session 2026-07-18 (S4 compliance source)

**Provenance:** This file materializes the goal directives the user issued in the
working session of 2026-07-18 (map-pointer stability, central spatial contract,
truthfulness, DB + Tankerkönig integration, required tests, graphical QA, secrets
handling). The original chat wording is **not verbatim-recoverable** at pinning
time (the session context was summarized before this file was created). Each
directive below is therefore a **faithful reconstruction** of intent and scope,
cross-checked against the artifacts that were produced in direct response to the
directives on the same day (`docs/spatial-contract.md`,
`docs/providers-db-tankerkoenig.md`, `docs/qa-checklist.md`,
`docs/live-testplan.md`, `apps/web/src/selection.ts` and its tests). It is NOT a
verbatim quotation and must never be cited as one. See Ambiguity Register entry
AMB-05 in `MASTERPROMPT_REQUIREMENTS.md`.

**Immutability:** once pinned (sha256 in the source register of
`MASTERPROMPT_REQUIREMENTS.md`), this file is never edited. Corrections happen by
adding a new dated file and superseding the affected `GD-*` requirements.

---

## GD-MAP — Map-pointer correctness and stability

The selected analysis point must behave deterministically and stay put:

1. Search-selection and map-click must place the marker exactly at the selected
   place; the map flies there; Place Lens and all modules load for exactly those
   coordinates.
2. The selection may change ONLY through an explicit user action (search select,
   map click/tap, comparison-pin restore). Zoom, pan, resize, layer switching,
   data refreshes, rerenders, retries and slow responses must NEVER move the
   selection or the marker.
3. Asynchronous responses must never override a newer selection: a stale
   reverse-geocode result for an earlier map click must not snap the map back
   after the user has selected something else (the "pointer-jump race").
4. Repeated selection cycles must land correctly every time — no drift, no stale
   data attributed to the new place.
5. The keyboard path (type query, ArrowDown, Enter) must behave identically to
   the mouse path; Enter confirms the highlighted or first result.

## GD-SPATIAL — One central spatial-selection contract

"Nearby data" must be governed by ONE deterministic, documented, shared system —
not per-module improvisation:

1. Exactly one authoritative `SelectedPlace`; every module reads it; none owns a
   private copy.
2. Single canonical implementations for coordinate handling (WGS84, GeoJSON
   `[lon, lat]` converted once per adapter at the parse boundary), distance (one
   haversine), distance display (German formatting), and time display
   (Europe/Berlin).
3. Per-provider applicability rules (radius, containment, reference-location,
   region assignment) are explicit, documented in `docs/spatial-contract.md`,
   and domain-aware — never a bare "closest wins".
4. A station/probe beyond 5 km is a "regionale Referenz", never a local value;
   distance is always shown.
5. No qualifying data ⇒ an honest `unavailable` with a German statusDetail that
   names the radius/rule — never a silent nearest-anyway substitution, never a
   fabricated local report.
6. Boundary behaviour (inside/at/beyond radius, rural, island, offshore, alpine,
   border) is defined and tested.

## GD-TRUTH — Truthfulness of every displayed value

1. Nothing invented, nothing silently repaired, nothing extrapolated: every
   displayed value traces to a real provider response, with provenance
   (provider, license, attribution, data mode, times, spatial relation,
   limitations) inspectable per value.
2. Honest absence is a first-class outcome and visually distinct from failure
   (absence ≠ error); configuration-required states name the exact missing
   environment variable.
3. Demo data is opt-in, permanently banner-labelled, and never mixes with live
   data in any panel, conclusion or comparison; provider failure never triggers
   a silent demo fallback.
4. Cached/stale data is served only when visibly labelled with its age; "Live"
   wording is never applied to cached or scheduled data.

## GD-DBTK — Deutsche Bahn (FaSta) and Tankerkönig integration

1. Integrate DB FaSta (station elevator/escalator status) and Tankerkönig
   (MTS-K fuel prices) as full server-side adapters behind the shared
   normalized contract and the central spatial contract.
2. Both activate automatically the moment their credentials appear in the local
   `.env`; until then the API returns an honest `configuration-required`
   envelope naming the exact variable(s); all other modules keep working.
3. FaSta: facilities within 3 km with real distances; `UNKNOWN` state is
   rendered as "not determinable", never as "working"; no timetable claims.
4. Tankerkönig: stations within 5 km with distances; documented `false` prices
   become `null`, never `0`; missing fuel types stay missing; no invented
   prices or opening states.
5. Both live-verifiable via the diagnose harness once keys exist.

## GD-TEST — Required tests

1. Every workflow and every provider data path is covered by tests: unit and
   integration (fixtures, failure injection), Playwright E2E (demo mode,
   deterministic), plus a live diagnostic sweep (`npm run diagnose` and
   `/diagnose.html`) for what fixtures cannot check — real endpoints, real
   schemas, real latency.
2. The pointer-jump race (GD-MAP-03) has dedicated regression tests.
3. Live findings become root-caused fixes with regression tests — never
   symptom-patches.
4. The full gate (`npm run verify` + Playwright) must be green locally and in CI
   before completion claims.

## GD-GFX — Graphical/visual QA

1. The UI must be visually polished, uncluttered and legible on desktop
   (≥1280px), tablet (768px) and mobile (375px), at 100% and 150% browser zoom:
   no overlap, no clipping, no overflow; legends and controls readable and
   reachable.
2. A release-blocking manual visual checklist exists (`docs/qa-checklist.md`)
   because pixel-screenshot CI baselines were deliberately rejected as
   dishonest (platform font rendering + network tiles → flaky); DOM-state
   assertions run in CI instead, visual review runs manually per release on the
   target system (Windows 11).

## GD-SEC — Secrets handling

1. Credentials live ONLY in the untracked local `.env`; `.env.example` documents
   variable NAMES only; nothing key-like is committed to the repo, fixtures,
   docs or tests.
2. Keys are never bundled client-side; the browser talks only to the product's
   own API; a guard test enforces that no secret or `process.env` reference
   reaches the frontend bundle.
3. Rotation rule: any credential that has ever appeared in a chat, screenshot,
   log or commit is treated as exposed and must be rotated at the provider
   portal; the new value goes directly into `.env`, nowhere else.
4. Startup validation is honest and non-leaking: readiness reports
   per-provider configured/live status without echoing values; invalid or
   revoked keys surface as source-error envelopes carrying the HTTP status
   only.
