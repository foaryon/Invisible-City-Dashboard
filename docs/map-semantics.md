# Map semantics

## Core rule (§8.1)

**Visual precision must never exceed data precision.** The map is not allowed to imply a
measured value where none exists.

## Layer strategy (§4.3)

Only **one** primary analytical layer dominates at a time. Each layer has a legend and
declares its **source, data mode, spatial meaning, time applicability and limitations**
(`packages/map-style/src/index.ts`, rendered by `LayerControls`).

| Layer | Enabled in V1 | Marker semantics |
| --- | --- | --- |
| Weather & warnings | ✅ | analysis point marker; warnings are municipality polygons, not inferred local severity |
| Air: station observations | ✅ | **point markers only, no interpolation**; ≤5 km = nearby, >5 km = ring "regionale Referenz" |
| Air: regional model (CAMS) | ⛔ not integrated | (grid/raster only when activated) |
| Transit context | ✅ | mapped stop markers; missing realtime is **neutral grey**, not a failure colour |
| Place & mapped context | ✅ | contextual symbols; **green = "mapped", not "good"** |
| Data availability | ✅ | non-judgmental matrix |

## Per-domain rules (§8.2–8.5)

- **Air quality.** Station data → point markers, no interpolation, no smooth heatmap. A
  station beyond 5 km is drawn as a ring and labelled *regionale Referenz* — never a local
  value. CAMS (when activated) → grid/raster, never a street-level heatmap.
- **Weather.** Forecast vs. observation stays visible (per-hour data mode). Warnings are
  source-defined areas/events. A pin is **never** implied to be a DWD measurement station.
- **Transit.** Stop markers show mapped stop context. Scheduled vs. realtime distinctions
  stay visible. **Missing realtime is neutral grey, not red.** Dense stops/POIs cluster.
- **POIs.** Contextual symbols only. Never infer openness, accessibility, safety or operating
  state from geometry.

## Colour & accessibility

Colour is **never** the sole carrier of data status: every marker has an `aria-label`/title,
legends pair each swatch with text, and status is also carried by shape (circle = nearby /
observed, ring = regional, square = area/warning) and by text pills. The design avoids
rainbow maps, alarmist red for ordinary missing coverage, and giant "truth scores". Dark,
calm tokens live in `packages/map-style` (`tokens`). `prefers-reduced-motion` is respected
globally.

## Base map

OpenFreeMap "liberty" (OSM/ODbL, advertising-free, no key). Attribution is added via
MapLibre's `AttributionControl` and echoed in `BASE_MAP_ATTRIBUTION`.
