import { type Coordinates } from '@invisible-city/contracts';

const EARTH_RADIUS_M = 6371008.8;

/** Great-circle distance in meters (haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** German distance label: "350 m" / "1,4 km" / "18 km". */
export function formatDistanceGerman(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${String(rounded).replace('.', ',')} km`;
}

/**
 * A station beyond this distance is presented as a REGIONAL reference,
 * never as local air quality (reality policy §2.2).
 */
export const STATION_REGIONAL_THRESHOLD_M = 5000;

export function stationSpatialRole(distanceM: number): 'nearby' | 'regional' {
  return distanceM <= STATION_REGIONAL_THRESHOLD_M ? 'nearby' : 'regional';
}
