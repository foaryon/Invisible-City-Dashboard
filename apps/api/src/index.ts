import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildServer } from './server.js';

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
  .then(() => console.info(`Invisible City listening on http://${host}:${port}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
