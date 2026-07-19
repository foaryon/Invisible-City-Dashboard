import { describe, expect, it } from 'vitest';
import { type ModuleEnvelope } from '@invisible-city/contracts';
import { LENS_MODULES } from '../src/components/lens/registry.js';

function envWith<T>(data: T): ModuleEnvelope<T> {
  return {
    status: 'ok',
    demo: false,
    data,
    evidence: [],
    limitations: [],
    retrievedAt: '2026-07-16T10:00:00+02:00',
  };
}

const byKey = (key: string) => {
  const def = LENS_MODULES.find((m) => m.key === key);
  if (!def) throw new Error(`missing module ${key}`);
  return def;
};

describe('lens registry — tier partition & completeness (tiering decision 2026-07-19)', () => {
  it('covers exactly the 17 modules with unique keys', () => {
    expect(LENS_MODULES).toHaveLength(17);
    expect(new Set(LENS_MODULES.map((m) => m.key)).size).toBe(17);
  });

  it('partitions primary vs context exactly as decided', () => {
    const primary = LENS_MODULES.filter((m) => m.tier === 'primary').map((m) => m.key);
    const context = LENS_MODULES.filter((m) => m.tier === 'context').map((m) => m.key);
    expect(primary).toEqual([
      'weather',
      'warnings',
      'radar',
      'airStations',
      'pois',
      'fuel',
      'stationFacilities',
      'transit',
    ]);
    expect(context).toEqual([
      'civilWarnings',
      'climateNormals',
      'airModel',
      'pollen',
      'uv',
      'water',
      'radiation',
      'quakes',
      'autobahn',
    ]);
  });

  it('declares config gating with the exact env vars (GD-TRUTH-02)', () => {
    expect(byKey('fuel').configGated?.envVars).toEqual(['TANKERKOENIG_API_KEY']);
    expect(byKey('stationFacilities').configGated?.envVars).toEqual(['DB_CLIENT_ID', 'DB_API_KEY']);
    expect(byKey('airModel').configGated?.envVars).toEqual(['CAMS_ADS_KEY']);
  });

  it('every module has non-empty German title and inspector title', () => {
    for (const m of LENS_MODULES) {
      expect(m.title.length, m.key).toBeGreaterThan(0);
      expect(m.inspectorTitle.length, m.key).toBeGreaterThan(0);
    }
  });
});

describe('lens registry — noteworthy promotion predicates (auto-badge)', () => {
  it('NINA promotes only with published warnings', () => {
    const def = byKey('civilWarnings');
    expect(
      def.noteworthy?.(envWith({ ars: '072110000000', municipalityName: 'Trier', warnings: [] })),
    ).toBe(false);
    expect(
      def.noteworthy?.(
        envWith({
          ars: '072110000000',
          municipalityName: 'Trier',
          warnings: [
            {
              id: 'w1',
              headline: 'X',
              provider: 'MOWAS',
              severity: null,
              msgType: null,
              sentAt: null,
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it('Autobahn/quakes promote only with events', () => {
    expect(byKey('autobahn').noteworthy?.(envWith({ events: [], searchRadiusMeters: 30000 }))).toBe(
      false,
    );
    expect(
      byKey('autobahn').noteworthy?.(
        envWith({
          events: [
            {
              id: 'e1',
              kind: 'roadworks',
              roadId: 'A1',
              title: null,
              subtitle: null,
              coordinates: null,
              distanceMeters: 1200,
              startAt: null,
              mode: 'realtime',
            },
          ],
          searchRadiusMeters: 30000,
        }),
      ),
    ).toBe(true);
    expect(
      byKey('quakes').noteworthy?.(envWith({ events: [], searchRadiusKm: 200, windowDays: 90 })),
    ).toBe(false);
  });

  it('pollen promotes at index >= 2 including half-step strings ("2-3")', () => {
    const region = (today: string | null) =>
      envWith({
        state: 'Berlin',
        partregions: [
          {
            partregionId: 1,
            partregionName: null,
            regionName: 'Brandenburg und Berlin',
            values: [
              {
                allergen: 'Gräser',
                today,
                tomorrow: null,
                dayAfterTomorrow: null,
                mode: 'forecast',
              },
            ],
          },
        ],
        legend: {},
        lastUpdateRaw: null,
        nextUpdateRaw: null,
      });
    const def = byKey('pollen');
    expect(def.noteworthy?.(region('1'))).toBe(false);
    expect(def.noteworthy?.(region('2'))).toBe(true);
    expect(def.noteworthy?.(region('2-3'))).toBe(true);
    expect(def.noteworthy?.(region(null))).toBe(false);
  });

  it('UV promotes at forecast maximum >= 8 (sehr hoch)', () => {
    const uv = (value: number | null) =>
      envWith({
        cityName: 'Berlin',
        coordinates: { latitude: 52.52, longitude: 13.405 },
        distanceMeters: 1000,
        days: [{ validOn: '2026-07-16', value, mode: 'forecast' }],
      });
    expect(byKey('uv').noteworthy?.(uv(5))).toBe(false);
    expect(byKey('uv').noteworthy?.(uv(8))).toBe(true);
    expect(byKey('uv').noteworthy?.(uv(null))).toBe(false);
  });
});

describe('lens registry — collapsed summaries stay factual', () => {
  it('GEOFON summary states the honest empty catalogue with its window', () => {
    const def = byKey('quakes');
    expect(def.summary(envWith({ events: [], searchRadiusKm: 200, windowDays: 90 }))).toBe(
      'keine Katalogereignisse (200 km/90 d)',
    );
  });

  it('NINA summary counts published messages, never implies all-clear beyond the Kreis', () => {
    const def = byKey('civilWarnings');
    expect(
      def.summary(envWith({ ars: '072110000000', municipalityName: null, warnings: [] })),
    ).toBe('keine Meldungen für den Kreis');
  });

  it('summaries yield empty string without data (row shows pill only — nothing invented)', () => {
    for (const m of LENS_MODULES) {
      const env: ModuleEnvelope<unknown> = {
        status: 'unavailable',
        demo: false,
        data: null,
        evidence: [],
        limitations: [],
        retrievedAt: '2026-07-16T10:00:00+02:00',
      };
      expect(m.summary(env), m.key).toBe('');
    }
  });
});
