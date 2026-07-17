import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type FastifyInstance } from 'fastify';
import { moduleEnvelopeSchema, WeatherContextSchema } from '@invisible-city/contracts';
import { loadConfig } from '@invisible-city/providers';
import { buildServer } from '../src/server.js';

let app: FastifyInstance;

beforeAll(async () => {
  // Demo is opt-in via ENABLE_DEMO; enable it so the demo paths are exercised.
  app = await buildServer({ config: loadConfig({ ENABLE_DEMO: '1' } as NodeJS.ProcessEnv) });
});

afterAll(async () => {
  await app.close();
});

describe('API shell', () => {
  it('reports health with manifest version', async () => {
    const res = await app.inject({ url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().manifestVersion).toBeTruthy();
  });

  it('exposes the provider manifest', async () => {
    const res = await app.inject({ url: '/api/providers' });
    const body = res.json();
    expect(body.providers.length).toBeGreaterThanOrEqual(8);
    const cams = body.providers.find(
      (p: { providerId: string }) => p.providerId === 'cams-eu-airquality',
    );
    expect(cams.status).toBe('proposed');
  });

  it('rejects invalid coordinates with 400', async () => {
    const res = await app.inject({ url: '/api/weather?lat=999&lon=13.4' });
    expect(res.statusCode).toBe(400);
  });
});

describe('demo mode over the API (never mixed with live)', () => {
  it('serves demo weather as a valid, demo-stamped envelope', async () => {
    const res = await app.inject({ url: '/api/weather?lat=52.52&lon=13.405&demo=1' });
    expect(res.statusCode).toBe(200);
    const parsed = moduleEnvelopeSchema(WeatherContextSchema).parse(res.json());
    expect(parsed.status).toBe('demo');
    expect(parsed.demo).toBe(true);
    expect(parsed.limitations[0]).toContain('DEMO-DATEN');
    expect(parsed.evidence.every((e) => e.mode === 'demo')).toBe(true);
  });

  it('serves demo search producing SelectedPlace contracts (Germany only)', async () => {
    const res = await app.inject({ url: '/api/search?q=berlin&demo=1' });
    const body = res.json();
    expect(body.demo).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    for (const r of body.data) expect(r.place.country).toBe('DE');
  });

  it('serves demo air stations, warnings, POIs and transit', async () => {
    for (const path of [
      '/api/air/stations?lat=52.52&lon=13.405&demo=1',
      '/api/warnings?lat=52.52&lon=13.405&demo=1',
      '/api/pois?lat=52.52&lon=13.405&demo=1',
      '/api/transit?lat=52.52&lon=13.405&stopCount=3&demo=1',
    ]) {
      const res = await app.inject({ url: path });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.demo).toBe(true);
      expect(body.status).toBe('demo');
    }
  });
});

describe('readiness (config-driven activation)', () => {
  it('reports keyless providers live and CAMS/DELFI as needing configuration', async () => {
    const res = await app.inject({ url: '/api/readiness' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const byId = Object.fromEntries(
      body.providers.map((p: { providerId: string }) => [p.providerId, p]),
    );
    expect(byId['dwd-brightsky'].live).toBe(true);
    expect(byId['uba-airdata'].live).toBe(true);
    expect(byId['cams-eu-airquality'].live).toBe(false);
    expect(byId['cams-eu-airquality'].requiresEnv).toContain('CAMS_ADS_KEY');
    expect(byId['delfi-gtfs'].live).toBe(false);
  });

  it('CAMS air-model reports configuration-required without a key (not demo, not invented)', async () => {
    const res = await app.inject({ url: '/api/air/model?lat=52.52&lon=13.405' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('configuration-required');
    expect(body.demo).toBe(false);
    expect(body.data).toBeNull();
  });
});

describe('production posture: demo disabled by default', () => {
  it('ignores ?demo=1 when ENABLE_DEMO is not set (serves live, never demo)', async () => {
    const prod = await buildServer(); // default config → enableDemo false
    try {
      const res = await prod.inject({ url: '/api/weather?lat=52.52&lon=13.405&demo=1' });
      const body = res.json();
      expect(body.demo).toBe(false);
      expect(body.status).not.toBe('demo');
    } finally {
      await prod.close();
    }
  }, 90_000);
});

describe('live mode without network (provider failure is visible, never invented)', () => {
  it('returns a source-error envelope when live sources are unreachable', async () => {
    // In the test environment outbound calls fail; the API must surface this
    // as source-error with null data — no demo fallback, no invented values.
    const res = await app.inject({ url: '/api/warnings?lat=52.52&lon=13.405' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.demo).toBe(false);
    if (body.status !== 'ok') {
      expect(['source-error', 'stale', 'unavailable']).toContain(body.status);
      expect(body.data).toBeNull();
      expect(body.statusDetail).toBeTruthy();
    }
  }, 90_000);
});
