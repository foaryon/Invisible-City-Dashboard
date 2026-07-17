import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Compare } from '../src/components/Compare.js';
import { useAppStore } from '../src/state/store.js';
import { renderWithProviders, resetStore, BERLIN } from './utils.js';

const envelope = <T,>(data: T) => ({
  status: 'ok' as const,
  demo: false,
  data,
  evidence: [],
  limitations: [],
  retrievedAt: '2026-07-17T00:00:00Z',
});

vi.mock('../src/api.js', () => ({
  api: {
    weather: vi.fn(() =>
      Promise.resolve(
        envelope({
          hours: [
            {
              validAt: '2026-07-16T12:00:00Z',
              mode: 'observed',
              values: [
                {
                  parameter: 'temperature',
                  value: 26,
                  unit: '°C',
                  mode: 'observed',
                  validAt: '2026-07-16T12:00:00Z',
                },
              ],
            },
          ],
        }),
      ),
    ),
    airStations: vi.fn(() =>
      Promise.resolve(
        envelope({
          stations: [
            {
              stationId: '145',
              stationCode: 'DEBE065',
              name: 'Nansenstraße',
              coordinates: { latitude: 52.49, longitude: 13.43 },
              stationType: 'Hintergrund',
              distanceMeters: 1400,
              measurements: [
                {
                  pollutant: 'PM2',
                  value: 9,
                  unit: 'µg/m³',
                  mode: 'observed',
                  measuredAt: '2026-07-16T12:00:00Z',
                  sourceTimeRaw: '2026-07-16 13:00:00',
                },
              ],
            },
          ],
        }),
      ),
    ),
    warnings: vi.fn(() => Promise.resolve(envelope({ warnings: [] }))),
    pois: vi.fn(() => Promise.resolve(envelope({ pois: [] }))),
  },
}));

beforeEach(resetStore);

describe('Compare (A/B/C, factual only — no score)', () => {
  it('prompts to pin places and explains no overall score is computed', () => {
    renderWithProviders(<Compare />);
    expect(screen.getByText(/kein Gesamt-Score und keine .?beste Gegend/)).toBeInTheDocument();
  });

  it('disables the "A setzen" control until a place is selected', () => {
    renderWithProviders(<Compare />);
    expect(screen.getByRole('button', { name: /A setzen/ })).toBeDisabled();
  });

  it('renders compared values with a data-mode chip and never a ranking', async () => {
    useAppStore.setState({ selectedPlace: BERLIN, pins: { A: BERLIN } });
    renderWithProviders(<Compare />);
    const table = await screen.findByRole('table');
    expect(table).toHaveTextContent('Temperatur');
    expect(table).toHaveTextContent('PM2.5');
    expect(await screen.findByText('26 °C')).toBeInTheDocument();
    // Data mode is shown beside the value.
    expect(screen.getAllByText('Gemessen').length).toBeGreaterThan(0);
    // Forbidden ranking language never appears.
    expect(screen.queryByText(/beste Gegend der Stadt/)).toBeNull();
  });
});
