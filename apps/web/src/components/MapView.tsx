import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MlMap, type LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { selectFromMapClick } from '../selection.js';
import {
  BASE_MAP_STYLE_URL,
  BASE_MAP_ATTRIBUTION,
  INITIAL_VIEW,
  tokens,
} from '@invisible-city/map-style';
import { stationSpatialRole } from '@invisible-city/evidence';
import { useAppStore } from '../state/store.js';
import { api } from '../api.js';
import { useAirStations, useAirModel, usePois } from '../queries.js';

/**
 * DWD GeoServer WMS precipitation-radar composite as a raster overlay.
 * Attribution: Deutscher Wetterdienst; a raster IMAGE, never a point value.
 */
const RADAR_WMS_TILES =
  'https://maps.dwd.de/geoserver/dwd/wms?service=WMS&version=1.3.0&request=GetMap' +
  '&layers=dwd%3ANiederschlagsradar&styles=&crs=EPSG%3A3857&bbox={bbox-epsg-3857}' +
  '&width=256&height=256&format=image%2Fpng&transparent=true';
const RADAR_LAYER_ID = 'dwd-radar-wms';

const CATEGORY_COLOR: Record<string, string> = {
  park: tokens.park,
  'transit-stop': tokens.stop,
  pharmacy: tokens.pharmacy,
  toilet: tokens.toilet,
  'drinking-water': tokens.water,
  defibrillator: tokens.defibrillator,
  hospital: tokens.hospital,
  'fire-station': tokens.fireStation,
};

function markerEl(color: string, shape: 'circle' | 'ring' | 'square', title: string): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', title);
  el.title = title;
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.4)';
  el.style.cursor = 'pointer';
  if (shape === 'ring') {
    el.style.border = `2px solid ${color}`;
    el.style.borderRadius = '50%';
    el.style.background = 'transparent';
  } else {
    el.style.background = color;
    el.style.borderRadius = shape === 'circle' ? '50%' : '2px';
  }
  return el;
}

function pinEl(slot: string, color: string): HTMLElement {
  const el = document.createElement('div');
  el.textContent = slot;
  el.setAttribute('aria-label', `Vergleichspunkt ${slot}`);
  el.style.width = '24px';
  el.style.height = '24px';
  el.style.borderRadius = '50% 50% 50% 0';
  el.style.transform = 'rotate(-45deg)';
  el.style.background = color;
  el.style.color = '#10141a';
  el.style.fontWeight = '700';
  el.style.fontSize = '12px';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';
  const label = document.createElement('span');
  label.textContent = slot;
  label.style.transform = 'rotate(45deg)';
  el.textContent = '';
  el.appendChild(label);
  return el;
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const overlayMarkers = useRef<maplibregl.Marker[]>([]);
  const pinMarkers = useRef<Record<string, maplibregl.Marker>>({});
  const selectedMarker = useRef<maplibregl.Marker | null>(null);
  const readyRef = useRef(false);

  const { selectedPlace, pins, activeLayer, demoMode, radarOverlay } = useAppStore();
  const radarOverlayRef = useRef(radarOverlay);
  // The click handler lives in the init-once effect — it must read the CURRENT
  // demo state via a ref, not the stale closure value from mount time.
  const demoModeRef = useRef(demoMode);
  demoModeRef.current = demoMode;
  const air = useAirStations(selectedPlace, demoMode);
  const airModel = useAirModel(selectedPlace, demoMode);
  const pois = usePois(selectedPlace, demoMode);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_MAP_STYLE_URL,
      center: INITIAL_VIEW.center as LngLatLike,
      zoom: INITIAL_VIEW.zoom,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: BASE_MAP_ATTRIBUTION }),
      'bottom-right',
    );
    map.on('load', () => {
      readyRef.current = true;
    });
    map.on('click', (e) => {
      // Provisional point immediately; label upgrade is guarded against stale
      // reverse-geocode responses (see selection.ts — the "pointer jump" fix).
      void selectFromMapClick({ latitude: e.lngLat.lat, longitude: e.lngLat.lng }, (c) =>
        api.reverse(c, demoModeRef.current),
      );
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
     
  }, []);

  // DWD radar WMS overlay (toggle). Reads the latest toggle state via a ref so
  // a deferred style 'load' applies the current, not a stale, state.
  useEffect(() => {
    radarOverlayRef.current = radarOverlay;
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const want = radarOverlayRef.current;
      const has = !!map.getSource(RADAR_LAYER_ID);
      if (want && !has) {
        map.addSource(RADAR_LAYER_ID, {
          type: 'raster',
          tiles: [RADAR_WMS_TILES],
          tileSize: 256,
          attribution: 'Regenradar: Quelle Deutscher Wetterdienst',
        });
        map.addLayer({
          id: RADAR_LAYER_ID,
          type: 'raster',
          source: RADAR_LAYER_ID,
          paint: { 'raster-opacity': 0.55 },
        });
      } else if (!want && has) {
        if (map.getLayer(RADAR_LAYER_ID)) map.removeLayer(RADAR_LAYER_ID);
        map.removeSource(RADAR_LAYER_ID);
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [radarOverlay]);

  // Selected place marker + fly.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    selectedMarker.current?.remove();
    selectedMarker.current = null;
    if (!selectedPlace) return;
    const el = markerEl(tokens.pinA, 'circle', 'Gewählter Ort');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.boxShadow = `0 0 0 4px ${tokens.pinA}44, 0 0 0 2px rgba(0,0,0,0.5)`;
    selectedMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([selectedPlace.coordinates.longitude, selectedPlace.coordinates.latitude])
      .addTo(map);
    map.flyTo({
      center: [selectedPlace.coordinates.longitude, selectedPlace.coordinates.latitude],
      zoom: Math.max(map.getZoom(), 11),
      duration: 800,
    });
  }, [selectedPlace]);

  // A/B/C comparison pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const slot of ['A', 'B', 'C'] as const) {
      pinMarkers.current[slot]?.remove();
      delete pinMarkers.current[slot];
      const place = pins[slot];
      if (!place) continue;
      const color = slot === 'A' ? tokens.pinA : slot === 'B' ? tokens.pinB : tokens.pinC;
      pinMarkers.current[slot] = new maplibregl.Marker({ element: pinEl(slot, color) })
        .setLngLat([place.coordinates.longitude, place.coordinates.latitude])
        .addTo(map);
    }
  }, [pins]);

  // Analytical overlay markers depend on the active layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const m of overlayMarkers.current) m.remove();
    overlayMarkers.current = [];

    if (activeLayer === 'air-stations' && air.data?.data) {
      for (const s of air.data.data.stations) {
        const regional = stationSpatialRole(s.distanceMeters) === 'regional';
        const el = markerEl(
          regional ? tokens.stationRegional : tokens.station,
          regional ? 'ring' : 'circle',
          `${s.name} (${regional ? 'regionale Referenz' : 'nah'})`,
        );
        overlayMarkers.current.push(
          new maplibregl.Marker({ element: el })
            .setLngLat([s.coordinates.longitude, s.coordinates.latitude])
            .addTo(map),
        );
      }
    }

    if (activeLayer === 'air-model' && airModel.data?.data) {
      const m = airModel.data.data;
      // Grid cell centre as a square marker — regional (~10 km), not a point value.
      const el = markerEl(
        tokens.pinC,
        'square',
        `CAMS-Rasterzelle ~${m.resolutionKm ?? 10} km (regionaler modellierter Hintergrund)`,
      );
      el.style.width = '22px';
      el.style.height = '22px';
      el.style.opacity = '0.65';
      overlayMarkers.current.push(
        new maplibregl.Marker({ element: el })
          .setLngLat([m.cellLongitude, m.cellLatitude])
          .addTo(map),
      );
    }

    if ((activeLayer === 'places' || activeLayer === 'transit') && pois.data?.data) {
      const filtered =
        activeLayer === 'transit'
          ? pois.data.data.pois.filter((p) => p.category === 'transit-stop')
          : pois.data.data.pois;
      for (const p of filtered) {
        const el = markerEl(
          CATEGORY_COLOR[p.category] ?? tokens.neutral,
          'circle',
          p.name ?? p.category,
        );
        overlayMarkers.current.push(
          new maplibregl.Marker({ element: el })
            .setLngLat([p.coordinates.longitude, p.coordinates.latitude])
            .addTo(map),
        );
      }
    }
  }, [activeLayer, air.data, airModel.data, pois.data]);

  return (
    <div
      ref={containerRef}
      className="map-canvas"
      style={{ position: 'absolute', inset: 0 }}
      aria-label="Interaktive Karte von Deutschland. Klicken Sie, um einen Analysepunkt zu setzen."
      role="application"
    />
  );
}
