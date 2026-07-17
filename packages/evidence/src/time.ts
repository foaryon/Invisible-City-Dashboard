/**
 * Time semantics helpers.
 *
 * Display timezone is Europe/Berlin (CET/CEST with DST).
 * Verified source peculiarity: the UBA JSON API returns timestamps in CET/MEZ
 * (UTC+1, WITHOUT daylight-saving shift). We normalize deliberately and keep
 * the original source string in Evidence (`sourceTimeRaw`).
 */

const BERLIN_TZ = 'Europe/Berlin';

/**
 * Convert a UBA timestamp string ("YYYY-MM-DD HH:mm:ss", CET/MEZ = fixed UTC+1)
 * to an ISO-8601 UTC instant.
 *
 * The UBA API uses hour values 1..24 where "24:00:00" denotes midnight at the
 * end of the given day.
 */
export function ubaCetToIso(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  let hour = Number(h);
  let dayOffsetMs = 0;
  if (hour === 24) {
    hour = 0;
    dayOffsetMs = 24 * 3600 * 1000;
  }
  if (hour > 24 || Number(mi) > 59 || Number(s) > 59) return null;
  // CET is UTC+1 fixed (no DST in the UBA API) → subtract one hour to get UTC.
  const utcMs =
    Date.UTC(Number(y), Number(mo) - 1, Number(d), hour, Number(mi), Number(s)) +
    dayOffsetMs -
    3600 * 1000;
  return new Date(utcMs).toISOString();
}

/** Format an ISO instant for display in Europe/Berlin (DST-correct). */
export function formatBerlin(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: BERLIN_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
    ...opts,
  }).format(date);
}

/** UTC offset (minutes) that Europe/Berlin has at a given instant (60 or 120). */
export function berlinUtcOffsetMinutes(iso: string): number {
  const date = new Date(iso);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: BERLIN_TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '00' : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Age in whole seconds between an ISO instant and now (or a reference instant). */
export function ageSeconds(iso: string, nowIso?: string): number | null {
  const then = new Date(iso).getTime();
  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.max(0, Math.round((now - then) / 1000));
}

/** Human-readable German age label ("vor 5 Min.", "vor 3 Std."). */
export function formatAgeGerman(seconds: number): string {
  if (seconds < 60) return 'vor weniger als 1 Min.';
  if (seconds < 3600) return `vor ${Math.round(seconds / 60)} Min.`;
  if (seconds < 86400) return `vor ${Math.round(seconds / 3600)} Std.`;
  return `vor ${Math.round(seconds / 86400)} Tagen`;
}
