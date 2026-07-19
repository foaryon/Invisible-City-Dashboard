/**
 * Route interception for the degraded-state E2E lane. One handler serves every
 * /api/* request from a per-test scenario table; map-tile hosts are stubbed so
 * no request leaves the browser (deterministic, offline, demo mode off).
 */
import type { Page } from '@playwright/test';
import { berlinSearchEnvelope, makeEnvelope } from './envelope-fixtures.js';
import type { ModuleEnvelope } from '../../packages/contracts/src/index.js';

export const MODULE_PATHS = {
  weather: '/api/weather',
  warnings: '/api/warnings',
  civilWarnings: '/api/civil-warnings',
  radar: '/api/radar',
  climateNormals: '/api/climate-normals',
  airStations: '/api/air/stations',
  airModel: '/api/air/model',
  pollen: '/api/pollen',
  uv: '/api/uv',
  water: '/api/water',
  radiation: '/api/radiation',
  quakes: '/api/quakes',
  pois: '/api/pois',
  autobahn: '/api/autobahn',
  fuel: '/api/fuel',
  stationFacilities: '/api/station-facilities',
  transit: '/api/transit',
} as const;

export type ModuleKey = keyof typeof MODULE_PATHS;

/** Envelope per module; unspecified modules answer with an honest `unavailable`. */
export type Scenario = Partial<Record<ModuleKey, ModuleEnvelope<unknown>>>;

export async function routeLens(page: Page, scenario: Scenario): Promise<void> {
  const byPath = new Map<string, ModuleKey>(
    (Object.entries(MODULE_PATHS) as Array<[ModuleKey, string]>).map(([k, p]) => [p, k]),
  );
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/health') {
      return route.fulfill({ json: { status: 'ok' } });
    }
    if (path === '/api/readiness') {
      // Live posture, demo disabled → the demo toggle stays hidden.
      return route.fulfill({ json: { manifestVersion: 'e2e', demoEnabled: false, providers: [] } });
    }
    if (path === '/api/providers') {
      return route.fulfill({ json: { manifestVersion: 'e2e', providers: [] } });
    }
    if (path === '/api/search' || path === '/api/reverse') {
      return route.fulfill({ json: berlinSearchEnvelope() });
    }
    const key = byPath.get(path);
    if (!key) {
      return route.fulfill({ status: 404, json: { error: `e2e: unrouted path ${path}` } });
    }
    const env = scenario[key] ?? makeEnvelope({ status: 'unavailable' });
    return route.fulfill({ status: 200, contentType: 'application/json', json: env });
  });
}

/**
 * Stub the external base-map style with a minimal valid MapLibre style and
 * abort all other tile/WMS traffic — the map initializes quietly with an empty
 * canvas and the tests stay deterministic and offline. Specs never assert on
 * map pixels (consistent with a11y.spec.ts excluding .map-column).
 */
export async function stubMapTiles(page: Page): Promise<void> {
  await page.route('https://tiles.openfreemap.org/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/styles/')) {
      return route.fulfill({
        contentType: 'application/json',
        json: { version: 8, name: 'e2e-empty', sources: {}, layers: [] },
      });
    }
    return route.abort();
  });
  await page.route('https://maps.dwd.de/**', (route) => route.abort());
}

/**
 * Scope a locator to one Place Lens module card by its German title.
 * Cards are named regions since the tiered-lens refactor (ModuleCard renders
 * <section aria-labelledby> with the h3 title).
 */
export function moduleCard(page: Page, title: string) {
  return page.getByRole('region', { name: title, exact: true });
}

/** Open the collapsed "Weitere Kontexte" tier (context modules render inside). */
export async function openContextSection(page: Page) {
  await page.getByRole('button', { name: /Weitere Kontexte/ }).click();
}

/** Search-driven selection of the canonical Berlin fixture (mirrors app.spec.ts). */
export async function selectBerlin(page: Page): Promise<void> {
  const search = page.getByRole('combobox', { name: /Ort, Adresse oder Koordinaten/ });
  await search.fill('berlin');
  await page.getByRole('option').filter({ hasText: 'Berlin' }).first().click();
}
