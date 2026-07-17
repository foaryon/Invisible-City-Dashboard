/**
 * The Invisible City — API (Fastify).
 *
 * Provider orchestration only: no provider parsing logic lives in the UI.
 * Demo vs. live is decided PER REQUEST via ?demo=1 and can never mix inside a
 * response; demo envelopes are stamped end-to-end (status "demo", demo=true).
 */
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { CoordinatesSchema, type Coordinates } from '@invisible-city/contracts';
import {
  providerManifest,
  MANIFEST_VERSION,
  createSqliteCache,
  createMemoryCache,
  type ResponseCache,
  type AdapterContext,
  getWeatherContext,
  getWarningContext,
  getAirStationContext,
  getPoiContext,
  searchPlaces,
  reverseGeocode,
  getTransitAvailability,
  demoAdapters,
} from '@invisible-city/providers';

export interface ServerOptions {
  cache?: ResponseCache;
  cachePath?: string;
  logger?: boolean;
}

const CoordsQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  demo: z.coerce.string().optional(),
});

const isDemo = (q: { demo?: string | undefined }) => q.demo === '1' || q.demo === 'true';

function parseCoords(q: { lat: number; lon: number }): Coordinates {
  return CoordinatesSchema.parse({ latitude: q.lat, longitude: q.lon });
}

export async function buildServer(opts: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });
  await app.register(cors, { origin: true });

  const cache =
    opts.cache ?? (opts.cachePath ? createSqliteCache(opts.cachePath) : createMemoryCache());
  const ctx: AdapterContext = { cache };

  app.addHook('onClose', async () => cache.close());

  app.get('/api/health', async () => ({
    status: 'ok',
    manifestVersion: MANIFEST_VERSION,
    time: new Date().toISOString(),
  }));

  app.get('/api/providers', async () => ({
    manifestVersion: MANIFEST_VERSION,
    providers: providerManifest,
  }));

  app.get('/api/search', async (req, reply) => {
    const Query = z.object({ q: z.string().min(2), demo: z.string().optional() });
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Suchanfrage.' });
    if (isDemo(parsed.data)) return demoAdapters.search(parsed.data.q);
    return searchPlaces(parsed.data.q, ctx);
  });

  app.get('/api/reverse', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (isDemo(parsed.data)) return demoAdapters.reverse(coords);
    return reverseGeocode(coords, ctx);
  });

  app.get('/api/weather', async (req, reply) => {
    const Query = CoordsQuery.extend({
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
    });
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Anfrage.' });
    const coords = parseCoords(parsed.data);
    const now = Date.now();
    const from = parsed.data.from ?? new Date(now - 2 * 3600_000).toISOString();
    const to = parsed.data.to ?? new Date(now + 48 * 3600_000).toISOString();
    if (isDemo(parsed.data)) return demoAdapters.weather(coords, from, to);
    return getWeatherContext(coords, from, to, ctx);
  });

  app.get('/api/warnings', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (isDemo(parsed.data)) return demoAdapters.warnings(coords);
    return getWarningContext(coords, ctx);
  });

  app.get('/api/air/stations', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (isDemo(parsed.data)) return demoAdapters.airStations(coords);
    return getAirStationContext(coords, ctx);
  });

  app.get('/api/pois', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (isDemo(parsed.data)) return demoAdapters.pois(coords);
    return getPoiContext(coords, ctx);
  });

  app.get('/api/transit', async (req, reply) => {
    const Query = CoordsQuery.extend({ stopCount: z.coerce.number().int().min(0).optional() });
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    const stopCount = parsed.data.stopCount ?? null;
    if (isDemo(parsed.data)) return demoAdapters.transit(coords, stopCount);
    return getTransitAvailability(coords, stopCount);
  });

  return app;
}
