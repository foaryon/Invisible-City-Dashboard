/**
 * Masterprompt governance / compliance suite.
 *
 * Asserts the reality policy and source-governance rules hold across the whole
 * codebase: no disallowed wording ships in source, every provider is properly
 * attributed, contracts carry the required discriminators, and demo output is
 * stamped end-to-end.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  DataModeSchema,
  SpatialContextSchema,
  ProviderManifestEntrySchema,
} from '@invisible-city/contracts';
import {
  violatesWordingPolicy,
  freshnessLabelDe,
  assessComparability,
} from '@invisible-city/evidence';
import { providerManifest, MANIFEST_VERSION } from '../src/manifest.js';
import { demoAdapters } from '../src/demo.js';

const REPO_ROOT = resolve(process.cwd());

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'coverage') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Product source (UI + adapters), excluding the wording policy definition and all tests. */
function productSourceFiles(): string[] {
  const roots = [join(REPO_ROOT, 'apps'), join(REPO_ROOT, 'packages')];
  return roots
    .flatMap((r) => walk(r))
    .filter(
      (f) =>
        !/\.test\.tsx?$/.test(f) && !f.includes(`${'/'}test${'/'}`) && !f.endsWith('wording.ts'), // defines the forbidden patterns
    );
}

describe('wording policy (§9) — no disallowed claims ship in product source', () => {
  const files = productSourceFiles();

  it('scans a meaningful number of source files', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('contains no forbidden claim phrasing in any UI/adapter string', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      if (violatesWordingPolicy(text)) offenders.push(file.replace(REPO_ROOT, '.'));
    }
    expect(offenders).toEqual([]);
  });

  it('never labels cached or scheduled data as live/Echtzeit', () => {
    expect(freshnessLabelDe('scheduled', 300)).not.toMatch(/echtzeit/i);
    expect(freshnessLabelDe('cached', 300)).not.toMatch(/echtzeit/i);
  });
});

describe('source governance (§5) — every provider is fully declared', () => {
  it('the manifest is versioned and non-empty', () => {
    expect(MANIFEST_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(providerManifest.length).toBeGreaterThanOrEqual(9);
  });

  it('every entry validates and carries institution, license, attribution, review date, source URL', () => {
    for (const p of providerManifest) {
      expect(() => ProviderManifestEntrySchema.parse(p)).not.toThrow();
      expect(p.institution.length).toBeGreaterThan(2);
      expect(p.license.length).toBeGreaterThan(2);
      expect(p.attributionText.length).toBeGreaterThan(2);
      expect(p.reviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.originalSourceUrl).toMatch(/^https?:\/\//);
      expect(p.supportedDataModes.length).toBeGreaterThan(0);
      expect(Array.isArray(p.toVerify)).toBe(true);
      expect(Array.isArray(p.knownLimitations)).toBe(true);
    }
  });

  it('only verified/proposed statuses are used (no source presumed valid without review)', () => {
    for (const p of providerManifest) {
      expect(['verified', 'proposed', 'suspended', 'deprecated']).toContain(p.status);
    }
  });
});

describe('data contracts (§6) — mode & spatial discriminators exist', () => {
  it('exposes all ten data modes', () => {
    expect(new Set(DataModeSchema.options)).toEqual(
      new Set([
        'observed',
        'forecast',
        'modelled',
        'mapped',
        'scheduled',
        'realtime',
        'partial',
        'cached',
        'unavailable',
        'demo',
      ]),
    );
  });

  it('spatial context is a discriminated union covering station/grid/geometry/coverage/unknown', () => {
    const kinds = SpatialContextSchema.options.map((o) => o.shape.kind.value);
    expect(new Set(kinds)).toEqual(new Set(['station', 'grid', 'geometry', 'coverage', 'unknown']));
  });
});

describe('reality policy (§2) — combine, never fuse', () => {
  it('observed is never comparable with modelled (station ≠ grid)', () => {
    const verdict = assessComparability(
      { mode: 'observed', parameter: 'PM2', validAt: '2026-07-16T12:00:00Z' },
      { mode: 'modelled', parameter: 'PM2', validAt: '2026-07-16T12:00:00Z' },
    );
    expect(verdict.comparable).toBe(false);
  });
});

describe('demo/live separation (§3.1.J) — every demo adapter is stamped', () => {
  const coords = { latitude: 52.52, longitude: 13.405 };

  it('stamps demo=true, status "demo" and evidence mode "demo" across all adapters', async () => {
    const envelopes = [
      await demoAdapters.weather(coords, '2026-07-16T08:00:00Z', '2026-07-16T14:00:00Z'),
      await demoAdapters.warnings(coords),
      await demoAdapters.airStations(coords),
      await demoAdapters.pois(coords),
      await demoAdapters.search('berlin'),
      await demoAdapters.reverse(coords),
      await demoAdapters.transit(coords, [], '2026-07-16T12:00:00Z'),
      demoAdapters.airModel(coords),
    ];
    for (const env of envelopes) {
      expect(env.demo).toBe(true);
      expect(env.status).toBe('demo');
      expect(env.limitations[0]).toBe('DEMO-DATEN — KEINE AKTUELLEN REALEN BEDINGUNGEN');
      for (const e of env.evidence) expect(e.mode).toBe('demo');
    }
  });
});
