import { describe, it, expect } from 'vitest';
import {
  providerManifest,
  MANIFEST_VERSION,
  getProvider,
  getEffectiveProvider,
} from '../src/manifest.js';
import { loadConfig } from '../src/config.js';

const empty = loadConfig({} as NodeJS.ProcessEnv);

describe('provider manifest', () => {
  it('has a dated version and validates every entry', () => {
    expect(MANIFEST_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(providerManifest.length).toBeGreaterThanOrEqual(9);
  });

  it('throws for an unknown provider id', () => {
    expect(() => getProvider('does-not-exist')).toThrow();
  });
});

describe('getEffectiveProvider (config-resolved status + endpoint)', () => {
  it('keeps keyless providers verified and fills the endpoint from config', () => {
    const p = getEffectiveProvider('dwd-brightsky', empty);
    expect(p.status).toBe('verified');
    expect(p.technicalEndpoint).toBe('https://api.brightsky.dev/weather');
  });

  it('leaves credentialed providers proposed until configured', () => {
    expect(getEffectiveProvider('cams-eu-airquality', empty).status).toBe('proposed');
    expect(getEffectiveProvider('delfi-gtfs', empty).status).toBe('proposed');
  });

  it('upgrades credentialed providers to verified once configured, without altering identity', () => {
    const configured = loadConfig({
      CAMS_ADS_KEY: 'k',
      GTFS_STATIC_PATH: '/feed.zip',
    } as unknown as NodeJS.ProcessEnv);
    const cams = getEffectiveProvider('cams-eu-airquality', configured);
    expect(cams.status).toBe('verified');
    // License/attribution are never mutated by activation.
    expect(cams.attributionText).toContain('Copernicus');
    expect(getEffectiveProvider('delfi-gtfs', configured).status).toBe('verified');
  });

  it('honours self-hosted endpoint overrides', () => {
    const c = loadConfig({ PHOTON_URL: 'http://localhost:2322' } as unknown as NodeJS.ProcessEnv);
    expect(getEffectiveProvider('photon-geocoding', c).technicalEndpoint).toBe(
      'http://localhost:2322/api',
    );
  });
});
