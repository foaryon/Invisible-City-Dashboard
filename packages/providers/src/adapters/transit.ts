/**
 * Transit context & data availability (§3.1.F) — real integration.
 *
 * Layers, kept strictly separate:
 *  1. Stop context — from the mapped OSM layer and/or the configured GTFS feed.
 *  2. Scheduled departures — ONLY from a configured, validated DELFI GTFS feed
 *     (imported to SQLite); always labelled "scheduled", never "realtime".
 *  3. Realtime & alerts — ONLY when a GTFS-RT feed is configured (coverage is
 *     documented as PARTIAL); the ABSENCE of updates is never "normal service".
 *
 * When a source is not configured, its layer honestly reports
 * "nicht konfiguriert" — no demo, no invented departures.
 */
import { existsSync } from 'node:fs';
import {
  type ModuleEnvelope,
  type TransitAvailability,
  type TransitStop,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, berlinDateParts, formatDistanceGerman } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { type AdapterContext } from '../runner.js';
import { GtfsStore } from '../gtfs/query.js';
import { fetchRealtimeFeed, summarizeRealtime } from '../gtfs/realtime.js';

/** A nearby mapped stop supplied by the OSM POI layer. */
export interface MappedStop {
  name: string | null;
  coordinates: Coordinates;
  distanceMeters: number;
}

export async function getTransitContext(
  coords: Coordinates,
  mappedStops: MappedStop[],
  selectedIso: string,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<TransitAvailability>> {
  const gtfs = getEffectiveProvider('delfi-gtfs', ctx.config);
  const rt = getEffectiveProvider('delfi-gtfs-rt', ctx.config);
  const retrievedAt = new Date().toISOString();
  const evidence = [];
  const limitations = [
    'Kein Routing, keine Abfahrtstafeln als Betriebsgarantie, keine Zuverlässigkeits- oder Pünktlichkeitsaussagen.',
    'Aus fehlenden Störungsmeldungen darf kein Normalbetrieb abgeleitet werden.',
  ];

  const stops: TransitStop[] = [];
  const stopIds = new Set<string>();

  // ---- Scheduled layer (GTFS static) --------------------------------------
  const gtfsActive = gtfs.status === 'verified' && existsSync(ctx.config.gtfsDbPath);
  let scheduledCoverage: TransitAvailability['scheduled'];
  if (gtfsActive) {
    let store: GtfsStore | null = null;
    try {
      store = new GtfsStore(ctx.config.gtfsDbPath);
      const meta = store.meta();
      const { yyyymmdd, secondsOfDay } = berlinDateParts(selectedIso);
      const gtfsStops = store.nearestStops(coords, 800, 6);
      for (const s of gtfsStops) {
        const deps = store.scheduledDepartures(s.stopId, yyyymmdd, secondsOfDay, 4);
        stops.push({
          stopId: s.stopId,
          name: s.name,
          coordinates: s.coordinates,
          distanceMeters: s.distanceMeters,
          source: 'scheduled',
          scheduledDepartures: deps,
        });
        stopIds.add(s.stopId);
      }
      scheduledCoverage = {
        coverage: gtfsStops.length > 0 ? 'confirmed' : 'not-covered',
        detail:
          gtfsStops.length > 0
            ? `Soll-Fahrplan aus DELFI-GTFS (Feed ${meta.feedVersion ?? 'o. Version'}, Stand ${meta.importedAt?.slice(0, 10) ?? 'unbekannt'}).`
            : 'Keine Halte des konfigurierten GTFS-Feeds im Umkreis.',
      };
      evidence.push(
        makeEvidence(gtfs, {
          mode: 'scheduled',
          method:
            'Geplante Abfahrten aus dem konfigurierten DELFI-GTFS-Feed (nach Servicekalender des gewählten Datums). Ein geplanter Halt ist keine Echtzeit-Abfahrt.',
          spatial: { kind: 'coverage', description: gtfs.coverage },
          completeness: 'complete',
          retrievedAt,
          ...(meta.feedStartDate ? { validAt: meta.feedStartDate } : {}),
          ...(meta.importedAt ? { publishedAt: meta.importedAt } : {}),
        }),
      );
    } catch (err) {
      scheduledCoverage = {
        coverage: 'temporarily-unavailable',
        detail: `GTFS-Feed konfiguriert, aber nicht lesbar: ${err instanceof Error ? err.message : String(err)}.`,
      };
    } finally {
      store?.close();
    }
  } else {
    scheduledCoverage = {
      coverage: 'unknown',
      detail:
        'Soll-Fahrplan (DELFI GTFS) ist nicht konfiguriert (GTFS_STATIC_PATH/URL). Keine Fahrplanaussage möglich.',
    };
  }

  // ---- Stop context (fallback to mapped OSM stops) ------------------------
  if (stops.length === 0 && mappedStops.length > 0) {
    for (const s of mappedStops) {
      stops.push({
        stopId: `osm:${s.coordinates.latitude.toFixed(5)},${s.coordinates.longitude.toFixed(5)}`,
        name: s.name ?? 'Halt (kartiert)',
        coordinates: s.coordinates,
        distanceMeters: s.distanceMeters,
        source: 'mapped',
        scheduledDepartures: [],
      });
    }
  }
  const stopContext: TransitAvailability['stopContext'] = {
    coverage: stops.length > 0 ? 'confirmed' : mappedStops.length === 0 ? 'unknown' : 'not-covered',
    detail:
      stops.length > 0
        ? `${stops.length} Halte im Umkreis${stops[0] ? ` (nächster: ${formatDistanceGerman(stops[0].distanceMeters)})` : ''}.`
        : 'Keine Halte im Umkreis gefunden (Vollständigkeit der Kartierung unbekannt).',
  };

  // ---- Realtime layer (GTFS-RT) -------------------------------------------
  let realtimeCoverage: TransitAvailability['realtime'];
  const realtimeUpdates: TransitAvailability['realtimeUpdates'] = [];
  const realtimeAlerts: TransitAvailability['realtimeAlerts'] = [];
  let feedTimestamp: string | null = null;
  if (rt.status === 'verified' && ctx.config.gtfsRtUrl) {
    try {
      const feed = await fetchRealtimeFeed(
        ctx.config.gtfsRtUrl,
        ctx.config.gtfsRtApiKey,
        ctx.fetchImpl,
      );
      const summary = summarizeRealtime(feed, stopIds);
      feedTimestamp = summary.feedTimestamp;
      realtimeUpdates.push(...summary.updatesForStops);
      realtimeAlerts.push(...summary.alertsForStops);
      realtimeCoverage = {
        coverage: 'partial',
        detail: `GTFS-RT verbunden (Feed-Stand ${summary.feedTimestamp ?? 'unbekannt'}); Abdeckung ist deutschlandweit PARTIELL. Fehlende Meldungen bedeuten NICHT Normalbetrieb.`,
      };
      evidence.push(
        makeEvidence(rt, {
          mode: 'realtime',
          method:
            'GTFS-Realtime-Feed dekodiert; Trip-Updates/Alerts mit Bezug auf die nächstgelegenen Halte. Abdeckung partiell.',
          spatial: { kind: 'coverage', description: rt.coverage },
          completeness: 'partial',
          retrievedAt,
          ...(summary.feedTimestamp ? { validAt: summary.feedTimestamp } : {}),
        }),
      );
    } catch (err) {
      realtimeCoverage = {
        coverage: 'temporarily-unavailable',
        detail: `GTFS-RT konfiguriert, aber aktuell nicht abrufbar: ${err instanceof Error ? err.message : String(err)}. Kein Rückschluss auf Normalbetrieb.`,
      };
    }
  } else {
    realtimeCoverage = {
      coverage: 'unknown',
      detail:
        'Echtzeit (GTFS-RT) ist nicht konfiguriert (GTFS_RT_URL). Deutschlandweit ist die Abdeckung ohnehin nur PARTIELL. Fehlende Meldungen bedeuten NICHT Normalbetrieb.',
    };
  }

  if (evidence.length === 0) {
    evidence.push(
      makeEvidence(gtfs, {
        mode: 'unavailable',
        method:
          'Verfügbarkeitsaussage: DELFI-GTFS/GTFS-RT sind nicht konfiguriert. Halte-Kontext ggf. aus der kartierten OSM-Ebene.',
        spatial: { kind: 'coverage', description: gtfs.coverage },
        completeness: 'unknown',
        retrievedAt,
      }),
    );
  }

  const anyLive = gtfsActive || (rt.status === 'verified' && !!ctx.config.gtfsRtUrl);
  return {
    status: anyLive ? 'ok' : 'partial',
    demo: false,
    data: {
      stopContext,
      scheduled: scheduledCoverage,
      realtime: realtimeCoverage,
      stops,
      realtimeUpdates,
      realtimeAlerts,
      feedTimestamp,
    },
    evidence,
    limitations,
    ...(anyLive
      ? {}
      : {
          statusDetail:
            'ÖPNV-Verfügbarkeit: Halte-Kontext aus der Karte; Fahrplan-/Echtzeitquellen sind nicht konfiguriert.',
        }),
    retrievedAt,
  };
}
