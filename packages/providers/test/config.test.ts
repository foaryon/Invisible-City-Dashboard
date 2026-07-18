import { describe, it, expect } from 'vitest';
import { loadConfig, isConfigured, demoConfig, REQUIRED_ENV } from '../src/config.js';

const empty = {} as NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('provides production-safe public defaults', () => {
    const c = loadConfig(empty);
    expect(c.brightskyUrl).toBe('https://api.brightsky.dev');
    expect(c.dwdWfsUrl).toContain('maps.dwd.de');
    expect(c.ubaBaseUrl).toContain('www.umweltbundesamt.de');
    expect(c.overpassUrl).toContain('overpass-api.de');
    expect(c.photonUrl).toContain('photon.komoot.io');
    expect(c.enableDemo).toBe(false);
  });

  it('allows self-hosting overrides via env', () => {
    const c = loadConfig({
      OVERPASS_URL: 'http://localhost:12345/api/interpreter',
      PHOTON_URL: 'http://localhost:2322',
    } as unknown as NodeJS.ProcessEnv);
    expect(c.overpassUrl).toBe('http://localhost:12345/api/interpreter');
    expect(c.photonUrl).toBe('http://localhost:2322');
  });

  it('parses ENABLE_DEMO truthiness', () => {
    expect(loadConfig({ ENABLE_DEMO: '1' } as NodeJS.ProcessEnv).enableDemo).toBe(true);
    expect(loadConfig({ ENABLE_DEMO: 'true' } as NodeJS.ProcessEnv).enableDemo).toBe(true);
    expect(loadConfig({ ENABLE_DEMO: '0' } as NodeJS.ProcessEnv).enableDemo).toBe(false);
    expect(loadConfig({ ENABLE_DEMO: 'yes' } as NodeJS.ProcessEnv).enableDemo).toBe(false);
  });

  it('only sets credential fields when provided (exactOptional-safe)', () => {
    const c = loadConfig(empty);
    expect(c.camsApiKey).toBeUndefined();
    expect(c.gtfsStaticPath).toBeUndefined();
    expect(c.gtfsRtUrl).toBeUndefined();
    const keyed = loadConfig({
      CAMS_ADS_KEY: 'k',
      GTFS_RT_URL: 'u',
    } as unknown as NodeJS.ProcessEnv);
    expect(keyed.camsApiKey).toBe('k');
    expect(keyed.gtfsRtUrl).toBe('u');
  });
});

describe('isConfigured (config-gated activation)', () => {
  it('keyless providers are always configured', () => {
    const c = loadConfig(empty);
    for (const id of ['dwd-brightsky', 'uba-airdata', 'osm-overpass', 'photon-geocoding']) {
      expect(isConfigured(id, c)).toBe(true);
    }
  });

  it('credentialed providers require their config', () => {
    const c = loadConfig(empty);
    expect(isConfigured('cams-eu-airquality', c)).toBe(false);
    expect(isConfigured('delfi-gtfs', c)).toBe(false);
    expect(isConfigured('delfi-gtfs-rt', c)).toBe(false);

    const configured = loadConfig({
      CAMS_ADS_KEY: 'x',
      GTFS_STATIC_URL: 'https://example.org/feed.zip',
      GTFS_RT_URL: 'https://example.org/rt',
    } as unknown as NodeJS.ProcessEnv);
    expect(isConfigured('cams-eu-airquality', configured)).toBe(true);
    expect(isConfigured('delfi-gtfs', configured)).toBe(true);
    expect(isConfigured('delfi-gtfs-rt', configured)).toBe(true);
  });

  it('publishes the env vars each credentialed provider needs', () => {
    expect(REQUIRED_ENV['cams-eu-airquality']).toContain('CAMS_ADS_KEY');
    expect(REQUIRED_ENV['delfi-gtfs-rt']).toContain('GTFS_RT_URL');
  });
});

describe('demoConfig', () => {
  it('enables demo and keeps public defaults', () => {
    const c = demoConfig();
    expect(c.enableDemo).toBe(true);
    expect(c.brightskyUrl).toBe('https://api.brightsky.dev');
  });
});
