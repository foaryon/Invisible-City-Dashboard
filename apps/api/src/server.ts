/**
 * The Invisible City — API (Fastify).
 *
 * Provider orchestration only: no provider parsing logic lives in the UI.
 * Live is the default. Demo is an opt-in DEV feature (ENABLE_DEMO) and is
 * rejected in production; when enabled it is decided PER REQUEST via ?demo=1
 * and stamped end-to-end (status "demo", demo=true) — never mixed with live.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import { z } from 'zod';
import { CoordinatesSchema, type Coordinates, type PoiContext } from '@invisible-city/contracts';
import {
  providerManifest,
  MANIFEST_VERSION,
  createSqliteCache,
  createMemoryCache,
  loadConfig,
  isConfigured,
  REQUIRED_ENV,
  getEffectiveProvider,
  type ResponseCache,
  type ProviderConfig,
  type AdapterContext,
  getWeatherContext,
  getWarningContext,
  getAirStationContext,
  getAirModelContext,
  getPoiContext,
  searchPlaces,
  reverseGeocode,
  getTransitContext,
  getWaterLevelContext,
  getRadiationContext,
  getPollenContext,
  getUvContext,
  getRadarContext,
  demoAdapters,
} from '@invisible-city/providers';

export interface ServerOptions {
  cache?: ResponseCache;
  cachePath?: string;
  config?: ProviderConfig;
  logger?: boolean;
  /** When set to a built web directory, the API also serves the SPA (single deployable). */
  webRoot?: string;
}

const CoordsQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  demo: z.coerce.string().optional(),
});

function parseCoords(q: { lat: number; lon: number }): Coordinates {
  return CoordinatesSchema.parse({ latitude: q.lat, longitude: q.lon });
}

export async function buildServer(opts: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });
  await app.register(cors, { origin: true });
  // Brotli/gzip for API JSON and the SPA — the MapLibre chunk shrinks ~4x,
  // which is the biggest felt win for phone-over-Wi-Fi loads.
  await app.register(compress, { global: true, encodings: ['br', 'gzip'] });

  const config = opts.config ?? loadConfig();
  const cache =
    opts.cache ?? (opts.cachePath ? createSqliteCache(opts.cachePath) : createMemoryCache());
  const ctx: AdapterContext = { cache, config };

  /** Demo only when explicitly enabled AND requested — never in production. */
  const wantsDemo = (q: { demo?: string | undefined }) =>
    config.enableDemo && (q.demo === '1' || q.demo === 'true');

  app.addHook('onClose', async () => cache.close());

  app.get('/api/health', async () => ({
    status: 'ok',
    manifestVersion: MANIFEST_VERSION,
    demoEnabled: config.enableDemo,
    time: new Date().toISOString(),
  }));

  // Readiness: per-provider effective status + which env vars are still needed.
  app.get('/api/readiness', async () => ({
    manifestVersion: MANIFEST_VERSION,
    demoEnabled: config.enableDemo,
    providers: providerManifest.map((p) => {
      const effective = getEffectiveProvider(p.providerId, config);
      return {
        providerId: p.providerId,
        displayName: p.displayName,
        status: effective.status,
        live: effective.status === 'verified',
        configured: isConfigured(p.providerId, config),
        requiresEnv: REQUIRED_ENV[p.providerId] ?? [],
      };
    }),
  }));

  app.get('/api/providers', async () => ({
    manifestVersion: MANIFEST_VERSION,
    providers: providerManifest.map((p) => getEffectiveProvider(p.providerId, config)),
  }));

  app.get('/api/search', async (req, reply) => {
    const Query = z.object({ q: z.string().min(2), demo: z.string().optional() });
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Suchanfrage.' });
    if (wantsDemo(parsed.data)) return demoAdapters.search(parsed.data.q);
    return searchPlaces(parsed.data.q, ctx);
  });

  app.get('/api/reverse', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.reverse(coords);
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
    if (wantsDemo(parsed.data)) return demoAdapters.weather(coords, from, to);
    return getWeatherContext(coords, from, to, ctx);
  });

  app.get('/api/warnings', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.warnings(coords);
    return getWarningContext(coords, ctx);
  });

  app.get('/api/air/stations', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.airStations(coords);
    return getAirStationContext(coords, ctx);
  });

  app.get('/api/air/model', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.airModel(coords);
    // Live: honest configuration-required when no CAMS key is present.
    return getAirModelContext(coords, ctx);
  });

  app.get('/api/pois', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.pois(coords);
    return getPoiContext(coords, ctx);
  });

  app.get('/api/transit', async (req, reply) => {
    const Query = CoordsQuery.extend({ at: z.string().datetime({ offset: true }).optional() });
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    const selectedIso = parsed.data.at ?? new Date().toISOString();

    // Stop context falls back to the mapped OSM stops from the POI layer.
    const poiEnvelope = wantsDemo(parsed.data)
      ? await demoAdapters.pois(coords)
      : await getPoiContext(coords, ctx);
    const mappedStops = ((poiEnvelope.data as PoiContext | null)?.pois ?? [])
      .filter((p) => p.category === 'transit-stop')
      .map((p) => ({ name: p.name, coordinates: p.coordinates, distanceMeters: p.distanceMeters }));

    if (wantsDemo(parsed.data)) return demoAdapters.transit(coords, mappedStops, selectedIso);
    return getTransitContext(coords, mappedStops, selectedIso, ctx);
  });

  app.get('/api/water', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.water(coords);
    return getWaterLevelContext(coords, ctx);
  });

  app.get('/api/radiation', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.radiation(coords);
    return getRadiationContext(coords, ctx);
  });

  app.get('/api/pollen', async (req, reply) => {
    const Query = CoordsQuery.extend({ state: z.string().optional() });
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Anfrage.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.pollen(parsed.data.state ?? null);
    // Region assignment needs the Bundesland; derive via reverse geocoding when
    // the client didn't provide it. Failure stays honest inside the adapter.
    let state = parsed.data.state ?? null;
    if (!state) {
      try {
        const rev = await reverseGeocode(coords, ctx);
        state = rev.data?.[0]?.place.state ?? null;
      } catch {
        state = null;
      }
    }
    return getPollenContext(state, ctx);
  });

  app.get('/api/uv', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.uv(coords);
    return getUvContext(coords, ctx);
  });

  app.get('/api/radar', async (req, reply) => {
    const parsed = CoordsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Koordinaten.' });
    const coords = parseCoords(parsed.data);
    if (wantsDemo(parsed.data)) return demoAdapters.radar(coords);
    return getRadarContext(coords, ctx);
  });

  // Production single-deployable: serve the built SPA and fall back to
  // index.html for client-side routes (API routes keep precedence).
  if (opts.webRoot && existsSync(join(opts.webRoot, 'index.html'))) {
    await app.register(fastifyStatic, {
      root: opts.webRoot,
      // Vite content-hashes everything under /assets → cache forever.
      // The shell (index.html, sw.js, manifest) must revalidate so updates land.
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${'/'}assets${'/'}`)) {
          res.header('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (/icon-\d+\.png$/.test(filePath)) {
          res.header('Cache-Control', 'public, max-age=86400');
        } else {
          res.header('Cache-Control', 'no-cache');
        }
      },
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.method === 'GET' && !req.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not found' });
    });
  }

  return app;
}
