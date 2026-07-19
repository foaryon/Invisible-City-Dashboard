/**
 * Contract-validated envelope fixtures for the degraded-state E2E lane
 * (TEST_DATA_AND_FIXTURE_POLICY.md §3: Playwright network interception serving
 * crafted ModuleEnvelopes; no request leaves the browser; demo mode off).
 *
 * Every fixture passes through the REAL Zod contract at construction, so a
 * contract change fails these tests loudly instead of silently testing a
 * stale envelope shape.
 */
import { z } from 'zod';
import {
  moduleEnvelopeSchema,
  GeocodeResultSchema,
  type GeocodeResult,
  type ModuleEnvelope,
  type ModuleStatus,
} from '../../packages/contracts/src/index.js';

const AnyEnvelope = moduleEnvelopeSchema(z.unknown());

/** Fixed instant — determinism rule: no Date.now() in fixtures. */
export const FIXTURE_RETRIEVED_AT = '2026-07-16T10:00:00+02:00';

const DEFAULT_DETAIL: Partial<Record<ModuleStatus, string>> = {
  partial: 'Teilweise Daten: nicht alle Werte lieferbar (E2E-Fixture).',
  stale: 'Zwischengespeicherte Daten, 45 Minuten alt (E2E-Fixture).',
  unavailable: 'Keine verifizierten Daten für diesen Ort verfügbar (E2E-Fixture).',
  'source-error': 'Quelle nicht erreichbar (E2E-Fixture).',
  'configuration-required': 'Konfiguration erforderlich: FIXTURE_ENV_VAR (E2E-Fixture).',
};

export function makeEnvelope<T>(
  overrides: Partial<ModuleEnvelope<T>> & { status: ModuleStatus },
): ModuleEnvelope<T> {
  const env: ModuleEnvelope<T> = {
    demo: false,
    data: null,
    evidence: [],
    limitations: [],
    retrievedAt: FIXTURE_RETRIEVED_AT,
    ...(DEFAULT_DETAIL[overrides.status] ? { statusDetail: DEFAULT_DETAIL[overrides.status] } : {}),
    ...overrides,
  };
  // Fixture drift vs the contract fails the test loudly at construction time.
  return AnyEnvelope.parse(env) as ModuleEnvelope<T>;
}

/**
 * Canonical Berlin (reference-location registry #2, TEST_DATA_AND_FIXTURE_POLICY §4)
 * as a valid /api/search response, so place selection runs through the normal
 * SearchBox flow with zero real network.
 */
export function berlinSearchEnvelope(): ModuleEnvelope<GeocodeResult[]> {
  const results: GeocodeResult[] = [
    {
      place: {
        id: 'e2e:berlin',
        label: 'Berlin',
        coordinates: { latitude: 52.52, longitude: 13.405 },
        locality: 'Berlin',
        state: 'Berlin',
        country: 'DE',
      },
      mode: 'mapped',
    },
  ];
  const schema = moduleEnvelopeSchema(z.array(GeocodeResultSchema));
  return schema.parse(
    makeEnvelope<GeocodeResult[]>({ status: 'ok', data: results }),
  ) as ModuleEnvelope<GeocodeResult[]>;
}
