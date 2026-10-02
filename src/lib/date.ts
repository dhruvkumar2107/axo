/**
 * Date utilities.
 *
 * These helpers resolve the wedding date once, in a single place, so the
 * countdown, calendar downloads and printed copy all agree.
 */

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function monthIndexFromName(name: string): number {
  const idx = MONTHS.findIndex((m) => m.toLowerCase() === name.trim().toLowerCase());
  return idx === -1 ? 0 : idx;
}

export interface ResolvedYear {
  year: number;
  /** True when the year was inferred rather than supplied by the family. */
  assumed: boolean;
}

/**
 * Resolve the year to count down to.
 *
 * If the family has confirmed a year, it is always used verbatim. Otherwise we
 * take the next occurrence of the given day/month from `now`, which keeps the
 * countdown functional without ever asserting a year in printed copy.
 */
export function resolveYear(
  day: number,
  monthName: string,
  confirmedYear: number | null,
  assumeNextOccurrence: boolean,
  now: Date = new Date(),
): ResolvedYear | null {
  if (typeof confirmedYear === 'number' && Number.isFinite(confirmedYear)) {
    return { year: confirmedYear, assumed: false };
  }
  if (!assumeNextOccurrence) return null;

  const month = monthIndexFromName(monthName);
  const candidate = new Date(now.getFullYear(), month, day, 0, 0, 0, 0);
  // Start of today, so a wedding happening later today still counts down.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate.getTime() < today.getTime()) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return { year: candidate.getFullYear(), assumed: true };
}

export interface WeddingMoment {
  /** Full local datetime of the ceremony day (00:00 unless a time is set). */
  date: Date;
  year: number;
  assumed: boolean;
  /** ISO string, `YYYY-MM-DDTHH:mm:ss`. */
  iso: string;
}

/**
 * Build the ceremony moment from config-shaped input.
 *
 * `startsAt` (an ISO string with offset) wins when present — it carries an
 * exact time. Otherwise the day/month are used at local midnight, which is the
 * correct representation of an all-day celebration.
 */
export function resolveWeddingMoment(
  input: {
    day: number;
    month: string;
    year: number | null;
    assumeNextOccurrence: boolean;
    startsAt?: string | null;
  },
  now: Date = new Date(),
): WeddingMoment | null {
  if (input.startsAt) {
    const parsed = new Date(input.startsAt);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        date: parsed,
        year: parsed.getFullYear(),
        assumed: false,
        iso: toLocalISO(parsed),
      };
    }
  }

  const resolved = resolveYear(input.day, input.month, input.year, input.assumeNextOccurrence, now);
  if (!resolved) return null;

  const date = new Date(resolved.year, monthIndexFromName(input.month), input.day, 0, 0, 0, 0);
  return { date, year: resolved.year, assumed: resolved.assumed, iso: toLocalISO(date) };
}

/** `YYYY-MM-DDTHH:mm:ss` in local time — the format calendar files expect. */
export function toLocalISO(date: Date): string {
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${date.getDate()}` +
    `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
}

/** `YYYYMMDD` — used by iCalendar VALUE=DATE properties. */
export function toICSDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export interface CountdownParts {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the target moment has passed. */
  elapsed: boolean;
}

/** Fixed-width parts so the numbers do not reflow the layout every second. */
export function countdownFrom(target: Date, now: Date = new Date()): CountdownParts {
  const total = Math.max(0, target.getTime() - now.getTime());
  const seconds = Math.floor(total / 1000) % 60;
  const minutes = Math.floor(total / 60_000) % 60;
  const hours = Math.floor(total / 3_600_000) % 24;
  const days = Math.floor(total / 86_400_000);
  return { total, days, hours, minutes, seconds, elapsed: total === 0 };
}

/** Include the year only when it is confirmed. */
export function formatDateLabel(day: number, month: string, year: number | null = null): string {
  return `${day} ${month}${year === null ? '' : ` ${year}`}`;
}

/** `Thursday, 26 November 2026`. */
export function formatLongDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  return `${weekday}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
