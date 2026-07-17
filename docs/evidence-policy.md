# Evidence policy

Every material value, layer, comparison and derived display carries **Evidence**. This is the
mechanism that makes "reality-first" enforceable rather than aspirational.

## The Evidence record (`packages/contracts`)

```ts
type Evidence = {
  providerId; providerName; institution;      // who is responsible
  sourceUrl?; license?; attribution?;          // permitted use + required credit
  mode: DataMode;                              // observed | forecast | modelled | mapped
                                               // | scheduled | realtime | partial | cached
                                               // | unavailable | demo
  method: string;                              // how this value came to be
  observedAt?; forecastIssuedAt?; validAt?;    // the four distinct times…
  publishedAt?; retrievedAt; cacheAgeSeconds?; // …data / validity / publication / retrieval
  spatial: SpatialContext;                     // station+distance | grid+km | geometry | coverage | unknown
  completeness: 'complete'|'partial'|'provisional'|'unknown';
  limitations: string[];                       // what cannot be concluded
  schemaVersion: string;
  sourceTimeRaw?: string;                       // original source time, preserved verbatim
};
```

`EvidenceValue<T>` and `ModuleEnvelope<T>` wrap payloads with `status` and `limitations`, so
**every API response exposes source status and limitations** (§6).

## Construction rules (enforced in `makeEvidence`)

1. **Identity, license and attribution come from the manifest**, not the adapter. An adapter
   cannot invent or omit them.
2. **Provider limitations are always merged** with call-specific limitations — never dropped.
3. **Raw source time is preserved** where the source uses non-standard semantics (UBA CET).
4. The record is **Zod-validated** on construction; an invalid record throws in development.

## Normalization rules (§6)

- Do **not** remove evidence during normalization.
- Do **not** transform incompatible source modes into the same field without a mode
  discriminator.
- Do **not** return a numeric default for unavailable data — `value` is `null`, `status` is
  `unavailable`/`partial`/`error`.

## Data-status states (§3.1.J)

`loading · available · partial · stale · unavailable · source-error · configuration-required ·
demo`. Each explains **what is missing, why it matters, and what cannot be concluded**. A
stale (cached) response is usable only when **visibly labelled with its age**. Provider
failure never causes an unannounced demo fallback.

## Demo / live separation

Demo mode is opt-in and permanently labelled while active
(`DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN`). Demo and live data cannot coexist in the
same conclusion, panel or comparison. Demo payloads are produced by the **real** adapters over
fixtures and stamped `demo` end-to-end.

## Comparability (`assessComparability`, §2.2)

Compare **observed with observed** and **modelled with modelled** only, and only when the
parameter matches and the time contexts are within `MAX_COMPARABLE_SKEW_SECONDS` (2 h). Any
mismatch yields a German reason (e.g. *"Für diesen Vergleich nicht ausreichend
vergleichbar."*) and the comparison is withheld — never coerced into a number. `unavailable`
and `demo` modes are never comparable.

## Time semantics (§3.1.B)

Display is Europe/Berlin, DST-correct. The four times are distinguished: **data time**
(`observedAt`), **validity time** (`validAt`/`forecastIssuedAt`), **retrieval time**
(`retrievedAt`), and **cache age** (`cacheAgeSeconds`). The UBA CET/MEZ (no-DST) peculiarity
is normalized deliberately and the original string kept in `sourceTimeRaw`. See
`packages/evidence/src/time.ts` and its tests.
