/**
 * GTFS-Realtime decoding (§3.1.F, Stage 6).
 *
 * Decodes a GTFS-RT protobuf FeedMessage (DELFI DEEZ via Mobilithek, or the
 * gtfs.de stream) and summarizes trip updates / service alerts that touch a set
 * of nearby stops. Coverage is documented as PARTIAL; the ABSENCE of updates is
 * never presented as "no disruption / normal service".
 */
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { policedFetch, type FetchLike } from '../http.js';

export interface RealtimeStopUpdate {
  stopId: string;
  routeId: string | null;
  delaySeconds: number | null;
}

export interface RealtimeAlert {
  headerText: string | null;
  descriptionText: string | null;
}

export interface RealtimeSummary {
  feedTimestamp: string | null;
  entityCount: number;
  updatesForStops: RealtimeStopUpdate[];
  alertsForStops: RealtimeAlert[];
}

function translated(
  ts: GtfsRealtimeBindings.transit_realtime.ITranslatedString | null | undefined,
): string | null {
  const text = ts?.translation?.[0]?.text;
  return typeof text === 'string' && text.length > 0 ? text : null;
}

export function summarizeRealtime(
  feed: GtfsRealtimeBindings.transit_realtime.IFeedMessage,
  stopIds: Set<string>,
): RealtimeSummary {
  const updatesForStops: RealtimeStopUpdate[] = [];
  const alertsForStops: RealtimeAlert[] = [];

  for (const entity of feed.entity ?? []) {
    const tu = entity.tripUpdate;
    if (tu) {
      const routeId = tu.trip?.routeId ?? null;
      for (const stu of tu.stopTimeUpdate ?? []) {
        if (stu.stopId && stopIds.has(stu.stopId)) {
          const delay = stu.departure?.delay ?? stu.arrival?.delay ?? null;
          updatesForStops.push({
            stopId: stu.stopId,
            routeId,
            delaySeconds: typeof delay === 'number' ? delay : null,
          });
        }
      }
    }
    const alert = entity.alert;
    if (alert) {
      const touches = (alert.informedEntity ?? []).some(
        (ie) => ie.stopId && stopIds.has(ie.stopId),
      );
      if (touches) {
        alertsForStops.push({
          headerText: translated(alert.headerText),
          descriptionText: translated(alert.descriptionText),
        });
      }
    }
  }

  const header = feed.header;
  const ts = header && header.timestamp != null ? Number(header.timestamp.toString()) : null;
  return {
    feedTimestamp: ts ? new Date(ts * 1000).toISOString() : null,
    entityCount: (feed.entity ?? []).length,
    updatesForStops,
    alertsForStops,
  };
}

export async function fetchRealtimeFeed(
  url: string,
  apiKey: string | undefined,
  fetchImpl?: FetchLike,
): Promise<GtfsRealtimeBindings.transit_realtime.IFeedMessage> {
  const res = await policedFetch(url, {
    timeoutMs: 12000,
    ...(fetchImpl ? { fetchImpl } : {}),
    init: apiKey ? { headers: { Authorization: apiKey } } : {},
  });
  const buffer = new Uint8Array(await res.arrayBuffer());
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
}
