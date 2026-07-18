# Deutsche Bahn (FaSta) & Tankerkönig — integration reference

Both providers are fully implemented server-side adapters behind the shared
normalized contract (`ModuleEnvelope` + Evidence) and the central
[spatial-selection contract](spatial-contract.md). They activate automatically
the moment their credentials appear in the local `.env` — until then the API
returns an honest `configuration-required` envelope naming the exact variable,
and every other module keeps working (failure isolation is per-envelope).

## Secrets & rotation (applies to both)

- Credentials live ONLY in the untracked local `.env` (covered by
  `.gitignore`); `.env.example` documents variable NAMES only.
- Keys are never bundled client-side: the browser talks exclusively to this
  API; a non-functional guard test asserts no secret/`process.env` reaches the
  frontend bundle.
- **Rotation rule:** any credential that has ever appeared in a chat,
  screenshot, log or commit is treated as exposed. Rotate it at the provider
  portal and paste the NEW value directly into `.env`, nowhere else:
  - Tankerkönig: request/regenerate at <https://creativecommons.tankerkoenig.de>.
  - DB API Marketplace: in the application's credentials view, regenerate the
    Client Secret.
- Startup validation is honest and non-leaking: presence is config-gated
  (`isConfigured`), `/api/readiness` reports per-provider live/configured
  without echoing values; invalid/revoked keys surface as source-error
  envelopes with HTTP status only.

## Deutsche Bahn — FaSta (Station Facilities Status)

| | |
| --- | --- |
| Access | DB API Marketplace, `https://apis.deutschebahn.com/db-api-marketplace/apis/fasta/v2` (server-side only) |
| Env | `DB_CLIENT_ID`, `DB_API_KEY` (both required) |
| Fields used | `equipmentnumber`, `type` (ELEVATOR/ESCALATOR), `state` (ACTIVE/INACTIVE/UNKNOWN), `description`, `geocoordX/Y` |
| Spatial rule | facilities ≤ 3 km around the selected point, each with its real distance |
| Data mode | `realtime` (operator-reported facility state) |
| Cache TTL | 300 s (source-aware cache, stale served only visibly labelled) |
| Label semantics | „Zustand nicht ermittelbar" (UNKNOWN) explicitly does NOT mean functioning — stated in the UI |
| No-data | „keine DB-Station/Anlage im Umkreis" — honest absence, never distant data as local |
| Failure | 401/403/429/5xx → source-error envelope; retry policy: bounded transient retry (network + 502/503/504), never on 401/403/429 |
| Note | timetable/real-time departures are a documented FUTURE candidate (DB Timetables / RIS::Stations, same credential gating); nothing timetable-related is implied by FaSta data |

## Tankerkönig (MTS-K fuel prices)

| | |
| --- | --- |
| Access | `https://creativecommons.tankerkoenig.de/json/list.php` (server-side only) |
| Env | `TANKERKOENIG_API_KEY` |
| Request | `lat/lng`, `rad=5` km, `sort=dist`, `type=all` |
| Fields used | `id`, `brand`, `name`, `dist`, `isOpen`, `e5`, `e10`, `diesel` (documented `false` → price null, never 0) |
| Data mode | `realtime` (operator-notified MTS-K prices; small delays possible — stated) |
| Cache TTL | 300 s; staleness always visible |
| Spatial rule | stations ≤ 5 km; each with distance; sorting is dashboard-derived and labelled as such |
| No-data | „Keine meldepflichtige Tankstelle im Umkreis von 5 km." |
| Failure | invalid key/quota → source-error envelope (HTTP status only), other modules unaffected |
| Truthfulness | no invented prices/opening states; missing fuel types stay missing; unit €/l with 3 decimals as delivered |

## Verification path

`npm run diagnose` (and `/diagnose.html` in the browser) call both adapters
live at every reference location. The manifest schemas are marked TO VERIFY
until the first keyed run confirms them — a mismatch fails visibly via runtime
Zod validation, never silently.
