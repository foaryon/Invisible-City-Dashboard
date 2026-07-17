import { describe, it, expect } from 'vitest';
import {
  ubaCetToIso,
  berlinUtcOffsetMinutes,
  berlinDateParts,
  formatBerlin,
  ageSeconds,
  formatAgeGerman,
} from '../src/time.js';

describe('ubaCetToIso — UBA timestamps are CET/MEZ (UTC+1, no DST)', () => {
  it('converts a winter timestamp (CET == Berlin local time)', () => {
    expect(ubaCetToIso('2026-01-15 12:00:00')).toBe('2026-01-15T11:00:00.000Z');
  });

  it('converts a summer timestamp — still UTC+1, NOT UTC+2', () => {
    // 2026-07-16 12:00 CET = 11:00 UTC = 13:00 Europe/Berlin (CEST).
    expect(ubaCetToIso('2026-07-16 12:00:00')).toBe('2026-07-16T11:00:00.000Z');
  });

  it('handles the UBA hour-24 convention (end-of-day midnight)', () => {
    expect(ubaCetToIso('2026-07-16 24:00:00')).toBe('2026-07-16T23:00:00.000Z');
  });

  it('rejects malformed input instead of guessing', () => {
    expect(ubaCetToIso('16.07.2026 12:00')).toBeNull();
    expect(ubaCetToIso('2026-07-16 25:00:00')).toBeNull();
    expect(ubaCetToIso('')).toBeNull();
  });
});

describe('Europe/Berlin display handling (DST-correct)', () => {
  it('is UTC+2 in summer and UTC+1 in winter', () => {
    expect(berlinUtcOffsetMinutes('2026-07-16T11:00:00.000Z')).toBe(120);
    expect(berlinUtcOffsetMinutes('2026-01-15T11:00:00.000Z')).toBe(60);
  });

  it('handles the DST spring-forward boundary (last Sunday of March 2026)', () => {
    expect(berlinUtcOffsetMinutes('2026-03-29T00:59:00.000Z')).toBe(60);
    expect(berlinUtcOffsetMinutes('2026-03-29T01:01:00.000Z')).toBe(120);
  });

  it('renders a summer UBA measurement at the correct Berlin wall-clock time', () => {
    const iso = ubaCetToIso('2026-07-16 12:00:00')!;
    expect(formatBerlin(iso, { dateStyle: undefined, timeStyle: 'short' })).toBe('13:00');
  });
});

describe('berlinDateParts (GTFS calendar/time queries)', () => {
  it('gives the local Berlin date and seconds-of-day in summer (CEST)', () => {
    // 2026-07-17 08:05 UTC → 10:05 Berlin.
    const parts = berlinDateParts('2026-07-17T08:05:00Z');
    expect(parts.yyyymmdd).toBe('20260717');
    expect(parts.secondsOfDay).toBe(10 * 3600 + 5 * 60);
  });

  it('rolls into the correct local date near midnight UTC', () => {
    // 2026-07-17 23:30 UTC → 2026-07-18 01:30 Berlin.
    const parts = berlinDateParts('2026-07-17T23:30:00Z');
    expect(parts.yyyymmdd).toBe('20260718');
    expect(parts.secondsOfDay).toBe(1 * 3600 + 30 * 60);
  });
});

describe('age helpers', () => {
  it('computes non-negative ages', () => {
    expect(ageSeconds('2026-07-16T10:00:00Z', '2026-07-16T10:05:00Z')).toBe(300);
    expect(ageSeconds('2026-07-16T10:05:00Z', '2026-07-16T10:00:00Z')).toBe(0);
    expect(ageSeconds('nonsense')).toBeNull();
  });

  it('formats German age labels', () => {
    expect(formatAgeGerman(30)).toBe('vor weniger als 1 Min.');
    expect(formatAgeGerman(300)).toBe('vor 5 Min.');
    expect(formatAgeGerman(7200)).toBe('vor 2 Std.');
  });
});
