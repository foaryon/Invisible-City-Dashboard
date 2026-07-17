/**
 * Non-functional tests: performance budgets and security posture (§3.1.K).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { distanceMeters } from '@invisible-city/evidence';
import { nearestGridValue } from '../src/cams/extract.js';

const REPO_ROOT = resolve(process.cwd());

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'coverage') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe('performance budgets', () => {
  it('computes 100k great-circle distances well under a second', () => {
    const a = { latitude: 52.52, longitude: 13.405 };
    let acc = 0;
    const t0 = performance.now();
    for (let i = 0; i < 100_000; i++) {
      acc += distanceMeters(a, { latitude: 48.1 + i * 1e-6, longitude: 11.6 });
    }
    const ms = performance.now() - t0;
    expect(acc).toBeGreaterThan(0);
    expect(ms).toBeLessThan(1000);
  });

  it('extracts a cell from a 300x300 grid quickly (no interpolation cost)', () => {
    const n = 300;
    const lats = Array.from({ length: n }, (_, i) => 40 + i * 0.05);
    const lons = Array.from({ length: n }, (_, i) => 5 + i * 0.05);
    const values = Array.from({ length: n * n }, (_, i) => i % 50);
    const t0 = performance.now();
    for (let i = 0; i < 200; i++) {
      nearestGridValue(lats, lons, values, { latitude: 52.5, longitude: 13.4 });
    }
    expect(performance.now() - t0).toBeLessThan(500);
  });
});

describe('security posture — no secrets in the frontend', () => {
  const webSrc = walk(join(REPO_ROOT, 'apps', 'web', 'src'));
  // Boolean includes-checks (not toMatch) so a failure never dumps a whole bundle.
  const anyContains = (files: string[], needle: string | RegExp): string | null => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const hit = typeof needle === 'string' ? text.includes(needle) : needle.test(text);
      if (hit) return file.replace(REPO_ROOT, '.');
    }
    return null;
  };

  it('scans the web source', () => {
    expect(webSrc.length).toBeGreaterThan(5);
  });

  it('never uses the server-only ADS header or reads Node secrets', () => {
    // The env-var NAMES (e.g. CAMS_ADS_KEY) may appear as setup guidance text —
    // that is not a secret. The server-only auth header and env reads must not.
    expect(anyContains(webSrc, 'PRIVATE-TOKEN')).toBeNull();
    expect(anyContains(webSrc, /process\.env/)).toBeNull();
    expect(anyContains(webSrc, /camsApiKey|gtfsRtApiKey/)).toBeNull();
  });

  it('never imports the server-only providers package', () => {
    expect(anyContains(webSrc, '@invisible-city/providers')).toBeNull();
  });

  it('no source uses eval or new Function (no dynamic code execution)', () => {
    const all = [...walk(join(REPO_ROOT, 'apps')), ...walk(join(REPO_ROOT, 'packages'))].filter(
      (f) => !/\.test\.tsx?$/.test(f),
    );
    expect(anyContains(all, /\beval\s*\(/)).toBeNull();
    expect(anyContains(all, /new Function\s*\(/)).toBeNull();
  });

  it('the built SPA bundle (if present) never leaks the server-only ADS header', () => {
    const dist = join(REPO_ROOT, 'apps', 'web', 'dist');
    if (!existsSync(dist)) return; // built lazily; CI builds before scanning
    const jsHtml: string[] = [];
    if (existsSync(join(dist, 'index.html'))) jsHtml.push(join(dist, 'index.html'));
    const assetsDir = join(dist, 'assets');
    if (existsSync(assetsDir)) {
      for (const f of readdirSync(assetsDir)) {
        if (/\.(js|html)$/.test(f)) jsHtml.push(join(assetsDir, f));
      }
    }
    expect(jsHtml.length).toBeGreaterThan(0);
    expect(anyContains(jsHtml, 'PRIVATE-TOKEN')).toBeNull();
  });
});
