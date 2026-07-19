# Test Data & Fixture Policy — The Invisible City

```yaml
policy_version: 1.1.0
date: 2026-07-19
companion: MASTERPROMPT_REQUIREMENTS.md · MASTERPROMPT_TEST_MATRIX.yaml · TEST_GOVERNANCE.md
amendments:
  - 1.1.0 (2026-07-19): §3 adds the degraded-state E2E lane (Playwright route interception
    serving contract-validated envelopes; no request leaves the browser; demo off).
```

Binding rules for every fixture, stub, reference location and credential that test code,
documentation or the diagnose harness touches. Violations are governance findings
([TEST_GOVERNANCE.md](TEST_GOVERNANCE.md) rule 3/4 territory), not style issues.

---

## 1. Fixture provenance

1. **Provider-shaped, documentation-anchored.** Every provider fixture mirrors the
   *documented* response schema of its real interface (the schema recorded in
   [docs/data-sources.md](docs/data-sources.md) and validated by the adapter's Zod schema).
   A fixture that would not parse through the adapter's own runtime validation is invalid
   by definition.
2. **Live-verified stamps.** Where a schema detail was confirmed against the live service,
   the fixture (or its loader) carries a dated stamp comment, e.g.
   `live-verified 2026-07-18: coordinate.lat/long are numbers, not strings (Autobahn)`.
   Stamps name the date and the diagnose run that proved the shape. Current stamped facts
   include: UBA host + positional indices + activity columns; BKG deegree bbox semantics +
   `ars`/`gen` properties; CDC autoindex filenames; Autobahn numeric coordinates; Photon
   city-state `state` omission; GEOFON FDSN text + 204 semantics; Tankerkönig `false`→null
   price fields; DB FaSta v2 equipment fields (all 2026-07-18).
3. **Failure fixtures are first-class.** Each adapter keeps, alongside its happy-path
   fixture, the §11 failure catalogue as applicable: missing value · partial · provisional ·
   stale cache · malformed schema · timeout · 429 · outage · coverage gap · incompatible
   comparison · demo (matrix requirement MP-11-02). A new adapter without failure fixtures
   cannot reach `covered` for its requirements.
4. **No invented source semantics.** A fixture must not encode a field, unit or value range
   that the documented interface does not supply. If a semantic is unverified, the fixture
   marks it `TO VERIFY` exactly as the manifest does (MP-0-02) — fixtures never launder an
   unverified assumption into "tested behaviour".

## 2. Determinism rules

1. **Frozen clocks.** Any test whose assertion depends on "now" uses an injected/frozen
   clock (Vitest fake timers or an explicit `now` parameter). Fixtures carry **fixed
   ISO timestamps**, never values computed from `Date.now()` at load time.
   - Time-semantics tests (DST boundaries, UBA CET hour-24, stale-cache TTL edges) pin
     both the source instant and the evaluation instant.
2. **No hidden randomness.** Fixtures contain no random values. Where a test needs varied
   input, the variation is enumerated (table-driven) or produced by a **seeded** generator
   whose seed is committed. A flaky test is treated as a defect, not re-run to green
   (governance rule 3 — no retry-until-pass).
3. **Order independence.** Fixture files are immutable during a run; tests never depend on
   execution order or on residue in `var/*.sqlite` (cache tests create/destroy their own
   isolated database files).
4. **Stable identifiers.** Fixture station/stop/facility IDs are real-shaped but stable;
   assertions reference them literally, so a fixture edit that changes an ID is visible in
   the diff (see §7 update protocol).

## 3. Network policy per layer

| Layer | Network access | Rationale |
| --- | --- | --- |
| Unit / integration (Vitest) | **None.** Stubs/fixtures/failure injection only. | The full gate must stay green in an egress-blocked environment (DOC-TEST-01); honest-failure behaviour is itself under test. |
| Component (jsdom) | **None.** Mocked API + real store. | Determinism. |
| E2E (Playwright), demo lane | **Demo mode only** — the product API serves the demo fixture set; the only external fetch permitted is base-map tiles, and specs must not assert on tile content. | Deterministic offline UI truth (MP-11-03). |
| E2E (Playwright), degraded-state lane | **Route interception only** — Playwright serves contract-validated `ModuleEnvelope` fixtures (`e2e/support/envelope-fixtures.ts`, every fixture `.parse`d through the real Zod contract); map hosts stubbed/aborted; `serviceWorkers: 'block'`; demo mode OFF and every envelope `demo:false`. No request leaves the browser. | The honest non-ok states (unavailable/partial/stale/source-error/configuration-required) never occur in demo mode, yet their rendering is a P1 requirement (MP-3.1.J-01/02); this lane exercises them without adding any fake-data path to production code and without mixing demo and live. |
| Live verification | **Diagnose harness only** (`npm run diagnose`, `/diagnose.html`). | The single sanctioned live path (GD-TEST-01, DEV-17); its findings are triaged per AMB-03 (environmental vs product defect), never auto-gate CI. |

A CI-gating test that opens a socket to a provider host is a policy violation regardless of
whether it passes.

## 4. Canonical reference locations (the registry)

The ten locations below are the **only** sanctioned coordinates for cross-provider tests,
fixtures and live sweeps. They are chosen to cover urban, rural, island, offshore, alpine
and border behaviour (GD-SPATIAL-06). Adding/changing a location is a policy change
(diff-reviewed, this file updated), not an ad-hoc test edit.

| # | Name | Lat | Lon | Role |
| --- | --- | --- | --- | --- |
| 1 | Trier | 49.7596 | 6.6439 | Primary regression city (UBA host fix, NINA ARS `072110000000`, CDC normals) |
| 2 | Berlin | 52.52 | 13.405 | Capital; city-state Bundesland derivation; decommissioned-station (zDDR) regression |
| 3 | München | 48.137 | 11.575 | Large southern city |
| 4 | Hamburg | 53.551 | 9.993 | Northern city-state |
| 5 | Köln | 50.938 | 6.96 | Autobahn-event density (8 events ≤ 30 km baseline) |
| 6 | Eifel (ländlich) | 50.3 | 6.6 | Rural sparsity — distant stations must be "regionale Referenz" |
| 7 | Sylt (Insel) | 54.9 | 8.3 | Island — absence stays absence |
| 8 | Nordsee (offshore) | 54.5 | 6.5 | Offshore — honest unavailability is the EXPECTED result |
| 9 | Zugspitze (alpin) | 47.421 | 10.985 | Alpine edge |
| 10 | Aachen (Grenze) | 50.77 | 6.08 | Border town — DE-filtering and coverage edges |

Boundary-coordinate probes used by the API-surface checks (border 52.0/5.87 · sea 54.0/7.9 ·
alpine 47.42/10.98) are auxiliary inputs of diagnose check C4, not registry members.

## 5. Demo / live separation in test data

1. Demo fixtures live only in the demo fixture set consumed by the **real** adapters in
   demo mode; they are stamped `demo` end-to-end (MP-3.1.J-04/05).
2. No test mixes demo-stamped and live-shaped envelopes in one assertion of product
   behaviour, except tests whose *subject* is the demo/live exclusion itself (comparability
   refusal, banner presence).
3. Live-path artifacts (diagnose reports) never feed fixture files directly — see §7 for
   the sanctioned conversion path.

## 6. Credentials

1. **No real credentials in fixtures, docs, tests or committed files. Ever.** Fixture keys
   use the reserved placeholder shapes `TEST-KEY-…` / `00000000-0000-0000-0000-000000000000`,
   which the live HTTP layer can never accept.
2. Real credentials exist only in the untracked local `.env` (GD-SEC-01); `.env.example`
   documents names only.
3. **Rotation rule** (GD-SEC-03, [docs/providers-db-tankerkoenig.md](docs/providers-db-tankerkoenig.md)):
   any credential that has ever appeared in a chat, screenshot, log, commit — or a test
   artifact — is exposed: rotate at the provider portal, new value straight into `.env`,
   record the rotation with a date.
4. Evidence files (HAR, diagnose reports, screenshots) are scrubbed of `Authorization`/key
   headers and query-string keys before being stored as evidence; an evidence file
   containing a live credential invalidates itself and triggers the rotation rule.

## 7. Fixture-update protocol

A fixture may change **only** through this sequence:

1. **Cited live evidence.** The change references a dated diagnose run (report file +
   sha256, per TEST_EVIDENCE_MANIFEST) or a dated provider-documentation change proving the
   new shape. "The test wanted a different value" is not evidence.
2. **Diff review.** The fixture diff is reviewed together with the adapter/test diff by
   someone (human or adversarial agent) who is not the author of the change
   (TEST_GOVERNANCE.md rule 4). The reviewer's question is: *does this fixture change
   describe the source more accurately, or does it make a failing assertion pass?*
3. **Stamp update.** The live-verified stamp (date + run) is updated in the same commit.
4. **No assertion weakening by fixture edit.** Replacing a fixture that exercised a
   boundary (e.g. a `false` fuel price, a decommissioned station, a >24 h GTFS time) with a
   blander one is assertion-weakening (governance rule 2) unless the boundary case is
   preserved elsewhere in the same suite.

---

*Referenced by matrix `preconditions` fields. Changes to this policy are versioned and
diff-reviewed like requirement changes (TEST_GOVERNANCE.md rule 1 applies to the policy's
own hash pin in evidence manifests where cited).*
