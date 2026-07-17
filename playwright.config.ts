import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Use the environment's pre-installed Chromium when present (its build may not
 * match Playwright's managed revision). CI installs its own browser, so fall
 * back to Playwright's default there.
 */
const preinstalledChromium = process.env.PW_EXECUTABLE_PATH ?? '/opt/pw-browsers/chromium';
const executablePath = existsSync(preinstalledChromium) ? preinstalledChromium : undefined;
const launchOptions = executablePath ? { executablePath } : {};

/**
 * E2E runs against DEMO MODE so the full UI is deterministic without any live
 * third-party service. Two web servers: the Fastify API (:3001) and the built
 * web app served by `vite preview` (:4173, which proxies /api to the API).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions },
      testIgnore: /.*\.mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], launchOptions },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'npm run start --workspace apps/api',
      // E2E drives the UI in Demo Mode, so the API must permit demo.
      env: { PORT: '3001', CACHE_DB: 'var/e2e-cache.sqlite', ENABLE_DEMO: '1' },
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        'npm run build --workspace apps/web && npm run preview --workspace apps/web -- --port 4173 --host 127.0.0.1',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
