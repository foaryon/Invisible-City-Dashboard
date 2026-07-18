/**
 * HTTP policy layer: timeouts, identifying User-Agent, per-host minimum
 * request spacing (Nominatim/Photon policy: max 1 req/s) and strict
 * serialization for Overpass (fair use: one query at a time, no parallel
 * queries). No retries on 4xx policy denials; bounded retry on transient
 * network errors.
 */

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export const USER_AGENT =
  'InvisibleCity/0.1 (integration & evidence layer; local-first; contact: see repository)';

export class ProviderHttpError extends Error {
  constructor(
    message: string,
    public readonly kind: 'timeout' | 'network' | 'http' | 'rate-limited',
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ProviderHttpError';
  }
}

interface HostPolicy {
  minIntervalMs: number;
  serialize: boolean;
}

const HOST_POLICIES: Record<string, HostPolicy> = {
  'overpass-api.de': { minIntervalMs: 2000, serialize: true },
  'overpass.kumi.systems': { minIntervalMs: 2000, serialize: true },
  'photon.komoot.io': { minIntervalMs: 1000, serialize: true },
  'nominatim.openstreetmap.org': { minIntervalMs: 1100, serialize: true },
};

const lastRequestAt = new Map<string, number>();
const hostQueues = new Map<string, Promise<unknown>>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function respectHostPolicy(host: string): Promise<void> {
  const policy = HOST_POLICIES[host];
  if (!policy) return;
  const last = lastRequestAt.get(host) ?? 0;
  const wait = last + policy.minIntervalMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt.set(host, Date.now());
}

export interface PolicedFetchOptions {
  timeoutMs?: number;
  retries?: number;
  init?: RequestInit;
  fetchImpl?: FetchLike;
}

/**
 * Fetch with host policy, timeout and bounded transient-error retry.
 * 429 is surfaced as `rate-limited` (never retried immediately);
 * other 4xx/5xx surface as `http` errors — callers map them to visible
 * source-error states, never to invented data.
 */
export async function policedFetch(url: string, opts: PolicedFetchOptions = {}): Promise<Response> {
  const { timeoutMs = 15000, retries = 2, init, fetchImpl = fetch } = opts;
  const host = new URL(url).host;
  const policy = HOST_POLICIES[host];

  const run = async (): Promise<Response> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(500 * 2 ** attempt);
      await respectHostPolicy(host);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(url, {
          ...init,
          headers: { 'User-Agent': USER_AGENT, ...(init?.headers ?? {}) },
          signal: controller.signal,
        });
        if (res.status === 429) {
          throw new ProviderHttpError(`Rate limited by ${host}`, 'rate-limited', 429);
        }
        if (!res.ok) {
          throw new ProviderHttpError(`HTTP ${res.status} from ${host}`, 'http', res.status);
        }
        return res;
      } catch (err) {
        lastError = err;
        if (err instanceof ProviderHttpError) {
          // Gateway-transient statuses (502/503/504) get the same bounded retry
          // as network errors — a single overload blip should not surface as a
          // module outage. 429 and all other HTTP errors are never retried.
          const transient =
            err.kind === 'http' &&
            (err.statusCode === 502 || err.statusCode === 503 || err.statusCode === 504);
          if (!transient || attempt === retries) throw err;
        }
        // AbortError / network errors are transient → bounded retry
      } finally {
        clearTimeout(timer);
      }
    }
    if (lastError instanceof Error && lastError.name === 'AbortError') {
      throw new ProviderHttpError(`Timeout after ${timeoutMs} ms for ${host}`, 'timeout');
    }
    throw new ProviderHttpError(
      `Network error for ${host}: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      'network',
    );
  };

  if (policy?.serialize) {
    const prev = hostQueues.get(host) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(run);
    hostQueues.set(
      host,
      next.catch(() => undefined),
    );
    return next;
  }
  return run();
}
