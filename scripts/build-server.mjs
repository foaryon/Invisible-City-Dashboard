/**
 * Bundle the API into a single self-contained ESM file (dist/server.mjs).
 *
 * With better-sqlite3 replaced by the built-in node:sqlite there are no native
 * modules left, so the entire server — Fastify, adapters, GTFS, NetCDF — fits
 * into one JS file that runs with nothing but a Node ≥22 binary:
 *
 *   node apps/api/dist/server.mjs
 *
 * This is also the input for the lean Docker image and the standalone
 * executable (scripts/build-standalone.mjs).
 */
import { build } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [resolve(root, 'apps/api/src/index.ts')],
  outfile: resolve(root, 'apps/api/dist/server.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  legalComments: 'linked',
  // CJS deps (fastify, pino, adm-zip, …) may call require()/__dirname at
  // runtime; provide them in the ESM bundle.
  banner: {
    js: [
      "import { createRequire as __icRequire } from 'node:module';",
      'const require = __icRequire(import.meta.url);',
      "import { dirname as __icDirname } from 'node:path';",
      "import { fileURLToPath as __icFileURLToPath } from 'node:url';",
      'const __filename = __icFileURLToPath(import.meta.url);',
      'const __dirname = __icDirname(__filename);',
    ].join('\n'),
  },
  logLevel: 'info',
});
