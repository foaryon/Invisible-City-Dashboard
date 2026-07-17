/**
 * Typed API client. All provider parsing lives server-side; the UI consumes
 * validated ModuleEnvelopes only. Demo mode is passed explicitly per request
 * and never mixed with live data.
 */
import {
  type ModuleEnvelope,
  type WeatherContext,
  type WarningContext,
  type AirStationContext,
  type PoiContext,
  type TransitAvailability,
  type GeocodeResult,
  type Coordinates,
  type ProviderManifestEntry,
} from '@invisible-city/contracts';

async function getJson<T>(
  path: string,
  params: Record<string, string | number | boolean>,
): Promise<T> {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === false || v === '' || v === undefined) continue;
    search.set(k, v === true ? '1' : String(v));
  }
  const res = await fetch(`${path}?${search.toString()}`);
  if (!res.ok) throw new Error(`API-Fehler ${res.status}`);
  return (await res.json()) as T;
}

const coordParams = (c: Coordinates) => ({ lat: c.latitude, lon: c.longitude });

export const api = {
  search: (q: string, demo: boolean) =>
    getJson<ModuleEnvelope<GeocodeResult[]>>('/api/search', { q, demo }),
  reverse: (c: Coordinates, demo: boolean) =>
    getJson<ModuleEnvelope<GeocodeResult[]>>('/api/reverse', { ...coordParams(c), demo }),
  weather: (c: Coordinates, demo: boolean) =>
    getJson<ModuleEnvelope<WeatherContext>>('/api/weather', { ...coordParams(c), demo }),
  warnings: (c: Coordinates, demo: boolean) =>
    getJson<ModuleEnvelope<WarningContext>>('/api/warnings', { ...coordParams(c), demo }),
  airStations: (c: Coordinates, demo: boolean) =>
    getJson<ModuleEnvelope<AirStationContext>>('/api/air/stations', { ...coordParams(c), demo }),
  pois: (c: Coordinates, demo: boolean) =>
    getJson<ModuleEnvelope<PoiContext>>('/api/pois', { ...coordParams(c), demo }),
  transit: (c: Coordinates, stopCount: number | null, demo: boolean) =>
    getJson<ModuleEnvelope<TransitAvailability>>('/api/transit', {
      ...coordParams(c),
      ...(stopCount === null ? {} : { stopCount }),
      demo,
    }),
  providers: () =>
    getJson<{ manifestVersion: string; providers: ProviderManifestEntry[] }>('/api/providers', {}),
};
