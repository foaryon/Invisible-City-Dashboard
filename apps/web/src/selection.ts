/**
 * Map-click selection flow, extracted from MapView so the stale-response guard
 * is unit-testable (MapLibre itself cannot run in jsdom).
 *
 * A click selects a provisional "Punkt lat, lon" immediately; the label is then
 * upgraded via reverse geocoding — best-effort AND guarded: Photon is throttled
 * (1 req/s, serialized), so the response can arrive after the user has already
 * selected another place (search or a second click). A stale result must never
 * override the newer selection — that was the "pointer jumps to a random
 * place" bug.
 */
import {
  type Coordinates,
  type SelectedPlace,
  type GeocodeResult,
  type ModuleEnvelope,
} from '@invisible-city/contracts';
import { useAppStore } from './state/store.js';

export function provisionalPlace(coords: Coordinates): SelectedPlace {
  return {
    id: `point:${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`,
    label: `Punkt ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
    coordinates: coords,
    country: 'DE',
  };
}

export async function selectFromMapClick(
  coords: Coordinates,
  reverse: (c: Coordinates) => Promise<ModuleEnvelope<GeocodeResult[]>>,
): Promise<void> {
  const provisional = provisionalPlace(coords);
  useAppStore.getState().selectPlace(provisional);
  try {
    const env = await reverse(coords);
    const place = env.data?.[0]?.place;
    // Apply ONLY while this click's provisional selection is still current.
    if (place && useAppStore.getState().selectedPlace?.id === provisional.id) {
      useAppStore.getState().selectPlace({ ...place, coordinates: coords });
    }
  } catch {
    // Keep the provisional label; reverse geocoding is best-effort.
  }
}
