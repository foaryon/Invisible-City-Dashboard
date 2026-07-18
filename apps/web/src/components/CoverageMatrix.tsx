import { type AvailabilityState, type TransitCoverage } from '@invisible-city/contracts';
import { formatDistanceGerman } from '@invisible-city/evidence';
import { useAppStore, selectedInstantIso } from '../state/store.js';
import {
  useWeather,
  useWarnings,
  useAirStations,
  useAirModel,
  usePois,
  useTransit,
  useWater,
  useRadiation,
  usePollen,
  useUv,
  useRadar,
  useCivilWarnings,
  useAutobahn,
  useQuakes,
  useClimateNormals,
  useFuel,
  useStationFacilities,
} from '../queries.js';

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

function coverageState(coverage: TransitCoverage | undefined): AvailabilityState {
  switch (coverage) {
    case 'confirmed':
      return 'available';
    case 'partial':
      return 'partial';
    case 'not-covered':
      return 'unavailable';
    case 'temporarily-unavailable':
      return 'source-error';
    default:
      return 'not-integrated';
  }
}

export function CoverageMatrix() {
  const { selectedPlace, demoMode, timeOffsetHours } = useAppStore();
  const weather = useWeather(selectedPlace, demoMode);
  const warnings = useWarnings(selectedPlace, demoMode);
  const air = useAirStations(selectedPlace, demoMode);
  const airModel = useAirModel(selectedPlace, demoMode);
  const pois = usePois(selectedPlace, demoMode);
  const transit = useTransit(selectedPlace, selectedInstantIso(timeOffsetHours), demoMode);
  const water = useWater(selectedPlace, demoMode);
  const radiation = useRadiation(selectedPlace, demoMode);
  const pollen = usePollen(selectedPlace, demoMode);
  const uv = useUv(selectedPlace, demoMode);
  const radar = useRadar(selectedPlace, demoMode);
  const civil = useCivilWarnings(selectedPlace, demoMode);
  const autobahn = useAutobahn(selectedPlace, demoMode);
  const quakes = useQuakes(selectedPlace, demoMode);
  const normals = useClimateNormals(selectedPlace, demoMode);
  const fuel = useFuel(selectedPlace, demoMode);
  const facilities = useStationFacilities(selectedPlace, demoMode);

  if (!selectedPlace) {
    return (
      <section className="panel-section" aria-label="Datenverfügbarkeit">
        <h2 className="panel-title">Datenverfügbarkeit</h2>
        <p className="loading-shimmer">Kein Ort gewählt.</p>
      </section>
    );
  }

  const nearestStation = air.data?.data?.stations?.[0];
  const stopCount =
    pois.data?.data?.pois.filter((p) => p.category === 'transit-stop').length ?? null;
  const transitData = transit.data?.data;
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
      state: moduleState(airModel.data?.status, airModel.isLoading),
      detail:
        airModel.data?.status === 'ok'
          ? 'CAMS ~10-km-Raster'
          : 'CAMS (Schlüssel erforderlich: CAMS_ADS_KEY)',
    },
    {
      label: 'Kartierte Halte',
      state: stopCount === null ? 'unavailable' : stopCount > 0 ? 'available' : 'partial',
      detail: stopCount === null ? 'OSM' : `${stopCount} kartiert (OSM)`,
    },
    {
      label: 'Fahrplan (ÖPNV)',
      state: coverageState(transitData?.scheduled.coverage),
      detail:
        transitData?.scheduled.coverage === 'confirmed'
          ? 'DELFI GTFS (Soll-Fahrplan)'
          : 'DELFI GTFS (GTFS_STATIC_PATH erforderlich)',
    },
    {
      label: 'Echtzeit (ÖPNV)',
      state: coverageState(transitData?.realtime.coverage),
      detail:
        transitData?.realtime.coverage === 'partial'
          ? 'GTFS-RT (Abdeckung partiell)'
          : 'GTFS-RT (GTFS_RT_URL erforderlich)',
    },
    {
      label: 'Kartierter POI-Kontext',
      state: moduleState(pois.data?.status, pois.isLoading),
      detail: 'OSM, Vollständigkeit unbekannt',
    },
    {
      label: 'Notfall & Gesundheit',
      state: (() => {
        const base = moduleState(pois.data?.status, pois.isLoading);
        if (base !== 'available') return base;
        const n =
          pois.data?.data?.pois.filter((p) =>
            ['defibrillator', 'hospital', 'fire-station', 'pharmacy'].includes(p.category),
          ).length ?? 0;
        return n > 0 ? 'available' : 'partial';
      })(),
      detail: 'AED/Krankenhaus/Apotheke/Feuerwache (OSM)',
    },
    {
      label: 'Regenradar',
      state: moduleState(radar.data?.status, radar.isLoading),
      detail: 'DWD RADOLAN 1 km (über Bright Sky)',
    },
    {
      label: 'Pollenflug',
      state: moduleState(pollen.data?.status, pollen.isLoading),
      detail: 'DWD Gefahrenindex (Großregion)',
    },
    {
      label: 'UV-Index',
      state: moduleState(uv.data?.status, uv.isLoading),
      detail: uv.data?.data ? `DWD Referenzort ${uv.data.data.cityName}` : 'DWD Referenzorte',
    },
    {
      label: 'Wasserstände',
      state: moduleState(water.data?.status, water.isLoading),
      detail: water.data?.data?.stations?.[0]
        ? `Pegel ${formatDistanceGerman(water.data.data.stations[0].distanceMeters)} entfernt`
        : 'WSV/PEGELONLINE (Bundeswasserstraßen)',
    },
    {
      label: 'Radioaktivität (ODL)',
      state: moduleState(radiation.data?.status, radiation.isLoading),
      detail: radiation.data?.data?.stations?.[0]
        ? `Sonde ${formatDistanceGerman(radiation.data.data.stations[0].distanceMeters)} entfernt`
        : 'BfS ODL-Messnetz',
    },
    {
      label: 'Zivilschutz (NINA)',
      state: moduleState(civil.data?.status, civil.isLoading),
      detail: civil.data?.data ? `Kreisebene, ARS ${civil.data.data.ars}` : 'BBK NINA (Kreisebene)',
    },
    {
      label: 'Autobahn-Verkehrslage',
      state: moduleState(autobahn.data?.status, autobahn.isLoading),
      detail: 'Autobahn GmbH (nur Bundesautobahnen)',
    },
    {
      label: 'Erdbeben',
      state: moduleState(quakes.data?.status, quakes.isLoading),
      detail: 'GFZ GEOFON (Katalog, 200-km-Umkreis)',
    },
    {
      label: 'Klimanormalwerte',
      state: moduleState(normals.data?.status, normals.isLoading),
      detail: normals.data?.data
        ? `Station ${formatDistanceGerman(normals.data.data.distanceMeters)} entfernt (1991–2020)`
        : 'DWD CDC (1991–2020)',
    },
    {
      label: 'Kraftstoffpreise',
      state: moduleState(fuel.data?.status, fuel.isLoading),
      detail:
        fuel.data?.status === 'configuration-required'
          ? 'MTS-K/Tankerkönig (TANKERKOENIG_API_KEY erforderlich)'
          : 'MTS-K/Tankerkönig',
    },
    {
      label: 'Bahnhofs-Aufzüge',
      state: moduleState(facilities.data?.status, facilities.isLoading),
      detail:
        facilities.data?.status === 'configuration-required'
          ? 'DB FaSta (DB_CLIENT_ID/DB_API_KEY erforderlich)'
          : 'DB FaSta (DB-Stationen)',
    },
  ];

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
