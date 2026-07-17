/**
 * CAMS European air-quality regional model (§3.1.D.2, Stage 4) — real ADS client.
 *
 * Retrieves the `cams-europe-air-quality-forecasts` dataset from the Copernicus
 * Atmosphere Data Store (ADS) process API, downloads the NetCDF result and
 * extracts the nearest grid cell (~10 km). It is REGIONAL, modelled context —
 * never downscaled or interpolated to an address, never merged with station
 * observations (§2.2, §8.2).
 *
 * Gated on `CAMS_ADS_KEY`. Without the key the provider is not "verified" and
 * the app reports "configuration-required" — no demo, no invented values.
 *
 * The exact ADS process-API request/response shape and NetCDF variable names
 * are documented but not verifiable from the build environment (no key, egress
 * blocked); they are tracked as TO VERIFY in docs/data-sources.md. The grid
 * extraction core (`nearestGridValue`) is pure and unit-tested.
 */
import { NetCDFReader } from 'netcdfjs';
import {
  type ModuleEnvelope,
  type AirModelContext,
  type AirModelValue,
  type Coordinates,
  type Pollutant,
} from '@invisible-city/contracts';
import { makeEvidence, distanceMeters } from '@invisible-city/evidence';
import { getEffectiveProvider } from '../manifest.js';
import { policedFetch } from '../http.js';
import { errorEnvelope, type AdapterContext } from '../runner.js';
import { nearestGridValue, gridResolutionKm } from '../cams/extract.js';

/** CAMS ensemble variables: ADS request name → NetCDF variable → our pollutant. */
const VARIABLES: Array<{ request: string; netcdf: string; pollutant: Pollutant; unit: string }> = [
  { request: 'particulate_matter_2.5um', netcdf: 'pm2p5_conc', pollutant: 'PM2', unit: 'µg/m³' },
  { request: 'particulate_matter_10um', netcdf: 'pm10_conc', pollutant: 'PM10', unit: 'µg/m³' },
  { request: 'nitrogen_dioxide', netcdf: 'no2_conc', pollutant: 'NO2', unit: 'µg/m³' },
  { request: 'ozone', netcdf: 'o3_conc', pollutant: 'O3', unit: 'µg/m³' },
];

function readCoordArray(reader: NetCDFReader, candidates: string[]): number[] | null {
  for (const name of candidates) {
    const variable = reader.variables.find((v) => v.name === name);
    if (variable) {
      const data = reader.getDataVariable(name) as ArrayLike<number>;
      return Array.from(data, Number);
    }
  }
  return null;
}

/**
 * Submit a retrieval, poll to completion, return the NetCDF asset URL.
 * Follows the ADS/CDS process API (retrieve/v1). Endpoint base comes from config.
 */
async function retrieveNetcdf(
  base: string,
  apiKey: string,
  coords: Coordinates,
  fetchImpl: AdapterContext['fetchImpl'],
): Promise<ArrayBuffer> {
  const dataset = 'cams-europe-air-quality-forecasts';
  const today = new Date().toISOString().slice(0, 10);
  const delta = 0.3;
  const body = {
    inputs: {
      variable: VARIABLES.map((v) => v.request),
      model: ['ensemble'],
      level: ['0'],
      type: ['forecast'],
      time: ['00:00'],
      leadtime_hour: ['0'],
      date: `${today}/${today}`,
      area: [
        coords.latitude + delta,
        coords.longitude - delta,
        coords.latitude - delta,
        coords.longitude + delta,
      ],
      format: 'netcdf',
    },
  };
  const headers = { 'PRIVATE-TOKEN': apiKey, 'Content-Type': 'application/json' };
  const submit = await policedFetch(`${base}/retrieve/v1/processes/${dataset}/execute`, {
    timeoutMs: 20000,
    ...(fetchImpl ? { fetchImpl } : {}),
    init: { method: 'POST', headers, body: JSON.stringify(body) },
  });
  const job = (await submit.json()) as { jobID?: string; jobId?: string };
  const jobId = job.jobID ?? job.jobId;
  if (!jobId) throw new Error('ADS-Antwort ohne Job-ID.');

  // Poll (bounded) for completion.
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await policedFetch(`${base}/retrieve/v1/jobs/${jobId}`, {
      timeoutMs: 15000,
      ...(fetchImpl ? { fetchImpl } : {}),
      init: { headers },
    });
    const status = (await statusRes.json()) as { status?: string };
    if (status.status === 'successful') break;
    if (status.status === 'failed') throw new Error('ADS-Retrieval fehlgeschlagen.');
  }
  const resultsRes = await policedFetch(`${base}/retrieve/v1/jobs/${jobId}/results`, {
    timeoutMs: 15000,
    ...(fetchImpl ? { fetchImpl } : {}),
    init: { headers },
  });
  const results = (await resultsRes.json()) as { asset?: { value?: { href?: string } } };
  const href = results.asset?.value?.href;
  if (!href) throw new Error('ADS-Ergebnis ohne Download-Link.');
  const download = await policedFetch(href, {
    timeoutMs: 30000,
    ...(fetchImpl ? { fetchImpl } : {}),
  });
  return download.arrayBuffer();
}

export async function getAirModelContext(
  coords: Coordinates,
  ctx: AdapterContext,
): Promise<ModuleEnvelope<AirModelContext>> {
  const provider = getEffectiveProvider('cams-eu-airquality', ctx.config);
  if (provider.status !== 'verified' || !ctx.config.camsApiKey) {
    return {
      status: 'configuration-required',
      demo: false,
      data: null,
      evidence: [],
      limitations: provider.knownLimitations,
      statusDetail:
        'Regionales Luftqualitätsmodell (CAMS) ist nicht konfiguriert. Für Live-Betrieb ist ein Copernicus-ADS-API-Schlüssel (CAMS_ADS_KEY) erforderlich.',
      retrievedAt: new Date().toISOString(),
    };
  }

  try {
    const buffer = await retrieveNetcdf(
      ctx.config.camsApiUrl,
      ctx.config.camsApiKey,
      coords,
      ctx.fetchImpl,
    );
    const reader = new NetCDFReader(Buffer.from(buffer));
    const lats = readCoordArray(reader, ['latitude', 'lat']);
    const lons = readCoordArray(reader, ['longitude', 'lon']);
    if (!lats || !lons) throw new Error('NetCDF ohne latitude/longitude-Koordinaten.');

    const validAt = new Date().toISOString();
    const values: AirModelValue[] = [];
    let cellLat = coords.latitude;
    let cellLon = coords.longitude;
    for (const v of VARIABLES) {
      const variable = reader.variables.find((x) => x.name === v.netcdf);
      if (!variable) continue;
      const raw = Array.from(reader.getDataVariable(v.netcdf) as ArrayLike<number>, Number);
      // Use the last lat*lon block (time/level sliced to the final step).
      const block = raw.slice(Math.max(0, raw.length - lats.length * lons.length));
      const cell = nearestGridValue(lats, lons, block, coords);
      if (!cell) continue;
      cellLat = cell.cellLat;
      cellLon = cell.cellLon;
      values.push({
        pollutant: v.pollutant,
        value: cell.value,
        unit: v.unit,
        mode: 'modelled',
        validAt,
      });
    }

    if (values.length === 0) {
      return {
        status: 'source-error',
        demo: false,
        data: null,
        evidence: [],
        limitations: provider.knownLimitations,
        statusDetail:
          'CAMS-Antwort enthielt keine erwarteten Modellvariablen. Es werden keine Ersatzwerte erzeugt.',
        retrievedAt: new Date().toISOString(),
      };
    }

    const resolutionKm = gridResolutionKm(lats);
    const offsetMeters = Math.round(
      distanceMeters(coords, { latitude: cellLat, longitude: cellLon }),
    );
    const evidence = makeEvidence(provider, {
      mode: 'modelled',
      method:
        'CAMS-Ensemble (Median aus 11 europäischen Modellen), nächstgelegene Rasterzelle. Regionaler modellierter Hintergrund — kein adressgenauer Wert; nicht mit Stationsmessungen zusammenführbar.',
      spatial: { kind: 'grid', ...(resolutionKm ? { resolutionKm } : {}) },
      completeness: 'complete',
      retrievedAt: validAt,
      validAt,
      limitations: [
        `Rasterzelle ~${resolutionKm ?? 10} km, Zellzentrum ${offsetMeters} m vom gewählten Punkt entfernt.`,
        'Anbieter-Hinweis: „Outputs may not be correlated enough with real concentrations“; „not suitable for clinical trials“.',
      ],
    });

    return {
      status: 'ok',
      demo: false,
      data: {
        cellLatitude: cellLat,
        cellLongitude: cellLon,
        resolutionKm,
        offsetMeters,
        values,
      },
      evidence: [evidence],
      limitations: provider.knownLimitations,
      retrievedAt: validAt,
    };
  } catch (err) {
    return errorEnvelope<AirModelContext>(err, provider.knownLimitations);
  }
}
