/**
 * Transit context & data availability (§3.1.F).
 *
 * V1 truthfully reports AVAILABILITY, not operation:
 *  - stop context comes from the OSM mapped layer (mapped context);
 *  - scheduled timetables (DELFI GTFS) are NOT yet integrated → "unknown";
 *  - realtime (DELFI DEEZ / gtfs.de GTFS-RT) is NOT yet integrated; nationwide
 *    coverage is documented as PARTIAL → reported as "unknown" for the app
 *    (no feed) with the documented partial national coverage as detail.
 * Missing data is NEVER presented as normal operation.
 */
import {
  type ModuleEnvelope,
  type TransitAvailability,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence } from '@invisible-city/evidence';
import { getProvider } from '../manifest.js';

export function getTransitAvailability(
  _coords: Coordinates,
  nearbyStopCount: number | null,
): ModuleEnvelope<TransitAvailability> {
  const gtfs = getProvider('delfi-gtfs');
  const rt = getProvider('delfi-gtfs-rt');
  const retrievedAt = new Date().toISOString();

  const data: TransitAvailability = {
    stopContext: {
      coverage:
        nearbyStopCount === null ? 'unknown' : nearbyStopCount > 0 ? 'confirmed' : 'not-covered',
      detail:
        nearbyStopCount === null
          ? 'Halte-Kontext derzeit nicht abrufbar (Kartierungsquelle nicht erreichbar).'
          : nearbyStopCount > 0
            ? `${nearbyStopCount} kartierte Halte im Umkreis (OSM, kartierter Kontext).`
            : 'Keine kartierten Halte im Umkreis gefunden (Vollständigkeit der Kartierung unbekannt).',
    },
    scheduled: {
      coverage: 'unknown',
      detail:
        'Soll-Fahrplan (DELFI GTFS) ist in dieser Version nicht integriert — keine Aussage über Fahrplanangebot möglich.',
    },
    realtime: {
      coverage: 'unknown',
      detail:
        'Echtzeitdaten sind in dieser Version nicht integriert. Deutschlandweit ist die GTFS-Realtime-Abdeckung ohnehin nur PARTIELL (teilnehmende Betreiber). Fehlende Meldungen bedeuten NICHT Normalbetrieb.',
    },
  };

  const evidence = [
    makeEvidence(gtfs, {
      mode: 'unavailable',
      method:
        'Verfügbarkeitsaussage aus dem Provider-Manifest: DELFI-GTFS-Integration ist vorgeschlagen, aber nicht verifiziert/aktiviert.',
      spatial: { kind: 'coverage', description: gtfs.coverage },
      completeness: 'unknown',
      retrievedAt,
    }),
    makeEvidence(rt, {
      mode: 'unavailable',
      method:
        'Verfügbarkeitsaussage aus dem Provider-Manifest: GTFS-RT-Integration ist vorgeschlagen, aber nicht verifiziert/aktiviert; dokumentierte nationale Abdeckung: partiell.',
      spatial: { kind: 'coverage', description: rt.coverage },
      completeness: 'unknown',
      retrievedAt,
    }),
  ];

  return {
    status: 'partial',
    demo: false,
    data,
    evidence,
    limitations: [
      'Kein Routing, keine Abfahrtstafeln, keine Zuverlässigkeits- oder Pünktlichkeitsaussagen in V1.',
      'Aus fehlenden Störungsmeldungen darf kein Normalbetrieb abgeleitet werden.',
    ],
    statusDetail:
      'V1 zeigt Verfügbarkeit von ÖPNV-Daten, nicht den Betrieb. Fahrplan- und Echtzeitquellen sind noch nicht aktiviert.',
    retrievedAt,
  };
}
