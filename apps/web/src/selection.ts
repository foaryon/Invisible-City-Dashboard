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

/** Approximate Germany bounding box — the product's DE-only selection scope. */
export const GERMANY_BOUNDS = { minLat: 47.2, maxLat: 55.1, minLon: 5.8, maxLon: 15.1 } as const;

/**
 * Direct coordinate input ("49.7596, 6.6439" · "52.52 13.405" · "49,7596; 6,6439")
 * [MP-3.1.A-02]. The search label has always promised coordinate input; this
 * makes the promise true. Returns null unless both numbers parse AND lie within
 * the Germany bounds — anything else falls through to normal text search, which
 * ends in the honest "Keine Treffer in Deutschland" state.
 */
export function parseCoordinateInput(query: string): Coordinates | null {
  const q = query.trim();
  // Dot-decimal pair separated by comma/semicolon/whitespace …
  let m = /^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/.exec(q);
  if (!m) {
    // … or German comma-decimal pair separated by semicolon/whitespace
    // (never a bare comma — that would be ambiguous with the separator).
    const g = /^(-?\d{1,2}(?:,\d+)?)\s*[;\s]\s*(-?\d{1,3}(?:,\d+)?)$/.exec(q);
    if (g && g[1] && g[2]) {
      m = [g[0], g[1].replace(',', '.'), g[2].replace(',', '.')] as unknown as RegExpExecArray;
    }
  }
  if (!m) return null;
  const latStr = m[1];
  const lonStr = m[2];
  if (!latStr || !lonStr) return null;
  const latitude = Number.parseFloat(latStr);
  const longitude = Number.parseFloat(lonStr);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  if (latitude < GERMANY_BOUNDS.minLat || latitude > GERMANY_BOUNDS.maxLat) return null;
  if (longitude < GERMANY_BOUNDS.minLon || longitude > GERMANY_BOUNDS.maxLon) return null;
  return { latitude, longitude };
}

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
