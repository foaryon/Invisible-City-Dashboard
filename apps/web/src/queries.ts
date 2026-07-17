import { useQuery } from '@tanstack/react-query';
import { type SelectedPlace } from '@invisible-city/contracts';
import { api } from './api.js';

const key = (name: string, place: SelectedPlace | null, demo: boolean, extra?: unknown) => [
  name,
  place?.id ?? null,
  demo,
  extra ?? null,
];

export function useWeather(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('weather', place, demo),
    queryFn: () => api.weather(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 5 * 60_000,
  });
}

export function useWarnings(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('warnings', place, demo),
    queryFn: () => api.warnings(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 2 * 60_000,
  });
}

export function useAirStations(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('air', place, demo),
    queryFn: () => api.airStations(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 10 * 60_000,
  });
}

export function usePois(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('pois', place, demo),
    queryFn: () => api.pois(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 30 * 60_000,
  });
}

export function useTransit(place: SelectedPlace | null, stopCount: number | null, demo: boolean) {
  return useQuery({
    queryKey: key('transit', place, demo, stopCount),
    queryFn: () => api.transit(place!.coordinates, stopCount, demo),
    enabled: !!place,
    staleTime: 10 * 60_000,
  });
}

export function useProviders() {
  return useQuery({ queryKey: ['providers'], queryFn: api.providers, staleTime: Infinity });
}
