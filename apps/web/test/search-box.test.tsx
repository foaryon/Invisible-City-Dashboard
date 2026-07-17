import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBox } from '../src/components/SearchBox.js';
import { useAppStore } from '../src/state/store.js';
import { renderWithProviders, resetStore } from './utils.js';

const searchMock = vi.fn();
vi.mock('../src/api.js', () => ({ api: { search: (q: string, d: boolean) => searchMock(q, d) } }));

function germanResults() {
  return {
    status: 'ok' as const,
    demo: false,
    data: [
      {
        place: {
          id: 'osm:N:1',
          label: 'Berlin, Berlin',
          coordinates: { latitude: 52.52, longitude: 13.405 },
          country: 'DE' as const,
        },
        mode: 'mapped' as const,
      },
      {
        place: {
          id: 'osm:R:2',
          label: 'Augsburg, Bayern',
          coordinates: { latitude: 48.37, longitude: 10.9 },
          country: 'DE' as const,
        },
        mode: 'mapped' as const,
      },
    ],
    evidence: [],
    limitations: [],
    retrievedAt: '2026-07-17T00:00:00Z',
  };
}

beforeEach(() => {
  resetStore();
  searchMock.mockReset();
});

describe('SearchBox', () => {
  it('debounces, lists results, and selects into the shared SelectedPlace contract', async () => {
    searchMock.mockResolvedValue(germanResults());
    renderWithProviders(<SearchBox />);
    fireEvent.change(screen.getByRole('combobox', { name: /Ort, Adresse/ }), {
      target: { value: 'berlin' },
    });
    const option = await screen.findByRole('option', { name: 'Berlin, Berlin' });
    // Options are selectable list items (no focusable descendants); selection is on mousedown.
    fireEvent.mouseDown(option);
    expect(useAppStore.getState().selectedPlace?.id).toBe('osm:N:1');
    expect(useAppStore.getState().selectedPlace?.country).toBe('DE');
  });

  it('does not query for inputs shorter than 2 characters', async () => {
    searchMock.mockResolvedValue(germanResults());
    renderWithProviders(<SearchBox />);
    fireEvent.change(screen.getByRole('combobox', { name: /Ort, Adresse/ }), {
      target: { value: 'b' },
    });
    await new Promise((r) => setTimeout(r, 400));
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation (ArrowDown + Enter)', async () => {
    searchMock.mockResolvedValue(germanResults());
    renderWithProviders(<SearchBox />);
    const input = screen.getByRole('combobox', { name: /Ort, Adresse/ });
    fireEvent.change(input, { target: { value: 'a' } }); // ignored (<2)
    fireEvent.change(input, { target: { value: 'augsburg' } });
    await screen.findByRole('option', { name: 'Berlin, Berlin' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useAppStore.getState().selectedPlace?.label).toBe('Berlin, Berlin');
  });

  it('shows an explicit error state when the source fails (no invented results)', async () => {
    searchMock.mockResolvedValue({
      status: 'source-error',
      demo: false,
      data: null,
      evidence: [],
      limitations: [],
      retrievedAt: '2026-07-17T00:00:00Z',
    });
    renderWithProviders(<SearchBox />);
    fireEvent.change(screen.getByRole('combobox', { name: /Ort, Adresse/ }), {
      target: { value: 'xyz' },
    });
    await waitFor(() =>
      expect(screen.getByText(/Geokodierungsquelle nicht erreichbar/)).toBeInTheDocument(),
    );
  });
});
