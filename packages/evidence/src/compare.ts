/**
 * Comparability rules (reality policy §2.2 / §3.1.G):
 * compare observed with observed and modelled with modelled only, and only
 * when pollutant/parameter and time context are comparable. Never fuse
 * incomparable inputs into scores or rankings.
 */
import { type DataMode } from '@invisible-city/contracts';

export interface ComparableInput {
  mode: DataMode;
  parameter: string;
  /** ISO instant the value is valid/measured for; null = unknown. */
  validAt: string | null;
}

export type ComparabilityVerdict = { comparable: true } | { comparable: false; reasonDe: string };

/** Max time skew between two values still considered "the same time context". */
export const MAX_COMPARABLE_SKEW_SECONDS = 2 * 3600;

const NON_COMPARABLE_MODES: DataMode[] = ['unavailable', 'demo'];

export function assessComparability(a: ComparableInput, b: ComparableInput): ComparabilityVerdict {
  if (a.parameter !== b.parameter) {
    return {
      comparable: false,
      reasonDe:
        'Unterschiedliche Messgrößen — für diesen Vergleich nicht ausreichend vergleichbar.',
    };
  }
  if (NON_COMPARABLE_MODES.includes(a.mode) || NON_COMPARABLE_MODES.includes(b.mode)) {
    return {
      comparable: false,
      reasonDe: 'Keine verifizierten Daten verfügbar — Vergleich nicht möglich.',
    };
  }
  if (a.mode !== b.mode) {
    return {
      comparable: false,
      reasonDe: `Unterschiedliche Datenarten (${a.mode} vs. ${b.mode}) — für diesen Vergleich nicht ausreichend vergleichbar.`,
    };
  }
  if (a.validAt && b.validAt) {
    const skew = Math.abs(new Date(a.validAt).getTime() - new Date(b.validAt).getTime()) / 1000;
    if (Number.isFinite(skew) && skew > MAX_COMPARABLE_SKEW_SECONDS) {
      return {
        comparable: false,
        reasonDe:
          'Unterschiedliche Zeitbezüge — für diesen Vergleich nicht ausreichend vergleichbar.',
      };
    }
  } else if (!a.validAt || !b.validAt) {
    return {
      comparable: false,
      reasonDe: 'Zeitbezug unvollständig — für diesen Vergleich nicht ausreichend vergleichbar.',
    };
  }
  return { comparable: true };
}
