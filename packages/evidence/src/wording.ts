/**
 * Wording policy (§9): careful German UI language.
 * These helpers are the single source of mode labels and guard against
 * disallowed claim patterns in UI copy.
 */
import { type DataMode, type AvailabilityState } from '@invisible-city/contracts';

/** German data-mode chip labels. */
export const MODE_LABEL_DE: Record<DataMode, string> = {
  observed: 'Gemessen',
  forecast: 'Prognose',
  modelled: 'Modelliert',
  mapped: 'Kartierter Kontext',
  scheduled: 'Fahrplan',
  realtime: 'Echtzeit',
  partial: 'Teilweise',
  cached: 'Zwischengespeichert',
  unavailable: 'Nicht verfügbar',
  demo: 'Demo',
};

export const AVAILABILITY_LABEL_DE: Record<AvailabilityState, string> = {
  available: 'Verfügbar',
  partial: 'Teilweise verfügbar',
  stale: 'Veraltet (zwischengespeichert)',
  unavailable: 'Nicht verfügbar',
  'not-integrated': 'Nicht integriert',
  'configuration-required': 'Konfiguration erforderlich',
  'source-error': 'Quellenfehler',
  demo: 'Demo-Daten',
};

export const DEMO_BANNER_TEXT = 'DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN';

export const NO_DATA_TEXT_DE = 'Keine verifizierten Daten verfügbar';

/**
 * Disallowed claim patterns (§9). Used by tests and by a dev-time guard to
 * keep forbidden phrasing out of UI strings.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /hier ist die luft sauber/i,
  // declension-robust: sauberste/sauberster/saubersten Spaziergang
  /saubers\w* spaziergang/i,
  /(die|der|das) beste gegend/i,
  /zuverlässigste[rn]? öpnv/i,
  /keine störung/i,
  /sicherer ort/i,
  /schatten vorhanden/i,
  /kühlort/i,
  /exakter wert am standort/i,
];

export function violatesWordingPolicy(text: string): boolean {
  return FORBIDDEN_PATTERNS.some((p) => p.test(text));
}

/**
 * "Live" is disallowed for cached/scheduled data. Returns the safe label for
 * a freshness badge given the data mode.
 */
export function freshnessLabelDe(mode: DataMode, cacheAgeSeconds?: number): string {
  if (mode === 'realtime' && (cacheAgeSeconds ?? 0) < 90) return 'Echtzeit';
  if (cacheAgeSeconds !== undefined && cacheAgeSeconds > 0) {
    return 'Zwischengespeichert';
  }
  return MODE_LABEL_DE[mode];
}
