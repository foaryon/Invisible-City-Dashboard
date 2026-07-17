import { type ReactElement, type ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '../src/state/store.js';

/** Fresh QueryClient per test — no retries, no caching bleed. */
export function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
}

export function renderWithProviders(ui: ReactElement, client: QueryClient = makeClient()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper });
}

/** Reset the zustand store to a clean baseline between tests. */
export function resetStore() {
  useAppStore.setState({
    selectedPlace: null,
    pins: {},
    activeLayer: 'weather',
    timeOffsetHours: 0,
    demoMode: false,
    inspector: null,
    mobilePanel: null,
  });
}

export const BERLIN = {
  id: 'osm:N:240109189',
  label: 'Berlin, Berlin',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  locality: 'Berlin',
  municipality: 'Berlin',
  state: 'Berlin',
  country: 'DE' as const,
};
