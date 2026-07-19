/**
 * Degraded-state lane [MP-3.1.J-01, MP-3.1.J-02, MP-2.3-01, GD-TRUTH-02]:
 * per-card rendering of honest non-ok states, driven by contract-validated
 * envelopes over Playwright route interception. Live mode, fully intercepted —
 * no request leaves the browser, demo stays off (demo/live purity).
 *
 * Safety-net scope (pre-refactor): the three envelope-status modules whose
 * gating semantics are stable across the tiered-lens refactor.
 */
import { expect, test } from '@playwright/test';
import { makeEnvelope } from './support/envelope-fixtures.js';
import { moduleCard, routeLens, selectBerlin, stubMapTiles } from './support/lens-routes.js';
import type { ModuleStatus } from '../packages/contracts/src/index.js';

// The built app registers /sw.js; service workers can bypass route interception.
test.use({ serviceWorkers: 'block' });

interface StatusCase {
  key: 'weather' | 'warnings' | 'radar';
  title: string;
  status: ModuleStatus;
  detail: string;
  pillLabel: string;
}

const STATUS_CASES: StatusCase[] = [
  {
    key: 'weather',
    title: 'Wetter',
    status: 'source-error',
    detail: 'DWD/Bright Sky nicht erreichbar (E2E-Fixture).',
    pillLabel: 'Quellenfehler',
  },
  {
    key: 'warnings',
    title: 'Amtliche Warnungen',
    status: 'unavailable',
    detail: 'Keine verifizierten Warndaten für diesen Ort verfügbar (E2E-Fixture).',
    pillLabel: 'Nicht verfügbar',
  },
  {
    key: 'radar',
    title: 'Regenradar',
    status: 'stale',
    detail: 'Zwischengespeicherte Radardaten, 45 Minuten alt (E2E-Fixture).',
    pillLabel: 'Veraltet (Cache)',
  },
  {
    key: 'weather',
    title: 'Wetter',
    status: 'partial',
    detail: 'Nur ein Teil der Wetterparameter lieferbar (E2E-Fixture).',
    pillLabel: 'Teilweise',
  },
];

test.beforeEach(async ({ page }) => {
  await stubMapTiles(page);
});

for (const c of STATUS_CASES) {
  test(`${c.key} renders ${c.status} honestly [MP-3.1.J-01]`, async ({ page }) => {
    await routeLens(page, {
      [c.key]: makeEnvelope({ status: c.status, statusDetail: c.detail }),
    });
    await page.goto('/');
    await selectBerlin(page);

    const card = moduleCard(page, c.title);
    await expect(card.locator('.status-pill')).toHaveAttribute('data-state', c.status);
    await expect(card.locator('.status-pill')).toContainText(c.pillLabel);
    // §3.1.J: the state explains what is missing (statusDetail rendered verbatim).
    await expect(card.getByRole('note')).toHaveText(c.detail);
  });
}

test('degraded states never trigger a demo fallback [MP-3.1.J-06]', async ({ page }) => {
  await routeLens(page, {
    weather: makeEnvelope({ status: 'source-error' }),
  });
  await page.goto('/');
  await selectBerlin(page);

  await expect(moduleCard(page, 'Wetter').locator('.status-pill')).toHaveAttribute(
    'data-state',
    'source-error',
  );
  // No demo banner, no demo pill anywhere — live failure stays a visible live failure.
  await expect(page.getByText('DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN')).toHaveCount(0);
  await expect(page.locator('.status-pill[data-state="demo"]')).toHaveCount(0);
});

test('absence styling differs from error styling [MP-4.1-02]', async ({ page }) => {
  await routeLens(page, {
    warnings: makeEnvelope({ status: 'unavailable' }),
    weather: makeEnvelope({ status: 'source-error' }),
  });
  await page.goto('/');
  await selectBerlin(page);

  const absencePill = moduleCard(page, 'Amtliche Warnungen').locator('.status-pill');
  const errorPill = moduleCard(page, 'Wetter').locator('.status-pill');
  await expect(absencePill).toHaveAttribute('data-state', 'unavailable');
  await expect(errorPill).toHaveAttribute('data-state', 'source-error');
  // Distinct computed colors: honest absence must not reuse the alarm styling.
  const [absenceColor, errorColor] = await Promise.all([
    absencePill.evaluate((el) => getComputedStyle(el).color),
    errorPill.evaluate((el) => getComputedStyle(el).color),
  ]);
  expect(absenceColor).not.toBe(errorColor);
});
