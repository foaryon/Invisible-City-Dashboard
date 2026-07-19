import { type ModuleEnvelope, type SelectedPlace } from '@invisible-city/contracts';
import { type UseQueryResult } from '@tanstack/react-query';
import { useAppStore, selectedInstantIso } from '../state/store.js';
import {
  useWeather,
  useWarnings,
  useAirStations,
  useAirModel,
  useTransit,
  useWater,
  useRadiation,
  usePollen,
  useUv,
  useRadar,
  useCivilWarnings,
  useAutobahn,
  useQuakes,
  useClimateNormals,
  useFuel,
  useStationFacilities,
  usePois,
} from '../queries.js';
import { ModuleCard } from './lens/ModuleCard.js';
import { ContextSection, type ContextEntry } from './lens/ContextSection.js';
import { LENS_MODULES, type LensCtx, type LensModuleKey } from './lens/registry.js';

type AnyQuery = UseQueryResult<ModuleEnvelope<unknown>>;

/**
 * All 17 module hooks, called literally in fixed order (rules-of-hooks — never
 * loop hooks over the registry). React Query dedupes these against the
 * CoverageMatrix's identical keys, so no extra fetches occur.
 */
function useLensEnvelopes(
  place: SelectedPlace | null,
  demo: boolean,
  targetIso: string,
): Record<LensModuleKey, AnyQuery> {
  return {
    weather: useWeather(place, demo) as AnyQuery,
    warnings: useWarnings(place, demo) as AnyQuery,
    civilWarnings: useCivilWarnings(place, demo) as AnyQuery,
    radar: useRadar(place, demo) as AnyQuery,
    climateNormals: useClimateNormals(place, demo) as AnyQuery,
    airStations: useAirStations(place, demo) as AnyQuery,
    airModel: useAirModel(place, demo) as AnyQuery,
    pollen: usePollen(place, demo) as AnyQuery,
    uv: useUv(place, demo) as AnyQuery,
    water: useWater(place, demo) as AnyQuery,
    radiation: useRadiation(place, demo) as AnyQuery,
    quakes: useQuakes(place, demo) as AnyQuery,
    pois: usePois(place, demo) as AnyQuery,
    autobahn: useAutobahn(place, demo) as AnyQuery,
    fuel: useFuel(place, demo) as AnyQuery,
    stationFacilities: useStationFacilities(place, demo) as AnyQuery,
    transit: useTransit(place, targetIso, demo) as AnyQuery,
  };
}

export function PlaceLens() {
  const { selectedPlace, demoMode, timeOffsetHours } = useAppStore();
  const targetIso = selectedInstantIso(timeOffsetHours);
  const queries = useLensEnvelopes(selectedPlace, demoMode, targetIso);
  const ctx: LensCtx = { targetIso };

  // Partition per registry order: unconfigured key-gated modules become compact
  // hint rows in the context section; noteworthy context modules are promoted
  // to visible full cards with an "aktiv" badge.
  const primary: (typeof LENS_MODULES)[number][] = [];
  const promoted: (typeof LENS_MODULES)[number][] = [];
  const contextEntries: ContextEntry[] = [];
  for (const def of LENS_MODULES) {
    const query = queries[def.key];
    const env = query.data;
    if (def.configGated && env?.status === 'configuration-required') {
      contextEntries.push({ def, query, configHint: true });
      continue;
    }
    if (def.tier === 'primary') {
      primary.push(def);
      continue;
    }
    if (env && def.noteworthy?.(env)) {
      promoted.push(def);
      continue;
    }
    contextEntries.push({ def, query, configHint: false });
  }

  return (
    <section className="panel-section" aria-label="Place Lens">
      <h2 className="panel-title">Place Lens</h2>
      {!selectedPlace ? (
        <p className="loading-shimmer">
          Wählen Sie einen Ort per Suche oder Klick auf die Karte, um den verifizierbaren Kontext zu
          sehen.
        </p>
      ) : (
        <>
          <div className="card">
            <strong>{selectedPlace.label}</strong>
            <div style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 2 }}>
              {selectedPlace.coordinates.latitude.toFixed(4)},{' '}
              {selectedPlace.coordinates.longitude.toFixed(4)}
              {selectedPlace.state ? ` · ${selectedPlace.state}` : ''}
            </div>
          </div>
          {primary.map((def) => (
            <ModuleCard
              key={def.key}
              moduleKey={def.key}
              title={def.title}
              inspectorTitle={def.inspectorTitle}
              query={queries[def.key]}
              isEmpty={def.isEmpty}
              emptyText={def.emptyText}
            >
              {(data) => def.renderBody(data, ctx)}
            </ModuleCard>
          ))}
          {promoted.map((def) => (
            <ModuleCard
              key={def.key}
              moduleKey={def.key}
              title={def.title}
              inspectorTitle={def.inspectorTitle}
              query={queries[def.key]}
              isEmpty={def.isEmpty}
              emptyText={def.emptyText}
              badge={<span className="chip badge-active">aktiv</span>}
            >
              {(data) => def.renderBody(data, ctx)}
            </ModuleCard>
          ))}
          <ContextSection entries={contextEntries} ctx={ctx} />
        </>
      )}
    </section>
  );
}
