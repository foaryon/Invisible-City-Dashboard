import { mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildServer } from './server.js';
import { openBrowser } from './open-browser.js';

/** LAN IPv4 addresses (so a phone on the same Wi-Fi knows where to connect). */
function lanAddresses(): string[] {
  const out: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  return out;
}

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';
const cachePath = resolve(process.env.CACHE_DB ?? 'var/cache.sqlite');
mkdirSync(dirname(cachePath), { recursive: true });

// Serve the built web app when present (single deployable). Override with WEB_ROOT.
const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(process.env.WEB_ROOT ?? resolve(here, '../../web/dist'));

const app = await buildServer({ cachePath, webRoot, logger: true });
app
  .listen({ port, host })
  .then(() => {
    const localUrl = `http://localhost:${port}`;
    console.info(`\n  The Invisible City is running:`);
    console.info(`    • On this computer:  ${localUrl}`);
    if (host === '0.0.0.0') {
      for (const ip of lanAddresses()) {
        console.info(`    • On your phone/LAN: http://${ip}:${port}   (same Wi-Fi)`);
      }
    }
    console.info('');
    // Standalone launchers set OPEN_BROWSER=1 to pop the dashboard automatically.
    if (process.env.OPEN_BROWSER === '1' || process.env.OPEN_BROWSER === 'true') {
      openBrowser(localUrl);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Graceful shutdown: finish in-flight requests, close the cache (onClose hook),
// then exit. Docker/systemd send SIGTERM; Ctrl+C sends SIGINT.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    console.info(`\nReceived ${signal} — shutting down …`);
    void app
      .close()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  });
}
