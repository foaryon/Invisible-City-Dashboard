import { test, expect } from '@playwright/test';

const DEMO_BANNER = 'DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN';

test('mobile: map is primary; Lens and Belege open as bottom sheets', async ({ page }) => {
  await page.goto('/');
  // Demo toggle then search.
  const toggle = page.getByRole('checkbox', { name: /Demo-Modus/ });
  await toggle.check();
  await expect(page.getByText(DEMO_BANNER)).toBeVisible();

  const search = page.getByRole('combobox', { name: /Ort, Adresse/ });
  await search.click();
  await search.fill('berlin');
  const option = page.getByRole('option').filter({ hasText: 'Berlin' }).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();

  // Open the Lens bottom sheet.
  await page.getByRole('button', { name: 'Lens' }).click();
  await expect(page.getByRole('heading', { name: 'Place Lens' })).toBeVisible();

  // Open the Belege (inspector) sheet.
  await page.getByRole('button', { name: 'Belege', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Evidence Inspector' })).toBeVisible();
});
