import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildServer } from './server.js';

const port = Number(process.env.PORT ?? 3001);
const cachePath = resolve(process.env.CACHE_DB ?? 'var/cache.sqlite');
mkdirSync(dirname(cachePath), { recursive: true });

const app = await buildServer({ cachePath, logger: true });
app
  .listen({ port, host: '127.0.0.1' })
  .then(() => console.info(`Invisible City API listening on http://127.0.0.1:${port}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
