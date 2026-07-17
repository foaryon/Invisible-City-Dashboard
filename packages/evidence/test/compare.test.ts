import { describe, it, expect } from 'vitest';
import { assessComparability } from '../src/compare.js';

const at = '2026-07-16T12:00:00Z';

describe('comparability rules (§2.2: never fuse incomparable inputs)', () => {
  it('accepts observed vs observed, same pollutant, same time context', () => {
    expect(
      assessComparability(
        { mode: 'observed', parameter: 'PM2', validAt: at },
        { mode: 'observed', parameter: 'PM2', validAt: '2026-07-16T11:30:00Z' },
      ),
    ).toEqual({ comparable: true });
  });

  it('rejects observed vs modelled (station value is not a grid value)', () => {
    const verdict = assessComparability(
      { mode: 'observed', parameter: 'PM2', validAt: at },
      { mode: 'modelled', parameter: 'PM2', validAt: at },
    );
    expect(verdict.comparable).toBe(false);
  });

  it('rejects different pollutants', () => {
    const verdict = assessComparability(
      { mode: 'observed', parameter: 'PM10', validAt: at },
      { mode: 'observed', parameter: 'NO2', validAt: at },
    );
    expect(verdict.comparable).toBe(false);
  });

  it('rejects diverging time contexts (>2 h skew)', () => {
    const verdict = assessComparability(
      { mode: 'observed', parameter: 'PM2', validAt: '2026-07-16T06:00:00Z' },
      { mode: 'observed', parameter: 'PM2', validAt: '2026-07-16T12:00:00Z' },
    );
    expect(verdict.comparable).toBe(false);
  });

  it('rejects missing time context instead of assuming simultaneity', () => {
    const verdict = assessComparability(
      { mode: 'observed', parameter: 'PM2', validAt: null },
      { mode: 'observed', parameter: 'PM2', validAt: at },
    );
    expect(verdict.comparable).toBe(false);
  });

  it('rejects demo and unavailable modes outright', () => {
    for (const mode of ['demo', 'unavailable'] as const) {
      const verdict = assessComparability(
        { mode, parameter: 'PM2', validAt: at },
        { mode, parameter: 'PM2', validAt: at },
      );
      expect(verdict.comparable).toBe(false);
    }
  });

  it('always provides a German reason when not comparable', () => {
    const verdict = assessComparability(
      { mode: 'observed', parameter: 'PM2', validAt: at },
      { mode: 'forecast', parameter: 'PM2', validAt: at },
    );
    expect(verdict.comparable).toBe(false);
    if (!verdict.comparable) expect(verdict.reasonDe.length).toBeGreaterThan(10);
  });
});
