import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DEMO_BANNER = 'DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN';

/**
 * Accessibility (§3.1.K): no critical/serious axe violations in the app chrome.
 * The MapLibre canvas region is excluded (third-party WebGL canvas); we assert
 * on our own semantic UI — landmarks, labels, roles, focus order.
 */
test('no critical or serious accessibility violations (demo mode)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('checkbox', { name: /Demo-Modus/ }).check();
  await expect(page.getByText(DEMO_BANNER)).toBeVisible();

  // Select a place so panels populate with real content.
  const search = page.getByRole('combobox', { name: /Ort, Adresse/ });
  await search.fill('berlin');
  await page.getByRole('option').filter({ hasText: 'Berlin' }).first().click();
  await expect(page.getByRole('region', { name: 'Place Lens' })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .exclude('.map-column')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(
    serious,
    `axe violations:\n${serious.map((v) => `${v.id}: ${v.help}`).join('\n')}`,
  ).toEqual([]);
});

test('primary controls are reachable and labelled for keyboard users', async ({ page }) => {
  await page.goto('/');
  // Skip link is the first focusable element.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /Zur Karte springen/ })).toBeFocused();
  // The search combobox has an accessible name.
  await expect(page.getByRole('combobox', { name: /Ort, Adresse/ })).toBeVisible();
  // The map region carries an application label.
  await expect(page.getByRole('application', { name: /Interaktive Karte/ })).toBeVisible();
});
