/**
 * Autobahn events (Autobahn GmbH, bund.dev-documented API).
 *
 * The API is organised per motorway; there is no bbox query. We therefore
 * aggregate warnings/closures/roadworks across ALL motorways into one
 * nationally shared cached snapshot (bounded concurrency, per-kind TTL) and
 * filter locally by distance. Coverage is the federal motorway network ONLY —
 * absence of events is never a statement about other roads or free flow.
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type AutobahnContext,
  type AutobahnEvent,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchJsonWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const SEARCH_RADIUS_M = 30_000;
const MAX_EVENTS = 8;
const CONCURRENCY = 6;
/** Roadworks are long-lived — cache them longer than warnings/closures. */
const ROADWORKS_TTL = 3600;
const ROADS_TTL = 86_400;

const RoadsResponse = z.object({ roads: z.array(z.string()) });

const Item = z.object({
  identifier: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  coordinate: z.object({ lat: z.string(), long: z.string() }).optional(),
  startTimestamp: z.string().optional(),
});

const KindResponse = z.record(z.array(Item));

type Kind = 'warning' | 'closure' | 'roadworks';
const KINDS: Kind[] = ['warning', 'closure', 'roadworks'];

interface RawEvent {
  kind: Kind;
  roadId: string;
  item: z.infer<typeof Item>;
}

async function fetchKindForRoad(
  road: string,
  kind: Kind,
  ctx: AdapterContext,
): Promise<{ events: RawEvent[]; stale: boolean }> {
  const provider = getEffectiveProvider('autobahn-gmbh', ctx.config);
  const url = `${ctx.config.autobahnUrl}/${encodeURIComponent(road)}/services/${kind}`;
  const fingerprint = requestFingerprint({ resource: 'autobahn', road, kind });
  try {
    const result = await fetchJsonWithCache(
      provider,
      fingerprint,
      url,
      ctx,
      undefined,
      kind === 'roadworks' ? ROADWORKS_TTL : undefined,
    );
    const parsed = KindResponse.safeParse(result.raw);
    if (!parsed.success) return { events: [], stale: result.stale };
    const list = Object.values(parsed.data)[0] ?? [];
    return {
      events: list.map((item) => ({ kind, roadId: road, item })),
      stale: result.stale,
    };
  } catch {
    // Single-road failure → that road's events are absent (partial), never invented.
    return { events: [], stale: false };
  }
}

export async function getAutobahnContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<AutobahnContext>> {
  const provider = getEffectiveProvider('autobahn-gmbh', ctx.config);
  try {
    const roadsResult = await fetchJsonWithCache(
      provider,
      requestFingerprint({ resource: 'autobahn-roads' }),
      ctx.config.autobahnUrl,
      ctx,
      undefined,
      ROADS_TTL,
    );
    const roadsParsed = RoadsResponse.safeParse(roadsResult.raw);
    if (!roadsParsed.success) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'Die Autobahnliste der Quelle entsprach nicht dem dokumentierten Schema und wurde verworfen.',
        retrievedAt: roadsResult.retrievedAt,
      };
    }

    // Aggregate all road×kind combinations with bounded concurrency; the
    // underlying cache is shared nationally, so cold cost is paid rarely.
    const jobs: Array<{ road: string; kind: Kind }> = roadsParsed.data.roads.flatMap((road) =>
      KINDS.map((kind) => ({ road, kind })),
    );
    const raw: RawEvent[] = [];
    let anyStale = roadsResult.stale;
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const results = await Promise.all(
        jobs.slice(i, i + CONCURRENCY).map((j) => fetchKindForRoad(j.road, j.kind, ctx)),
      );
      for (const r of results) {
        raw.push(...r.events);
        anyStale = anyStale || r.stale;
      }
    }

    const events: AutobahnEvent[] = raw
      .map((e) => {
        const lat = e.item.coordinate ? Number(e.item.coordinate.lat) : NaN;
        const lon = e.item.coordinate ? Number(e.item.coordinate.long) : NaN;
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
        const eventCoords = hasCoords ? { latitude: lat, longitude: lon } : null;
        return {
          id: `${e.kind}:${e.item.identifier}`,
          kind: e.kind,
          roadId: e.roadId,
          title: e.item.title ?? null,
          subtitle: e.item.subtitle ?? null,
          coordinates: eventCoords,
          distanceMeters: eventCoords ? Math.round(distanceMeters(coords, eventCoords)) : null,
          startAt: e.item.startTimestamp ?? null,
          mode: 'observed' as const,
        };
      })
      .filter((e) => e.distanceMeters !== null && e.distanceMeters <= SEARCH_RADIUS_M)
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
      .slice(0, MAX_EVENTS);

    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method:
        'Verkehrsmeldungen, Sperrungen und Baustellen der Autobahn GmbH (je Autobahn abgefragt, landesweit gecacht), lokal nach Entfernung gefiltert. NUR Bundesautobahnen.',
      spatial: { kind: 'geometry', geometryType: 'point' },
      completeness: 'partial',
      retrievedAt: roadsResult.retrievedAt,
      ...(roadsResult.cacheAgeSeconds > 0 ? { cacheAgeSeconds: roadsResult.cacheAgeSeconds } : {}),
    });

    return {
      status: anyStale ? 'stale' : 'ok',
      demo: false,
      data: { events, searchRadiusMeters: SEARCH_RADIUS_M },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(events.length === 0
        ? {
            statusDetail:
              'Keine Autobahn-Meldung im Umkreis von 30 km. Das ist eine Aussage über Bundesautobahnen — nicht über andere Straßen.',
          }
        : {}),
      retrievedAt: roadsResult.retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<AutobahnContext>(err, provider.knownLimitations);
  }
}
