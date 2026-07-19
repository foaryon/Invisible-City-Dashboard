# Test Governance — Anti-Gaming Constitution

```yaml
governance_version: 1.0.0
date: 2026-07-19
scope: MASTERPROMPT_REQUIREMENTS.md · MASTERPROMPT_TEST_MATRIX.yaml ·
  TEST_EVIDENCE_MANIFEST.schema.json · TEST_DATA_AND_FIXTURE_POLICY.md · all test suites
enforcement: rules are CHECKABLE; the CI gate contract per rule is specified below.
  The gate script itself is deliberately NOT implemented in this change (documentation
  blueprint only) — the contracts are written so a future `scripts/governance-gate.mjs`
  can implement them without reinterpretation.
```

Purpose: make it structurally impossible — for a human in a hurry or an agent optimizing
"tests green" — to weaken this project's verification without leaving a visible, reviewable
trace. Every rule states (a) the norm, (b) what the CI gate checks, (c) what a violation
looks like.

---

## Rule 1 — Requirement immutability

**Norm.** Requirement IDs are immutable; statements are never edited in place. Every
requirement carries `statement_sha256`. A statement change is a **supersession**: the old
entry remains with `superseded_by: <new-id>`, the new entry gets a new ID and its own hash.
The pinned source register (S1–S4 file hashes in MASTERPROMPT_REQUIREMENTS.md) is equally
immutable: a source file edit requires re-pinning plus an extraction re-audit note.

**CI gate contract.**
- Recompute sha256 over every requirement `statement` in the requirements doc and compare
  with the printed `statement_sha256`; fail on any drift.
- Compare the requirements doc's source-register hashes against the current files
  (`docs/MASTERPROMPT.md`, S3 docs, `compliance-sources/*`); fail on mismatch unless the
  same commit updates the register row AND adds a dated re-audit note.
- Diff-detect ID deletions: an ID present in the previous release's doc must exist in the
  current doc (possibly superseded); fail on silent disappearance.
- Verify `MASTERPROMPT_TEST_MATRIX.yaml` `requirements_doc_sha256` matches the actual doc.
- Hash comparisons are byte-exact: the pinned files carry `-text` in `.gitattributes` so no
  platform EOL conversion can silently break a pin; the gate fails if a pinned path loses
  its `-text` attribute.

**Violation looks like.** A reworded statement under the same ID; a vanished requirement; a
source-file edit with an unchanged register hash.

## Rule 2 — Assertion-weakening ban

**Norm.** The matrix `oracles` are **normative**: tests implement them, not vice versa.
Deleting an oracle, replacing an exact assertion with a weaker one (`toBe` → `toBeTruthy`,
exact string → substring, closed enum → any-string), widening a numeric tolerance, or
downgrading a `status` (`covered` → anything) requires a governance entry in this file's
change log (below) naming the oracle, the reason, and the reviewer. Tests reference their
requirement IDs in describe-titles (existing suites reference §-anchors; new/changed suites
MUST carry `[MP-…]`/`[GD-…]`/`[DOC-…]` IDs) so oracle↔test mapping stays greppable.

**CI gate contract.**
- Parse the matrix at the previous release tag and now: fail if any requirement lost an
  oracle, lost a `mutation`, or moved to a weaker `status` without a change-log entry
  referencing that requirement ID in the same commit range.
- Grep changed test files for removed assertion lines that the matrix maps to oracles
  (heuristic: describe-title → requirement ID → oracle count must not shrink).
- Fixture edits that remove boundary cases are weakening (TEST_DATA_AND_FIXTURE_POLICY §7.4)
  — gate cross-checks deleted fixture fields against matrix `cases.boundary` text.

**Violation looks like.** A green build where `PM2.5 === 9.4` became `toBeDefined()`; a
matrix diff quietly dropping a killing mutation.

## Rule 3 — No skip / disable without waiver

**Norm.** `.skip`, `.only`, `.fixme`, `xit`, `xdescribe`, disabled CI jobs and
commented-out assertions are forbidden in committed code unless a **waiver register**
entry (below) exists: `WVR-YYYY-MM-DD-N` with reason, owner, affected requirement IDs and
an **expiry date** (≤ 30 days; one renewal with re-justification). Expired waivers fail
the gate. Flaky tests are defects: no retry-until-green configuration may be added to make
a red assertion pass (retries for known-environmental live checks live only in the
diagnose harness, which never gates CI — AMB-03).

**CI gate contract.**
- Scan all test globs for skip/only/fixme tokens; each finding must map to an unexpired
  waiver entry; fail otherwise. Fail on ANY `.only` regardless of waiver (it silently
  disables the rest of the suite).
- Fail when a waiver is past expiry; warn 7 days before.
- Fail if Playwright/Vitest retry counts increase without a change-log entry.

**Waiver register.** (currently empty)

| ID | Created | Expires | Owner | Requirement IDs | Skipped item | Reason |
| --- | --- | --- | --- | --- | --- | --- |

## Rule 4 — Self-certification ban

**Norm.** Verification verdicts exist **only** as evidence manifests conforming to
[TEST_EVIDENCE_MANIFEST.schema.json](TEST_EVIDENCE_MANIFEST.schema.json), produced by
commands (test runners, diagnose harness, audit scripts) or structured attestations. Prose
claims — in chat, commit messages, READMEs, PR descriptions — carry **zero** status weight.
"Tests passed" without a conforming manifest is, by definition, an unverified claim.

**Agent separation.** The author of a change (human or agent session) may not:
- adjudicate its own deviation entries (`DEV-*` dispositions need a second party or an
  explicitly adversarial review pass),
- author the attestation for its own manual-rubric items,
- flip a matrix `status` for requirements its own change affects, except `covered →
  partial/planned` (honest downgrades are always allowed unilaterally).

Verification runs **refute-first**: the reviewer/critic's task is to find the input on
which the change lies, not to confirm it works.

**CI gate contract.**
- Validate every submitted evidence manifest against the schema (ajv, 2020-12, strict).
- Reject manifests whose `targets.*_sha256` don't match the checked-out spec/matrix.
- Reject `summary` counts that don't equal the verdict tally.
- For status upgrades in the matrix diff (rule 6), require a manifest reference in the
  commit; for attestations, verify `attestor` differs from the commit author for the
  affected requirement IDs.

## Rule 5 — Mutation obligation

**Norm.** Every `deterministic` oracle names ≥ 1 **killing mutation** — a concrete code
change that MUST make the oracle fail (already machine-enforced at matrix render time). A
mutation that, when applied, does NOT fail its oracle proves the oracle vacuous — that is a
finding of the highest order (the oracle was theater).

**Mutation audit procedure** (periodic, at minimum per release):
1. Sample ≥ 10 requirements weighted toward P0/P1 and toward suites changed since the last
   audit.
2. Apply each sampled mutation on a scratch branch; run the referenced layer(s).
3. Record per mutation: killed / survived / not-applicable, in an evidence manifest
   (`process` oracle results against the sampled requirement IDs).
4. Any **survived** mutation opens a must-fix finding: strengthen the test, then re-run.
5. The audit manifest is part of the release evidence.

**CI gate contract.** Render-time check (exists today in the generator): deterministic
oracle without `mutation` fails the matrix build. The periodic audit is a release gate,
not per-commit.

## Rule 6 — Status accounting

**Norm.** Matrix `status` transitions are evidence-bound:
- `planned/partial/manual-only → covered` requires a conforming evidence manifest whose
  results cover the requirement's oracles, referenced in the same commit (path + sha256).
- `covered → partial/planned` (downgrade) is always allowed and REQUIRED the moment a
  referenced test is deleted/renamed or an oracle loses its implementation.
- `status` may never contradict the layers: `covered` with only `PLANNED` refs is invalid
  (machine-enforced at render time).

**CI gate contract.**
- Matrix diff between HEAD and the previous tag; for every upgrade, resolve the referenced
  manifest file, validate it (rule 4), and check it contains a passing result for that
  requirement ID.
- Cross-check that every non-PLANNED `ref` still resolves: file exists AND describe/test
  title substring is present (the render-time validator enforces this today; the gate
  re-runs it against HEAD).

## Rule 7 — Multi-agent / ultracode constraints

**Norm.** For any multi-agent or automated run touching this compliance system:
1. Agents may **propose** requirement-text changes (as supersession drafts) but never merge
   them; a human — or a separate session explicitly holding the reviewer role and not the
   authoring session — merges.
2. Extraction/verification agents are pinned to **verbatim-quote outputs**: every claim
   about a source text must carry the quote, and quotes are machine-checked against the
   pinned source hashes (the render-time validator does exactly this; agents get no
   paraphrase privilege).
3. Completeness critics run against the **hash-pinned** source texts — "what normative
   sentence has NO requirement ID?" — never against summaries of the sources.
4. An agent that cannot produce a conforming evidence manifest for its verification claims
   has, by rule 4, verified nothing.
5. Agent-authored commits touching matrix/spec/governance files carry the session
   trailer convention already used in this repo, so authorship is auditable per rule 4's
   separation checks.

**CI gate contract.** Enforced through rules 1–6 (the constraints above have no separate
mechanical check beyond authorship trailers; the reviewer-role separation is auditable
from commit metadata + attestation `attestor` fields).

---

## Change log

Governance-relevant changes (oracle removals/downgrades, waivers, rule amendments) are
appended here, newest first. An empty change log plus a diff that required an entry = gate
failure.

| Date | Commit | Rule | Requirement IDs | Description | Reviewer |
| --- | --- | --- | --- | --- | --- |
| 2026-07-19 | (this commit) | — | — | Initial constitution v1.0.0; matrix v1.0.0 rendered with 214 requirements; waiver register empty. | — |
