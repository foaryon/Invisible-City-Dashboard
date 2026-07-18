/**
 * Regression tests for the map-click selection flow — the "pointer jumps to a
 * random place" bug: a click's reverse-geocode response resolving AFTER the
 * user selected another place must NOT override the newer selection.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  type Coordinates,
  type GeocodeResult,
  type ModuleEnvelope,
  type SelectedPlace,
} from '@invisible-city/contracts';
import { useAppStore } from '../src/state/store.js';
import { selectFromMapClick, provisionalPlace } from '../src/selection.js';

const okEnvelope = (place: SelectedPlace): ModuleEnvelope<GeocodeResult[]> => ({
  status: 'ok',
  demo: false,
  data: [{ place, mode: 'mapped' }],
  evidence: [],
  limitations: [],
  retrievedAt: new Date().toISOString(),
});

const TRIER: SelectedPlace = {
  id: 'osm:R:1',
  label: 'Trier, Rheinland-Pfalz',
  coordinates: { latitude: 49.7596, longitude: 6.6439 },
  state: 'Rheinland-Pfalz',
  country: 'DE',
};

beforeEach(() => {
  useAppStore.getState().selectPlace(null);
});

describe('selectFromMapClick — stale-response guard', () => {
  it('upgrades the provisional label when nothing else was selected meanwhile', async () => {
    const clicked: Coordinates = { latitude: 50.0, longitude: 8.0 };
    const reversed: SelectedPlace = {
      id: 'osm:N:7',
      label: 'Mainz, Rheinland-Pfalz',
      coordinates: { latitude: 50.0001, longitude: 8.0001 },
      country: 'DE',
    };
    await selectFromMapClick(clicked, () => Promise.resolve(okEnvelope(reversed)));
    const sel = useAppStore.getState().selectedPlace!;
    expect(sel.label).toBe('Mainz, Rheinland-Pfalz');
    // The CLICKED coordinates stay authoritative (the label is context only).
    expect(sel.coordinates).toEqual(clicked);
  });

  it('never lets a slow reverse response override a newer search selection', async () => {
    const clicked: Coordinates = { latitude: 50.0, longitude: 8.0 };
    let resolveReverse!: (env: ModuleEnvelope<GeocodeResult[]>) => void;
    const slowReverse = new Promise<ModuleEnvelope<GeocodeResult[]>>((r) => {
      resolveReverse = r;
    });

    const clickFlow = selectFromMapClick(clicked, () => slowReverse);
    // Click applied instantly as provisional point:
    expect(useAppStore.getState().selectedPlace?.id).toBe(provisionalPlace(clicked).id);

    // User selects Trier via search WHILE the reverse request is in flight.
    useAppStore.getState().selectPlace(TRIER);

    // The old click's reverse geocode finally answers with a different place.
    resolveReverse(
      okEnvelope({
        id: 'osm:N:9',
        label: 'Irgendwo anders',
        coordinates: { latitude: 50.0001, longitude: 8.0001 },
        country: 'DE',
      }),
    );
    await clickFlow;

    // The newer selection wins — no jump back to the click point.
    expect(useAppStore.getState().selectedPlace).toEqual(TRIER);
  });

  it('never lets the FIRST of two rapid clicks override the second', async () => {
    const first: Coordinates = { latitude: 50.0, longitude: 8.0 };
    const second: Coordinates = { latitude: 51.0, longitude: 9.0 };
    let resolveFirst!: (env: ModuleEnvelope<GeocodeResult[]>) => void;
    const firstFlow = selectFromMapClick(
      first,
      () =>
        new Promise((r) => {
          resolveFirst = r;
        }),
    );
    const secondFlow = selectFromMapClick(second, (c) =>
      Promise.resolve(
        okEnvelope({
          id: 'osm:N:2',
          label: 'Zweiter Ort',
          coordinates: c,
          country: 'DE',
        }),
      ),
    );
    await secondFlow;
    resolveFirst(
      okEnvelope({
        id: 'osm:N:1',
        label: 'Erster Ort',
        coordinates: first,
        country: 'DE',
      }),
    );
    await firstFlow;
    const sel = useAppStore.getState().selectedPlace!;
    expect(sel.label).toBe('Zweiter Ort');
    expect(sel.coordinates).toEqual(second);
  });

  it('keeps the provisional point when reverse geocoding fails (best-effort)', async () => {
    const clicked: Coordinates = { latitude: 50.0, longitude: 8.0 };
    await selectFromMapClick(clicked, () => Promise.reject(new Error('offline')));
    const sel = useAppStore.getState().selectedPlace!;
    expect(sel.id).toBe(provisionalPlace(clicked).id);
    expect(sel.label).toContain('Punkt');
  });
});
