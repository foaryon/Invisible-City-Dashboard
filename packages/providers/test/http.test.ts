import { describe, it, expect } from 'vitest';
import { policedFetch, ProviderHttpError, USER_AGENT } from '../src/http.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('policedFetch — HTTP policy & error mapping', () => {
  it('returns the response on success and sends an identifying User-Agent', async () => {
    let seenUA: string | null = null;
    const res = await policedFetch('https://example.org/ok', {
      retries: 0,
      fetchImpl: (_url, init) => {
        seenUA = new Headers(init?.headers).get('User-Agent');
        return Promise.resolve(jsonResponse({ ok: true }));
      },
    });
    expect(res.status).toBe(200);
    expect(seenUA).toBe(USER_AGENT);
  });

  it('maps HTTP 429 to a rate-limited error and does not retry it', async () => {
    let calls = 0;
    await expect(
      policedFetch('https://example.org/rl', {
        retries: 3,
        fetchImpl: () => {
          calls++;
          return Promise.resolve(new Response('slow down', { status: 429 }));
        },
      }),
    ).rejects.toMatchObject({ kind: 'rate-limited', statusCode: 429 });
    expect(calls).toBe(1);
  });

  it('maps other HTTP errors to an http error (not retried)', async () => {
    let calls = 0;
    await expect(
      policedFetch('https://example.org/err', {
        retries: 2,
        fetchImpl: () => {
          calls++;
          return Promise.resolve(new Response('boom', { status: 500 }));
        },
      }),
    ).rejects.toMatchObject({ kind: 'http', statusCode: 500 });
    expect(calls).toBe(1);
  });

  it('retries gateway-transient statuses (502/503/504) once and can recover', async () => {
    let calls = 0;
    const res = await policedFetch('https://example.org/gw', {
      retries: 1,
      fetchImpl: () => {
        calls++;
        return Promise.resolve(
          calls === 1 ? new Response('overloaded', { status: 503 }) : jsonResponse({ ok: true }),
        );
      },
    });
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it('surfaces a persistent 504 as an http error after bounded retries', async () => {
    let calls = 0;
    await expect(
      policedFetch('https://example.org/gw2', {
        retries: 1,
        fetchImpl: () => {
          calls++;
          return Promise.resolve(new Response('gateway timeout', { status: 504 }));
        },
      }),
    ).rejects.toMatchObject({ kind: 'http', statusCode: 504 });
    expect(calls).toBe(2);
  });

  it('maps a transient network failure to a network error after bounded retries', async () => {
    let calls = 0;
    await expect(
      policedFetch('https://example.org/net', {
        retries: 0,
        fetchImpl: () => {
          calls++;
          return Promise.reject(new TypeError('fetch failed'));
        },
      }),
    ).rejects.toBeInstanceOf(ProviderHttpError);
    expect(calls).toBe(1);
  });

  it('serializes Overpass requests (fair use: one query at a time)', async () => {
    const order: string[] = [];
    const make = (id: string, delay: number) =>
      policedFetch('https://overpass-api.de/api/interpreter', {
        retries: 0,
        fetchImpl: () => {
          order.push(`start-${id}`);
          return new Promise<Response>((resolve) =>
            setTimeout(() => {
              order.push(`end-${id}`);
              resolve(jsonResponse({ id }));
            }, delay),
          );
        },
      });
    await Promise.all([make('A', 40), make('B', 5)]);
    // B must not start until A has finished (single-flight per host).
    expect(order.indexOf('start-B')).toBeGreaterThan(order.indexOf('end-A'));
  });
});
