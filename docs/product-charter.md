# Product Charter — The Invisible City (V1)

## Product statement

The Invisible City helps people understand the **verifiable** environmental, place and data
context of a selected location in Germany. The user selects a place and a time. The product
combines only permitted, documented source interfaces and presents weather/forecast/warning
context (DWD), observed station air quality (UBA/Länder), optional regional modelled air
background (CAMS, not activated in V1), mapped place context (OSM/BKG), transit **data
availability** (not universal reliability), a comparison of up to three places, and — for
every material claim — its source, method, time, spatial relevance and limitations.

**Core promise (verbatim):**
> „Ein Ort. Ein Zeitpunkt. Eine Karte. Belastbare Datenquellen – mit sichtbaren Grenzen.“

## What the product IS

- A modern shared map experience over Germany.
- One consistent place and time model (Europe/Berlin, DST-correct).
- A transparent comparison layer.
- Source-aware presentation with clear data-status and coverage communication.
- A trustworthy interface for interpreting separate datasets **together** — without fusing
  them into a false merged truth.

## What the product is NOT

- Not a replacement for DWD, UBA, CAMS, DELFI, operators, municipal portals, BKG, geocoding
  or map providers.
- Not a directory of government portals, a set of embedded iframes, or a bag of unrelated
  dashboards.
- Not a generator of values to fill a source-data gap.
- Not a producer of scores, rankings, "best place", "cleanest air", "safest area",
  reliability ratings, routing, or health conclusions.

## Non-negotiable reality policy (summary)

1. **Integration, not replacement.** Documented, permitted interfaces only.
2. **Combine context; never fabricate a merged truth.** Non-equivalent data stays
   side-by-side with an explicit data-mode discriminator.
3. **Prefer explicit uncertainty.** "Not available for this place or time" beats a weak
   proxy or a persuasive-but-unsupported visual.
4. **Every source-backed output declares its data mode:** `observed | forecast | modelled |
   mapped | scheduled | realtime | partial | cached | unavailable | demo`.

## Definition of done (V1)

See [`release-v1.md`](release-v1.md) for the checklist mapped to acceptance tests. In short:
a user can choose a German place (search or map click) and a time; inspect DWD weather &
warnings, UBA station air, mapped POI context, and transit *availability*; pin and compare
A/B/C; and for every material claim see inspectable source, time, data mode, spatial meaning
and limitations. Data gaps are first-class UI states. Demo data is visibly and technically
separate. The application is accessible, tested, documented and locally runnable, and makes
**no claim outside the source evidence**.

## Verbindliche Leitentscheidung

Die Architektur kombiniert **Quellen und Kontexte, nicht deren fachliche Berechnungen**:
DWD für Wetter, UBA/Länder für Stationsmessungen, optional CAMS für regionales Modell, nur
verifizierte Transit-/POI-Quellen. Der DWD weist selbst darauf hin, dass für seine
Geodienste „kein Anspruch auf Verfügbarkeit dieser Dienste“ besteht; deshalb gehören
**Cache, sichtbare Ausfälle und Datenstatus** zwingend in die Umsetzung.
