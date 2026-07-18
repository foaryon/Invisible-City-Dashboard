/**
 * Live provider diagnostic harness (run on a machine WITH internet).
 *
 *   npm run diagnose              # one pass over representative locations
 *   npm run diagnose -- --watch   # repeat every 5 min (extended observation)
 *   npm run diagnose -- --watch --interval=120
 *
 * Why this exists: every build/CI sandbox in this project has egress to the
 * provider hosts policy-blocked, so adapters built against documented-but-never
 * -live-verified endpoints cannot be confirmed there. This harness calls every
 * real adapter with a real `fetch` from the user's machine, records the actual
 * HTTP status, whether the response parsed, how many items came back and how
 * long it took, prints a per-location table AND writes `diagnostics-report.json`
 * (plus an appended `diagnostics-report.jsonl` history in watch mode).
 *
 * It reuses the exact adapters the API uses — no reimplementation — via tsx, so
 * a green run here means the live endpoints and schemas are correct.
 */
import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import {
  loadConfig,
  createMemoryCache,
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
  getCivilWarningContext,
  getAutobahnContext,
  getSeismicContext,
  getClimateNormalsContext,
  getFuelContext,
  getStationFacilityContext,
} from '@invisible-city/providers';

/** Minimal .env loader so credentialed providers (CAMS, Tankerkönig, …) activate. */
function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

/** Instrument global fetch so each adapter's real HTTP calls can be attributed. */
const httpLog = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const started = performance.now();
  const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
  try {
    const res = await realFetch(input, init);
    httpLog.push({
      url,
      status: res.status,
      ok: res.ok,
      ms: Math.round(performance.now() - started),
    });
    return res;
  } catch (err) {
    httpLog.push({
      url,
      status: 0,
      ok: false,
      ms: Math.round(performance.now() - started),
      error: err && err.message ? err.message : String(err),
    });
    throw err;
  }
};

/** Representative German locations: cities, a rural point and an island. */
const LOCATIONS = [
  { name: 'Trier', latitude: 49.7596, longitude: 6.6439 },
  { name: 'Berlin', latitude: 52.52, longitude: 13.405 },
  { name: 'München', latitude: 48.137, longitude: 11.575 },
  { name: 'Hamburg', latitude: 53.551, longitude: 9.993 },
  { name: 'Köln', latitude: 50.938, longitude: 6.96 },
  { name: 'Eifel (ländlich)', latitude: 50.3, longitude: 6.6 },
  { name: 'Sylt (Insel)', latitude: 54.9, longitude: 8.3 },
];

/** Count the meaningful items in a module envelope's data payload. */
function countItems(data) {
  if (data == null) return 0;
  if (Array.isArray(data)) return data.length;
  for (const k of [
    'stations',
    'warnings',
    'events',
    'pois',
    'frames',
    'days',
    'values',
    'facilities',
    'partregions',
    'hours',
  ]) {
    if (Array.isArray(data[k])) return data[k].length;
  }
  return 1;
}

const PROBLEM_STATUSES = new Set(['source-error', 'unavailable', 'exception']);

/** Run one adapter call, attributing the HTTP traffic it produced. */
async function measure(location, provider, fn) {
  const startIdx = httpLog.length;
  const t0 = performance.now();
  let envelope = null;
  let status = 'exception';
  let error = null;
  try {
    envelope = await fn();
    status = envelope && envelope.status ? envelope.status : 'unknown';
    if (PROBLEM_STATUSES.has(status) || status === 'stale' || status === 'partial') {
      error = envelope && envelope.statusDetail ? envelope.statusDetail : null;
    }
  } catch (err) {
    status = 'exception';
    error = err && err.message ? err.message : String(err);
  }
  const ms = Math.round(performance.now() - t0);
  const calls = httpLog.slice(startIdx);
  const lastHttp = calls.length > 0 ? calls[calls.length - 1] : null;
  const record = {
    location,
    provider,
    status,
    httpCode: lastHttp ? lastHttp.status : null,
    httpCalls: calls.length,
    parseOk: status !== 'source-error' && status !== 'exception',
    itemCount: envelope ? countItems(envelope.data) : 0,
    ms,
    error: error ? String(error).slice(0, 160) : null,
  };
  return { record, envelope };
}

async function runLocation(loc, ctx) {
  const coords = { latitude: loc.latitude, longitude: loc.longitude };
  const nowIso = new Date().toISOString();
  const from = new Date(Date.now() - 2 * 3600_000).toISOString();
  const to = new Date(Date.now() + 48 * 3600_000).toISOString();
  const records = [];

  // Reverse geocode first — also yields the Bundesland the pollen module needs.
  const rev = await measure(loc.name, 'photon-reverse', () => reverseGeocode(coords, ctx));
  records.push(rev.record);
  const state =
    rev.envelope && rev.envelope.data && rev.envelope.data[0]
      ? (rev.envelope.data[0].place.state ?? null)
      : null;

  // POIs first too — transit reuses the mapped OSM stops, exactly like the API.
  const poi = await measure(loc.name, 'osm-overpass (pois)', () => getPoiContext(coords, ctx));
  records.push(poi.record);
  const mappedStops = (poi.envelope && poi.envelope.data ? (poi.envelope.data.pois ?? []) : [])
    .filter((p) => p.category === 'transit-stop')
    .map((p) => ({ name: p.name, coordinates: p.coordinates, distanceMeters: p.distanceMeters }));

  const steps = [
    ['photon-search', () => searchPlaces(loc.name, ctx)],
    ['dwd-brightsky (weather)', () => getWeatherContext(coords, from, to, ctx)],
    ['dwd-warnings', () => getWarningContext(coords, ctx)],
    ['uba-airdata (Luft Station)', () => getAirStationContext(coords, ctx)],
    ['cams (Luft Modell)', () => getAirModelContext(coords, ctx)],
    ['dwd-radar (Regenradar)', () => getRadarContext(coords, ctx)],
    ['pegelonline (Wasserstand)', () => getWaterLevelContext(coords, ctx)],
    ['bfs-odl (Radioaktivität)', () => getRadiationContext(coords, ctx)],
    ['dwd-pollen', () => getPollenContext(state, ctx)],
    ['dwd-uv', () => getUvContext(coords, ctx)],
    ['nina (Zivilschutz)', () => getCivilWarningContext(coords, ctx)],
    ['autobahn', () => getAutobahnContext(coords, ctx)],
    ['geofon (Erdbeben)', () => getSeismicContext(coords, ctx)],
    ['dwd-cdc-normals (Klimanormale)', () => getClimateNormalsContext(coords, ctx)],
    ['tankerkoenig (Kraftstoff)', () => getFuelContext(coords, ctx)],
    ['db-fasta (Bahnhof-Aufzüge)', () => getStationFacilityContext(coords, ctx)],
    ['transit (ÖPNV)', () => getTransitContext(coords, mappedStops, nowIso, ctx)],
  ];
  for (const [provider, fn] of steps) {
    const { record } = await measure(loc.name, provider, fn);
    records.push(record);
  }
  return records;
}

async function runOnce() {
  loadDotEnv();
  const config = loadConfig(process.env);
  const cache = createMemoryCache();
  const ctx = { cache, config };
  const generatedAt = new Date().toISOString();

  console.log(`\n═══ Invisible City — Provider-Diagnose @ ${generatedAt} ═══`);
  console.log(
    `Endpunkte: UBA=${config.ubaBaseUrl} · BKG=${config.bkgWfsUrl} (${config.bkgWfsTypeName}) · CDC=${config.dwdCdcNormalsUrl}`,
  );

  const all = [];
  for (const loc of LOCATIONS) {
    const records = await runLocation(loc, ctx);
    all.push(...records);
    console.log(`\n── ${loc.name} (${loc.latitude}, ${loc.longitude}) ──`);
    console.table(
      records.map((r) => ({
        provider: r.provider,
        status: r.status,
        http: r.httpCode ?? '—',
        items: r.itemCount,
        ms: r.ms,
        note: r.error ?? '',
      })),
    );
  }
  cache.close();

  const problems = all.filter((r) => PROBLEM_STATUSES.has(r.status));
  const needsConfig = all.filter((r) => r.status === 'configuration-required');
  console.log(`\n═══ ZUSAMMENFASSUNG ═══`);
  console.log(
    `${all.length} Aufrufe · ${problems.length} Problem(e) (source-error/unavailable/exception) · ` +
      `${needsConfig.length} „configuration-required" (erwartet ohne Keys).`,
  );
  if (problems.length > 0) {
    console.log(`\nPROBLEME (echte Endpoint-/Schema-Fehler):`);
    console.table(
      problems.map((r) => ({
        provider: r.provider,
        location: r.location,
        status: r.status,
        http: r.httpCode ?? '—',
        note: r.error ?? '',
      })),
    );
  }

  const report = { generatedAt, problemCount: problems.length, records: all };
  writeFileSync('diagnostics-report.json', JSON.stringify(report, null, 2));
  appendFileSync('diagnostics-report.jsonl', JSON.stringify(report) + '\n');
  console.log(`\nGeschrieben: diagnostics-report.json (+ diagnostics-report.jsonl angehängt).`);
  return problems.length;
}

function parseArgs(argv) {
  const watch = argv.includes('--watch');
  const intervalArg = argv.find((a) => a.startsWith('--interval='));
  const interval = intervalArg ? Math.max(30, Number(intervalArg.split('=')[1]) || 300) : 300;
  return { watch, interval };
}

const { watch, interval } = parseArgs(process.argv.slice(2));
if (watch) {
  console.log(`Watch-Modus: alle ${interval}s. Abbruch mit Strg+C.`);
  for (;;) {
    await runOnce();
    console.log(`\n⏳ nächste Runde in ${interval}s …`);
    await delay(interval * 1000);
  }
} else {
  const problemCount = await runOnce();
  // Non-zero exit when live problems remain, so CI/scripts can gate on it.
  process.exit(problemCount > 0 ? 1 : 0);
}
