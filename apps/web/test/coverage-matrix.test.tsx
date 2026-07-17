import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CoverageMatrix } from '../src/components/CoverageMatrix.js';
import { useAppStore } from '../src/state/store.js';
import { renderWithProviders, resetStore, BERLIN } from './utils.js';

const ok = <T,>(data: T) => ({
  status: 'ok' as const,
  demo: false,
  data,
  evidence: [],
  limitations: [],
  retrievedAt: '2026-07-17T00:00:00Z',
});

vi.mock('../src/api.js', () => ({
  api: {
    weather: vi.fn(() => Promise.resolve(ok({ hours: [] }))),
    warnings: vi.fn(() => Promise.resolve(ok({ warnings: [] }))),
    airStations: vi.fn(() =>
      Promise.resolve(
        ok({
          stations: [
            {
              stationId: '145',
              stationCode: 'DEBE065',
              name: 'Berlin Nansenstraße',
              coordinates: { latitude: 52.49, longitude: 13.43 },
              stationType: 'Hintergrund',
              distanceMeters: 1800,
              measurements: [],
            },
          ],
        }),
      ),
    ),
    airModel: vi.fn(() =>
      Promise.resolve({
        status: 'configuration-required' as const,
        demo: false,
        data: null,
        evidence: [],
        limitations: [],
        retrievedAt: '2026-07-17T00:00:00Z',
      }),
    ),
    pois: vi.fn(() =>
      Promise.resolve(
        ok({
          pois: [
            {
              id: 'node/1',
              category: 'transit-stop' as const,
              name: 'U',
              coordinates: { latitude: 52.52, longitude: 13.4 },
              distanceMeters: 100,
              mode: 'mapped' as const,
            },
          ],
        }),
      ),
    ),
    transit: vi.fn(() =>
      Promise.resolve({
        status: 'partial' as const,
        demo: false,
        data: {
          stopContext: { coverage: 'confirmed' as const, detail: '' },
          scheduled: { coverage: 'unknown' as const, detail: '' },
          realtime: { coverage: 'unknown' as const, detail: '' },
          stops: [],
          realtimeUpdates: [],
          realtimeAlerts: [],
          feedTimestamp: null,
        },
        evidence: [],
        limitations: [],
        retrievedAt: '2026-07-17T00:00:00Z',
      }),
    ),
  },
}));

beforeEach(() => {
  resetStore();
  useAppStore.setState({ selectedPlace: BERLIN });
});

describe('CoverageMatrix (non-judgmental availability matrix, §3.1.I)', () => {
  it('prompts when no place is selected', () => {
    resetStore();
    renderWithProviders(<CoverageMatrix />);
    expect(screen.getByText('Kein Ort gewählt.')).toBeInTheDocument();
  });

  it('renders live, config-required and station-distance states honestly', async () => {
    renderWithProviders(<CoverageMatrix />);
    // Weather live.
    expect(await screen.findByText('Wettervorhersage')).toBeInTheDocument();
    // CAMS needs a key → "Konfiguration nötig".
    expect(await screen.findByText('Konfiguration nötig')).toBeInTheDocument();
    expect(screen.getByText(/CAMS \(Schlüssel erforderlich/)).toBeInTheDocument();
    // Station distance is surfaced.
    expect(await screen.findByText(/Station 1,8 km entfernt/)).toBeInTheDocument();
    // Neutral framing, not alarmist.
    expect(screen.getByText(/kein Alarmzustand/)).toBeInTheDocument();
  });
});
