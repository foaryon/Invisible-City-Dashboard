/**
 * DWD climate normals 1991–2020 (CDC multi-annual station means).
 *
 * Documented semicolon tables on opendata.dwd.de: one station list and one
 * value table per parameter. We resolve the nearest climate station and report
 * the CURRENT month's normal (plus the annual value) for temperature and
 * precipitation — a statistical reference, deliberately kept separate from the
 * live weather module (different stations; combine, never fuse).
 */
import { z } from 'zod';
import {
  type ModuleEnvelope,
  type ClimateNormalsContext,
  type ClimateNormalValue,
  type Coordinates,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters, formatDistanceGerman } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { requestFingerprint } from '../cache.js';
import { fetchTextWithCache, errorEnvelope, type AdapterContext } from '../runner.js';

const StationRow = z.object({
  stationId: z.string().min(1),
  name: z.string().nullable(),
  latitude: z.number().min(47).max(55.2),
  longitude: z.number().min(5.5).max(15.2),
});

export interface CdcTableRow {
  stationId: string;
  columns: Record<string, string>;
}

/** Parse a CDC semicolon table into header-keyed rows; malformed → null. */
export function parseCdcTable(text: string): CdcTableRow[] | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return null;
  const header = lines[0]!.split(';').map((h) => h.trim());
  if (header.length < 2) return null;
  const idIdx = header.findIndex((h) => /stations?_?id/i.test(h));
  if (idIdx === -1) return null;
  const rows: CdcTableRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(';').map((c) => c.trim());
    const stationId = cols[idIdx];
    if (!stationId) continue;
    const columns: Record<string, string> = {};
    header.forEach((h, i) => {
      columns[h] = cols[i] ?? '';
    });
    rows.push({ stationId: stationId.replace(/^0+(?=\d)/, ''), columns });
  }
  return rows.length > 0 ? rows : null;
}

function findColumn(columns: Record<string, string>, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const key = Object.keys(columns).find((k) => pattern.test(k));
    if (key !== undefined) return columns[key];
  }
  return undefined;
}

const MONTH_PATTERNS: RegExp[][] = [
  [/^jan/i],
  [/^feb/i],
  [/^m(ä|a)r/i],
  [/^apr/i],
  [/^mai/i, /^may/i],
  [/^jun/i],
  [/^jul/i],
  [/^aug/i],
  [/^sep/i],
  [/^okt/i, /^oct/i],
  [/^nov/i],
  [/^dez/i, /^dec/i],
];

function toNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw.length === 0) return null;
  const n = Number(raw.replace(',', '.'));
  // CDC uses -999 as missing-value marker; missing stays missing.
  if (!Number.isFinite(n) || n <= -990) return null;
  return n;
}

interface ParameterFile {
  parameter: 'temperature' | 'precipitation';
  stationsFile: string;
  valuesFile: string;
  unit: string;
}

const FILES: ParameterFile[] = [
  {
    parameter: 'temperature',
    stationsFile: 'Temperatur_1991-2020_Stationsliste_aktStandort.txt',
    valuesFile: 'Temperatur_1991-2020_aktStandort.txt',
    unit: '°C',
  },
  {
    parameter: 'precipitation',
    stationsFile: 'Niederschlag_1991-2020_Stationsliste_aktStandort.txt',
    valuesFile: 'Niederschlag_1991-2020_aktStandort.txt',
    unit: 'mm',
  },
];

function parseStations(text: string): Array<z.infer<typeof StationRow>> | null {
  const rows = parseCdcTable(text);
  if (!rows) return null;
  const out: Array<z.infer<typeof StationRow>> = [];
  for (const row of rows) {
    const lat = toNumber(findColumn(row.columns, [/breite/i, /latitude/i]));
    const lon = toNumber(findColumn(row.columns, [/l(ä|ae|a)nge/i, /longitude/i]));
    if (lat === null || lon === null) continue;
    const parsed = StationRow.safeParse({
      stationId: row.stationId,
      name: findColumn(row.columns, [/name/i]) ?? null,
      latitude: lat,
      longitude: lon,
    });
    if (parsed.success) out.push(parsed.data);
  }
  return out.length > 0 ? out : null;
}

function berlinMonth(): number {
  return Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', month: 'numeric' }).format(
      new Date(),
    ),
  );
}

export async function getClimateNormalsContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<ClimateNormalsContext>> {
  const provider = getEffectiveProvider('dwd-cdc-normals', ctx.config);
  try {
    const month = berlinMonth();
    const values: ClimateNormalValue[] = [];
    let nearest: {
      stationId: string;
      name: string | null;
      coordinates: Coordinates;
      distance: number;
    } | null = null;
    let retrievedAt = new Date().toISOString();
    let anyStale = false;
    let cacheAge = 0;

    for (const file of FILES) {
      const stationsResult = await fetchTextWithCache(
        provider,
        requestFingerprint({ resource: 'cdc-stations', p: file.parameter }),
        `${ctx.config.dwdCdcNormalsUrl}/${file.stationsFile}`,
        ctx,
        undefined,
        undefined,
        'latin1',
      );
      const valuesResult = await fetchTextWithCache(
        provider,
        requestFingerprint({ resource: 'cdc-values', p: file.parameter }),
        `${ctx.config.dwdCdcNormalsUrl}/${file.valuesFile}`,
        ctx,
        undefined,
        undefined,
        'latin1',
      );
      retrievedAt = valuesResult.retrievedAt;
      anyStale = anyStale || stationsResult.stale || valuesResult.stale;
      cacheAge = Math.max(cacheAge, valuesResult.cacheAgeSeconds);

      const stations = parseStations(stationsResult.raw);
      const table = parseCdcTable(valuesResult.raw);
      if (!stations || !table) {
        return {
          status: 'source-error',
          demo: false,
          data: null,
          evidence: [],
          limitations: provider.knownLimitations,
          statusDetail:
            'Die CDC-Tabellen entsprachen nicht dem dokumentierten Layout und wurden verworfen.',
          retrievedAt,
        };
      }

      // Nearest station of THIS parameter that also has a value row.
      const valueByStation = new Map(table.map((r) => [r.stationId, r.columns]));
      const candidates = stations
        .filter((s) => valueByStation.has(s.stationId))
        .map((s) => ({
          ...s,
          distance: distanceMeters(coords, { latitude: s.latitude, longitude: s.longitude }),
        }))
        .sort((a, b) => a.distance - b.distance);
      const station = candidates[0];
      if (!station) continue;
      if (!nearest || station.distance < nearest.distance) {
        nearest = {
          stationId: station.stationId,
          name: station.name,
          coordinates: { latitude: station.latitude, longitude: station.longitude },
          distance: station.distance,
        };
      }
      const columns = valueByStation.get(station.stationId)!;
      values.push({
        parameter: file.parameter,
        monthValue: toNumber(findColumn(columns, MONTH_PATTERNS[month - 1]!)),
        yearValue: toNumber(findColumn(columns, [/^jahr/i, /^year/i])),
        unit: file.unit,
        mode: 'observed',
      });
    }

    if (!nearest || values.length === 0) {
      return {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail: 'Keine Klimastation mit Normalwerten im Datensatz gefunden.',
        retrievedAt,
      };
    }

    const distance = Math.round(nearest.distance);
    const evidence = makeEvidence(provider, {
      mode: 'observed',
      method:
        'Vieljährige Stationsmittel der Referenzperiode 1991–2020 (DWD CDC, multi_annual). Statistische Referenz der nächstgelegenen Klimastation — kein aktueller Zustand, keine Vorhersage.',
      spatial: { kind: 'station', stationId: nearest.stationId, distanceMeters: distance },
      completeness: 'complete',
      retrievedAt,
      ...(cacheAge > 0 ? { cacheAgeSeconds: cacheAge } : {}),
      limitations: [
        `Nächste Klimastation ${formatDistanceGerman(distance)} entfernt; sie kann von der Station des Wettermoduls abweichen — Vergleich, keine Fusion.`,
      ],
    });

    return {
      status: anyStale ? 'stale' : 'ok',
      demo: false,
      data: {
        stationId: nearest.stationId,
        stationName: nearest.name,
        coordinates: nearest.coordinates,
        distanceMeters: distance,
        referencePeriod: '1991–2020',
        month,
        values,
      },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      retrievedAt,
    };
  } catch (err) {
    return errorEnvelope<ClimateNormalsContext>(err, provider.knownLimitations);
  }
}
