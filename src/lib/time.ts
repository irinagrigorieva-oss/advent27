// Timezone-safe helpers using only Intl (no date library).

export function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const p: Record<string, number> = {};
  for (const x of parts) if (x.type !== 'literal') p[x.type] = Number(x.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** The UTC instant at which local midnight of `ymd` occurs in `tz` (DST-safe). */
export function zonedMidnightUtc(ymd: string, tz: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - tzOffsetMs(guess, tz);
  t = guess - tzOffsetMs(t, tz); // second pass fixes DST-boundary days
  return t;
}

/**
 * Calendar date (YYYY-MM-DD) of door `day` (1-based). With skipWeekends, Saturdays and
 * Sundays get no door: door 5 of a Tuesday start is the following Monday. Pure calendar
 * arithmetic on dates, so it does not depend on any timezone.
 */
export function dayYmd(startDate: string, day: number, skipWeekends: boolean): string {
  const [y, m, d] = startDate.split('-').map(Number);
  let t = Date.UTC(y, m - 1, d);
  let n = 0;
  for (;;) {
    const dow = new Date(t).getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (!skipWeekends || (dow !== 0 && dow !== 6)) {
      n++;
      if (n === day) break;
    }
    t += 86400000;
  }
  return new Date(t).toISOString().slice(0, 10);
}

/** UTC instant when door `day` unlocks (local midnight of its date in `tz`). */
export function dayUnlockAt(startDate: string, day: number, tz: string, skipWeekends = false): number {
  return zonedMidnightUtc(dayYmd(startDate, day, skipWeekends), tz);
}

export function formatInTz(ms: number, tz: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: tz, ...opts }).format(new Date(ms));
}
