/**
 * @invisible-city/map-style
 *
 * Base-map choice, analytical layer registry, legends and design tokens.
 * Core map rule (§8.1): visual precision must NOT exceed data precision.
 */
import type { DataMode } from '@invisible-city/contracts';

/**
 * Primary base map: OpenFreeMap "liberty" (no API key, no registration,
 * advertising-free; code MIT, data OSM/ODbL). basemap.de Web Vektor (BKG,
 * CC BY 4.0) is the documented alternative.
 */
export const BASE_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const BASE_MAP_ATTRIBUTION = 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap';

/** Germany-centric initial view. */
export const INITIAL_VIEW = { center: [10.45, 51.16] as [number, number], zoom: 5.5 };
export const GERMANY_BOUNDS: [[number, number], [number, number]] = [
  [4.5, 46.5],
  [16.5, 55.7],
];

export type AnalyticalLayerId =
  'weather' | 'air-stations' | 'air-model' | 'transit' | 'places' | 'availability';

export interface LegendItem {
  swatch: string;
  shape: 'circle' | 'square' | 'ring';
  label: string;
}

export interface AnalyticalLayer {
  id: AnalyticalLayerId;
  /** German UI title. */
  title: string;
  /** Source & spatial meaning shown in the legend (§4.3). */
  sourceNote: string;
  spatialMeaning: string;
  timeApplicability: string;
  limitations: string;
  modes: DataMode[];
  legend: LegendItem[];
  enabled: boolean;
}

/** Design tokens (dark, calm; color is never the sole status carrier). */
export const tokens = {
  pinA: '#e8b04b',
  pinB: '#5aa9e6',
  pinC: '#7fc8a9',
  station: '#c792ea',
  stationRegional: '#8a7fae',
  warning: '#e07a5f',
  park: '#6a9955',
  stop: '#5aa9e6',
  pharmacy: '#d4849b',
  toilet: '#9aa5b1',
  water: '#64b6c4',
  neutral: '#9aa5b1',
  unavailable: '#6b7280',
} as const;

export const analyticalLayers: AnalyticalLayer[] = [
  {
    id: 'weather',
    title: 'Wetter & Warnungen',
    sourceNote: 'Quelle: Deutscher Wetterdienst (über Bright Sky, inoffizielle Zugangsschicht)',
    spatialMeaning: 'Stationswerte/Vorhersagepunkte — keine Messung am Pin.',
    timeApplicability: 'Beobachtung (Vergangenheit) und Prognose (bis +48 h) getrennt.',
    limitations: 'Warnungen sind amtliche Gebietswarnungen (Gemeindeebene), keine lokale Schwere.',
    modes: ['observed', 'forecast'],
    legend: [
      { swatch: '#e8b04b', shape: 'circle', label: 'Gewählter Ort (Analysepunkt)' },
      { swatch: '#e07a5f', shape: 'square', label: 'Amtliche Warnung aktiv (Gemeinde)' },
    ],
    enabled: true,
  },
  {
    id: 'air-stations',
    title: 'Luft: Stationsmessungen',
    sourceNote: 'Umweltbundesamt / Messnetze der Länder (dl-de/by-2-0)',
    spatialMeaning: 'Punktmarker je Station — KEINE Interpolation, keine Fläche.',
    timeApplicability: 'Letzte verfügbare Messung; Daten des laufenden Jahres vorläufig.',
    limitations: 'Eine Station >5 km ist regionale Referenz, kein lokaler Wert.',
    modes: ['observed'],
    legend: [
      { swatch: '#c792ea', shape: 'circle', label: 'Messstation (≤5 km: nah)' },
      { swatch: '#8a7fae', shape: 'ring', label: 'Messstation (>5 km: regionale Referenz)' },
    ],
    enabled: true,
  },
  {
    id: 'air-model',
    title: 'Luft: Regionales Modell (CAMS)',
    sourceNote: 'Copernicus Atmosphere Monitoring Service — noch nicht integriert',
    spatialMeaning: 'Raster ~10–20 km; niemals adressgenau.',
    timeApplicability: 'Analyse + Prognose bis +96 h (nach Aktivierung).',
    limitations: 'Nicht aktiviert: Registrierung, Abruf und Produkteignung sind nicht verifiziert.',
    modes: ['modelled'],
    legend: [{ swatch: '#6b7280', shape: 'square', label: 'Nicht integriert (Stage 4)' }],
    enabled: false,
  },
  {
    id: 'transit',
    title: 'ÖPNV-Kontext',
    sourceNote: 'Halte: OpenStreetMap (kartiert); Fahrplan/Echtzeit: nicht integriert',
    spatialMeaning: 'Kartierte Haltepunkte — keine Betriebsaussage.',
    timeApplicability: 'Kartierungsstand; keine Fahrplan- oder Echtzeitbindung.',
    limitations: 'Fehlende Echtzeit bedeutet NICHT Normalbetrieb.',
    modes: ['mapped'],
    legend: [
      { swatch: '#5aa9e6', shape: 'circle', label: 'Kartierter Halt (OSM)' },
      { swatch: '#9aa5b1', shape: 'square', label: 'Echtzeit: nicht integriert (neutral)' },
    ],
    enabled: true,
  },
  {
    id: 'places',
    title: 'Orte & kartierter Kontext',
    sourceNote: '© OpenStreetMap contributors (ODbL)',
    spatialMeaning: 'Kartierte Objekte (Punkt/Fläche) — „grün“ heißt kartiert, nicht „gut“.',
    timeApplicability: 'Kartierungsstand (OSM-Basiszeitstempel in der Evidenz).',
    limitations: 'Keine Aussage zu Öffnung, Betrieb, Barrierefreiheit, Schatten oder Sicherheit.',
    modes: ['mapped'],
    legend: [
      { swatch: '#6a9955', shape: 'square', label: 'Park/Grünfläche (kartiert)' },
      { swatch: '#d4849b', shape: 'circle', label: 'Apotheke (kartiert)' },
      { swatch: '#9aa5b1', shape: 'circle', label: 'Toilette (kartiert)' },
      { swatch: '#64b6c4', shape: 'circle', label: 'Trinkwasser (kartiert)' },
      { swatch: '#5aa9e6', shape: 'circle', label: 'Halt (kartiert)' },
    ],
    enabled: true,
  },
  {
    id: 'availability',
    title: 'Datenverfügbarkeit',
    sourceNote: 'Abdeckungsmatrix aller Quellen für den gewählten Ort',
    spatialMeaning: 'Je Quelle: Punkt-, Raster- oder Abdeckungssemantik.',
    timeApplicability: 'Zum Abrufzeitpunkt.',
    limitations: 'Neutrale Faktenanzeige — fehlende Abdeckung ist kein Alarmzustand.',
    modes: ['partial', 'unavailable'],
    legend: [
      { swatch: '#7fc8a9', shape: 'circle', label: 'Verfügbar' },
      { swatch: '#9aa5b1', shape: 'circle', label: 'Teilweise / unbekannt' },
      { swatch: '#6b7280', shape: 'ring', label: 'Nicht integriert / nicht verfügbar' },
    ],
    enabled: true,
  },
];
