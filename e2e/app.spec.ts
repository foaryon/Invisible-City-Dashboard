import { test, expect, type Page } from '@playwright/test';

const DEMO_BANNER = 'DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN';

async function enableDemo(page: Page) {
  const toggle = page.getByRole('checkbox', { name: /Demo-Modus/ });
  if (!(await toggle.isChecked())) await toggle.check();
  await expect(page.getByText(DEMO_BANNER)).toBeVisible();
}

async function selectBerlin(page: Page) {
  const search = page.getByRole('combobox', { name: /Ort, Adresse oder Koordinaten/ });
  await search.click();
  await search.fill('berlin');
  const option = page.getByRole('option').filter({ hasText: 'Berlin' }).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Place Lens' })).toBeVisible();
});

test('demo banner appears only when demo mode is on', async ({ page }) => {
  await expect(page.getByText(DEMO_BANNER)).toHaveCount(0);
  await enableDemo(page);
  await expect(page.getByText(DEMO_BANNER)).toBeVisible();
  await page.getByRole('checkbox', { name: /Demo-Modus/ }).uncheck();
  await expect(page.getByText(DEMO_BANNER)).toHaveCount(0);
});

test('search selects a German place and populates the Place Lens', async ({ page }) => {
  await enableDemo(page);
  await selectBerlin(page);
  // Scope to the Place Lens region (module titles also appear in the coverage matrix).
  const lens = page.getByRole('region', { name: 'Place Lens' });
  await expect(lens.getByText('Wetter', { exact: true })).toBeVisible();
  await expect(lens.getByText('Luft: Stationsmessung', { exact: true })).toBeVisible();
  await expect(lens.getByText('Amtliche Warnungen', { exact: true })).toBeVisible();
  await expect(lens.getByText('ÖPNV-Verfügbarkeit')).toBeVisible();
  // Demo status pills are present (module status = demo).
  await expect(lens.getByText('Demo').first()).toBeVisible();
});

test('tiered lens: context modules collapse; noteworthy demo data auto-promotes [tiering 2026-07-19]', async ({
  page,
}) => {
  await enableDemo(page);
  await selectBerlin(page);
  const lens = page.getByRole('region', { name: 'Place Lens' });

  // Demo fixtures carry 1 NINA alert, 1 Autobahn event, quake catalogue entries
  // and pollen index "2" — these context modules auto-promote to visible cards.
  await expect(lens.getByRole('region', { name: 'Zivilschutz (NINA)' })).toBeVisible();
  await expect(lens.getByRole('region', { name: 'Autobahn-Verkehrslage' })).toBeVisible();
  await expect(lens.getByRole('region', { name: 'Erdbeben (GEOFON)' })).toBeVisible();
  await expect(lens.getByRole('region', { name: 'Pollenflug' })).toBeVisible();
  await expect(lens.locator('.badge-active').first()).toBeVisible();

  // Never-noteworthy context modules stay collapsed until the disclosure opens.
  const toggle = lens.getByRole('button', { name: /Weitere Kontexte/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(lens.getByText('Klimanormalwerte', { exact: true })).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(lens.getByText('Klimanormalwerte', { exact: true })).toBeVisible();
  await expect(lens.getByText('Wasserstände (Pegel)', { exact: true })).toBeVisible();

  // A collapsed row expands into the full module card on demand.
  await lens.getByRole('button', { name: 'Details: Klimanormalwerte' }).click();
  await expect(lens.getByRole('region', { name: 'Klimanormalwerte' })).toBeVisible();
});

test('search results exclude non-German places (Paris filtered out)', async ({ page }) => {
  await enableDemo(page);
  const search = page.getByRole('combobox', { name: /Ort, Adresse/ });
  await search.click();
  await search.fill('berlin');
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('option').filter({ hasText: 'Paris' })).toHaveCount(0);
});

test('keyboard navigation selects a search result', async ({ page }) => {
  await enableDemo(page);
  const search = page.getByRole('combobox', { name: /Ort, Adresse/ });
  await search.click();
  await search.fill('berlin');
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15_000 });
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.getByRole('heading', { name: 'Place Lens' })).toBeVisible();
  // A place is now selected → coverage matrix has real rows.
  await expect(page.getByText('Wettervorhersage')).toBeVisible();
});

test('Enter without arrow navigation confirms the first result', async ({ page }) => {
  await enableDemo(page);
  const search = page.getByRole('combobox', { name: /Ort, Adresse/ });
  await search.click();
  await search.fill('berlin');
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15_000 });
  await search.press('Enter'); // no ArrowDown — the type-then-confirm flow
  // The first result is selected and the Lens populates for it.
  await expect(page.getByText('Wettervorhersage')).toBeVisible();
});

test('layer switching updates the legend and keeps one primary layer', async ({ page }) => {
  await enableDemo(page);
  await selectBerlin(page);
  const airBtn = page.getByRole('button', { name: /Luft: Stationsmessungen/ });
  await airBtn.click();
  await expect(airBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('complementary', { name: /Legende/ })).toContainText(
    'regionale Referenz',
  );
  // Switching to the CAMS layer updates the legend to grid semantics.
  const camsBtn = page.getByRole('button', { name: /Regionales Modell/ });
  await camsBtn.click();
  await expect(camsBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(airBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('complementary', { name: /Legende/ })).toContainText('Rasterzelle');
});

test('evidence inspector opens with source, mode and limitations', async ({ page }) => {
  await enableDemo(page);
  await selectBerlin(page);
  await page.getByRole('button', { name: /Belege anzeigen: Wetterkontext/ }).click();
  const inspector = page.getByRole('region', { name: 'Evidence Inspector' });
  await expect(inspector).toContainText('Deutscher Wetterdienst');
  await expect(inspector).toContainText('Datenart');
  await expect(inspector).toContainText(DEMO_BANNER);
});

test('time control moves forward and shows Europe/Berlin', async ({ page }) => {
  await enableDemo(page);
  await selectBerlin(page);
  const slider = page.getByRole('slider', { name: /Zeitpunkt bis 48 Stunden/ });
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(page.getByText(/\+1 h ·/)).toBeVisible();
  await expect(page.getByText(/Europe\/Berlin/)).toBeVisible();
});

test('A/B/C comparison shows data mode beside values and no overall score', async ({ page }) => {
  await enableDemo(page);
  await selectBerlin(page);
  await page.getByRole('button', { name: /A setzen/ }).click();
  const table = page.locator('table.compare-table');
  await expect(table).toBeVisible();
  await expect(table).toContainText('Temperatur');
  await expect(table).toContainText('PM2.5');
  // Data-mode chip is shown beside values (fixture data is observed → "Gemessen").
  // The compare bundle fetches several endpoints in parallel with the lens; allow time.
  await expect(table.getByText('Gemessen').first()).toBeVisible({ timeout: 30_000 });
  // No forbidden ranking language / overall score.
  await expect(page.getByText(/beste Gegend/i)).toHaveCount(0);
});

test('reduced motion still renders the app', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByText('The Invisible City')).toBeVisible();
  await context.close();
});
