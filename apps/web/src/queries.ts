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

export function useAirModel(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('air-model', place, demo),
    queryFn: () => api.airModel(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 30 * 60_000,
  });
}

export function useTransit(place: SelectedPlace | null, atIso: string, demo: boolean) {
  return useQuery({
    queryKey: key('transit', place, demo, atIso.slice(0, 13)),
    queryFn: () => api.transit(place!.coordinates, atIso, demo),
    enabled: !!place,
    staleTime: 5 * 60_000,
  });
}

export function useWater(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('water', place, demo),
    queryFn: () => api.water(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 5 * 60_000,
  });
}

export function useRadiation(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('radiation', place, demo),
    queryFn: () => api.radiation(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 15 * 60_000,
  });
}

export function usePollen(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('pollen', place, demo, place?.state ?? null),
    queryFn: () => api.pollen(place!.coordinates, place!.state, demo),
    enabled: !!place,
    staleTime: 60 * 60_000,
  });
}

export function useUv(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('uv', place, demo),
    queryFn: () => api.uv(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 60 * 60_000,
  });
}

export function useRadar(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('radar', place, demo),
    queryFn: () => api.radar(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 5 * 60_000,
  });
}

export function useCivilWarnings(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('civil-warnings', place, demo),
    queryFn: () => api.civilWarnings(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 2 * 60_000,
  });
}

export function useAutobahn(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('autobahn', place, demo),
    queryFn: () => api.autobahn(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 10 * 60_000,
  });
}

export function useQuakes(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('quakes', place, demo),
    queryFn: () => api.quakes(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 15 * 60_000,
  });
}

export function useClimateNormals(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('climate-normals', place, demo),
    queryFn: () => api.climateNormals(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 24 * 3600_000,
  });
}

export function useFuel(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('fuel', place, demo),
    queryFn: () => api.fuel(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 5 * 60_000,
  });
}

export function useStationFacilities(place: SelectedPlace | null, demo: boolean) {
  return useQuery({
    queryKey: key('station-facilities', place, demo),
    queryFn: () => api.stationFacilities(place!.coordinates, demo),
    enabled: !!place,
    staleTime: 5 * 60_000,
  });
}

export function useProviders() {
  return useQuery({ queryKey: ['providers'], queryFn: api.providers, staleTime: Infinity });
}

export function useReadiness() {
  return useQuery({ queryKey: ['readiness'], queryFn: api.readiness, staleTime: 60_000 });
}
