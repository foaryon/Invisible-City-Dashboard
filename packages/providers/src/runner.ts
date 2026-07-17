/**
 * Shared adapter runner: manifest gate → cache → policed fetch → runtime
 * validation happens in the adapter → cache store. Provider failure is never
 * concealed: on error we either serve a VISIBLY stale cached response or a
 * source-error envelope — never invented data, never a silent fallback.
 */
import { type ProviderManifestEntry, type ModuleEnvelope } from '@invisible-city/contracts';
import { policedFetch, ProviderHttpError, type FetchLike } from './http.js';
import { type ResponseCache } from './cache.js';
import { type ProviderConfig } from './config.js';

export interface AdapterContext {
  cache: ResponseCache;
  config: ProviderConfig;
  fetchImpl?: FetchLike;
}

export interface RawResult<T> {
  raw: T;
  retrievedAt: string;
  cacheAgeSeconds: number;
  stale: boolean;
}

export class ProviderNotLiveError extends Error {
  constructor(providerId: string, status: string) {
    super(`Provider ${providerId} has manifest status "${status}" and must not serve live data.`);
    this.name = 'ProviderNotLiveError';
  }
}

export async function fetchJsonWithCache<T = unknown>(
  provider: ProviderManifestEntry,
  fingerprint: string,
  url: string,
  ctx: AdapterContext,
  init?: RequestInit,
  /**
   * Per-request TTL override (seconds). Used for slow-changing sub-resources
   * (e.g. the UBA station directory) that may be cached far longer than the
   * provider's default measurement TTL.
   */
  ttlSecondsOverride?: number,
): Promise<RawResult<T>> {
  if (provider.status !== 'verified') {
    throw new ProviderNotLiveError(provider.providerId, provider.status);
  }
  const ttl = ttlSecondsOverride ?? provider.cachePolicy.ttlSeconds;
  const cached = ctx.cache.get<T>(provider.providerId, fingerprint, ttl);
  if (cached && !cached.stale) {
    return {
      raw: cached.payload,
      retrievedAt: cached.retrievedAt,
      cacheAgeSeconds: cached.ageSeconds,
      stale: false,
    };
  }
  try {
    const res = await policedFetch(url, {
      init: init ?? {},
      ...(ctx.fetchImpl ? { fetchImpl: ctx.fetchImpl } : {}),
    });
    const raw = (await res.json()) as T;
    ctx.cache.set(provider.providerId, fingerprint, provider.validationSchemaVersion, raw);
    return { raw, retrievedAt: new Date().toISOString(), cacheAgeSeconds: 0, stale: false };
  } catch (err) {
    if (cached) {
      // Last good response, served ONLY visibly labelled with its age (§3.1.J).
      return {
        raw: cached.payload,
        retrievedAt: cached.retrievedAt,
        cacheAgeSeconds: cached.ageSeconds,
        stale: true,
      };
    }
    throw err;
  }
}

export function errorEnvelope<T>(err: unknown, limitations: string[] = []): ModuleEnvelope<T> {
  const retrievedAt = new Date().toISOString();
  if (err instanceof ProviderNotLiveError) {
    return {
      status: 'configuration-required',
      demo: false,
      data: null,
      evidence: [],
      limitations,
      statusDetail:
        'Diese Quelle ist im Provider-Manifest nicht als „verified“ freigegeben und liefert keine Live-Daten.',
      retrievedAt,
    };
  }
  const detail =
    err instanceof ProviderHttpError
      ? err.kind === 'rate-limited'
        ? 'Die Quelle drosselt Anfragen (HTTP 429). Bitte später erneut versuchen.'
        : err.kind === 'timeout'
          ? 'Die Quelle hat nicht rechtzeitig geantwortet (Timeout).'
          : `Die Quelle hat einen Fehler gemeldet${err.statusCode ? ` (HTTP ${err.statusCode})` : ''}.`
      : 'Die Antwort der Quelle war ungültig oder die Quelle ist nicht erreichbar.';
  return {
    status: 'source-error',
    demo: false,
    data: null,
    evidence: [],
    limitations,
    statusDetail: `${detail} Es werden keine Ersatzwerte erzeugt.`,
    retrievedAt,
  };
}
