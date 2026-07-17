/**
 * Reported industrial releases (Thru.de / PRTR) — the one credible, place-based
 * greenhouse-gas & pollutant angle: statutory ANNUAL declarations by facilities
 * above thresholds, with coordinates.
 *
 * Reality rules:
 *  - data mode is 'reported' — a declaration for a reporting year, never a
 *    measurement, concentration or current condition;
 *  - absence of facilities never implies absence of emissions (thresholds!);
 *  - gated on a Thru.de export: PRTR_CSV_PATH (local file) or PRTR_CSV_URL
 *    (downloaded + imported automatically, refreshed monthly); without either
 *    the module reports configuration-required — never demo, never invented.
 *    Thru.de exposes no documented per-place query API, and the reality policy
 *    forbids scraping its interactive export UI — hence a configured export.
 */
import {
  type ModuleEnvelope,
  type EmitterContext,
  type EmitterFacility,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters, formatDistanceGerman } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { policedFetch } from '../http.js';
import { errorEnvelope, type AdapterContext } from '../runner.js';
import {
  importPrtr,
  prtrImportNeeded,
  prtrUrlImportNeeded,
  queryFacilities,
  PrtrImportError,
} from '../prtr/import.js';

const SEARCH_RADIUS_M = 10_000;
const MAX_FACILITIES = 5;

/** Ensure the local SQLite import is current (local file or configured URL). */
async function ensureImport(ctx: AdapterContext): Promise<void> {
  const { prtrCsvPath, prtrCsvUrl, prtrDbPath } = ctx.config;
  if (prtrCsvPath) {
    if (prtrImportNeeded(prtrCsvPath, prtrDbPath)) importPrtr(prtrCsvPath, prtrDbPath);
    return;
  }
  if (prtrCsvUrl && prtrUrlImportNeeded(prtrDbPath, prtrCsvUrl)) {
    const res = await policedFetch(prtrCsvUrl, {
      timeoutMs: 120_000,
      ...(ctx.fetchImpl ? { fetchImpl: ctx.fetchImpl } : {}),
    });
    const text = await res.text();
    importPrtr(Buffer.from(text, 'utf8'), prtrDbPath, prtrCsvUrl);
  }
}

export async function getEmitterContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<EmitterContext>> {
  const provider = getEffectiveProvider('thru-prtr', ctx.config);
  if (provider.status !== 'verified' || !(ctx.config.prtrCsvPath || ctx.config.prtrCsvUrl)) {
    return {
      status: 'configuration-required',
      demo: false,
      data: null,
      evidence: [],
      limitations: provider.knownLimitations,
      statusDetail:
        'Gemeldete Freisetzungen (Thru.de/PRTR) sind nicht konfiguriert. Für den Betrieb wird ein Thru.de-CSV-Export benötigt: lokale Datei (PRTR_CSV_PATH) oder Download-URL (PRTR_CSV_URL).',
      retrievedAt: new Date().toISOString(),
    };
  }

  try {
    await ensureImport(ctx);

    // Bounding box ~radius (degrees); exact distance filtering below.
    const dLat = SEARCH_RADIUS_M / 111_000;
    const dLon = SEARCH_RADIUS_M / (111_000 * Math.cos((coords.latitude * Math.PI) / 180));
    const rows = queryFacilities(ctx.config.prtrDbPath, {
      latMin: coords.latitude - dLat,
      latMax: coords.latitude + dLat,
      lonMin: coords.longitude - dLon,
      lonMax: coords.longitude + dLon,
    });

    const yearSet = new Set<number>();
    const facilities: EmitterFacility[] = rows
      .map((f) => {
        const facilityCoords = { latitude: f.lat, longitude: f.lon };
        const distance = Math.round(distanceMeters(coords, facilityCoords));
        // Latest reporting year per facility; loads of that year only.
        const latestYear = f.releases.reduce((max, r) => Math.max(max, r.year), 0);
        const releases = f.releases
          .filter((r) => r.year === latestYear)
          .map((r) => {
            yearSet.add(r.year);
            return {
              pollutant: r.pollutant,
              amountKg: r.amount_kg,
              medium: r.medium,
              year: r.year,
              mode: 'reported' as const,
            };
          });
        return {
          facilityId: f.facility_id,
          name: f.name,
          activity: f.activity,
          coordinates: facilityCoords,
          distanceMeters: distance,
          releases,
        };
      })
      .filter((f) => f.distanceMeters <= SEARCH_RADIUS_M)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, MAX_FACILITIES);

    const retrievedAt = new Date().toISOString();
    const nearest = facilities[0];
    const evidence = makeEvidence(provider, {
      mode: 'reported',
      method:
        'Jahresmeldungen berichtspflichtiger Betriebe (Thru.de/PRTR-Datenexport), Umkreisabfrage über gemeldete Betriebskoordinaten. Gemeldete Jahresfrachten — keine Messung, keine Konzentration am gewählten Ort.',
      spatial: {
        kind: 'coverage',
        description: `Berichtspflichtige Betriebe im Umkreis von ${formatDistanceGerman(SEARCH_RADIUS_M)}${nearest ? `; nächster Betrieb ${formatDistanceGerman(nearest.distanceMeters)} entfernt` : ''}`,
      },
      completeness: 'partial',
      retrievedAt,
    });

    return {
      status: 'ok',
      demo: false,
      data: {
        facilities,
        searchRadiusMeters: SEARCH_RADIUS_M,
        reportingYears: [...yearSet].sort((a, b) => a - b),
      },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      ...(facilities.length === 0
        ? {
            statusDetail:
              'Kein berichtspflichtiger Betrieb im Umkreis. Das bedeutet NICHT, dass es keine Emissionen gibt — nur Betriebe oberhalb der PRTR-Schwellenwerte melden.',
          }
        : {}),
      retrievedAt,
    };
  } catch (err) {
    if (err instanceof PrtrImportError) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail: `Der PRTR-Datensatz konnte nicht importiert werden: ${err.message} Es werden keine Ersatzwerte erzeugt.`,
        retrievedAt: new Date().toISOString(),
      };
    }
    return errorEnvelope<EmitterContext>(err, provider.knownLimitations);
  }
}
