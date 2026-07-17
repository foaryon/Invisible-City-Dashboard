import { type AvailabilityState } from '@invisible-city/contracts';
import { formatDistanceGerman } from '@invisible-city/evidence';
import { useAppStore } from '../state/store.js';
import { useWeather, useWarnings, useAirStations, usePois, useTransit } from '../queries.js';

interface Row {
  label: string;
  state: AvailabilityState;
  detail: string;
}

const STATE_LABEL: Record<AvailabilityState, string> = {
  available: 'verfügbar',
  partial: 'teilweise',
  stale: 'veraltet (Cache)',
  unavailable: 'nicht verfügbar',
  'not-integrated': 'nicht integriert',
  'configuration-required': 'Konfiguration nötig',
  'source-error': 'Quellenfehler',
  demo: 'Demo',
};

function moduleState(status: string | undefined, loading: boolean): AvailabilityState {
  if (loading || !status) return 'unavailable';
  switch (status) {
    case 'ok':
      return 'available';
    case 'partial':
      return 'partial';
    case 'stale':
      return 'stale';
    case 'demo':
      return 'demo';
    case 'source-error':
      return 'source-error';
    case 'configuration-required':
      return 'configuration-required';
    default:
      return 'unavailable';
  }
}

export function CoverageMatrix() {
  const { selectedPlace, demoMode } = useAppStore();
  const weather = useWeather(selectedPlace, demoMode);
  const warnings = useWarnings(selectedPlace, demoMode);
  const air = useAirStations(selectedPlace, demoMode);
  const pois = usePois(selectedPlace, demoMode);
  const stopCount =
    pois.data?.data?.pois.filter((p) => p.category === 'transit-stop').length ?? null;
  const transit = useTransit(selectedPlace, stopCount, demoMode);

  if (!selectedPlace) {
    return (
      <section className="panel-section" aria-label="Datenverfügbarkeit">
        <h2 className="panel-title">Datenverfügbarkeit</h2>
        <p className="loading-shimmer">Kein Ort gewählt.</p>
      </section>
    );
  }

  const nearestStation = air.data?.data?.stations?.[0];
  const rows: Row[] = [
    {
      label: 'Wettervorhersage',
      state: moduleState(weather.data?.status, weather.isLoading),
      detail: 'DWD (über Bright Sky)',
    },
    {
      label: 'Amtliche Warnungen',
      state: moduleState(warnings.data?.status, warnings.isLoading),
      detail: 'DWD Gemeindeebene',
    },
    {
      label: 'Luft: Messstation',
      state: moduleState(air.data?.status, air.isLoading),
      detail: nearestStation
        ? `Station ${formatDistanceGerman(nearestStation.distanceMeters)} entfernt`
        : 'UBA/Länder',
    },
    {
      label: 'Luft: Regionales Modell',
      state: 'not-integrated',
      detail: 'CAMS ~10-km-Raster (Stage 4, nicht aktiviert)',
    },
    {
      label: 'Kartierte Halte',
      state: stopCount === null ? 'unavailable' : stopCount > 0 ? 'available' : 'partial',
      detail: stopCount === null ? 'OSM' : `${stopCount} kartiert (OSM)`,
    },
    {
      label: 'Fahrplan (ÖPNV)',
      state: 'not-integrated',
      detail: 'DELFI GTFS (nicht aktiviert)',
    },
    {
      label: 'Echtzeit (ÖPNV)',
      state: 'not-integrated',
      detail: 'GTFS-RT (deutschlandweit nur partiell; nicht aktiviert)',
    },
    {
      label: 'Kartierter POI-Kontext',
      state: moduleState(pois.data?.status, pois.isLoading),
      detail: 'OSM, Vollständigkeit unbekannt',
    },
  ];
  void transit;

  return (
    <section className="panel-section" aria-label="Datenverfügbarkeit">
      <h2 className="panel-title">Datenverfügbarkeit</h2>
      <ul className="coverage-list">
        {rows.map((r) => (
          <li key={r.label}>
            <span>
              <span className="cov-label">{r.label}</span>
              <br />
              <span className="cov-detail">{r.detail}</span>
            </span>
            <span className="status-pill" data-state={r.state}>
              {STATE_LABEL[r.state]}
            </span>
          </li>
        ))}
      </ul>
      <p className="loading-shimmer" style={{ marginTop: 8 }}>
        Neutrale Faktenanzeige. Fehlende Abdeckung ist kein Alarmzustand und bedeutet nicht, dass
        „nichts los“ ist.
      </p>
    </section>
  );
}
