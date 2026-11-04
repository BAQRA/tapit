const DAY_MS = 86_400_000;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;
/** UTC offsets range from -12:00 to +14:00. */
const MAX_TZ_OFFSET_MINUTES = 14 * 60;

/** The time window a stats request covers, with all boundaries as unix ms. */
export interface StatsPeriod {
  days: number;
  /** Viewer's offset from UTC in minutes (e.g. +240 for Tbilisi), so days and hours match their clock. */
  tzOffsetMinutes: number;
  /** Start of the requested period. */
  start: number;
  /** Start of the equally long period before it (for the trend). */
  previousStart: number;
  /** Local midnight today. */
  todayStart: number;
}

export function resolvePeriod(query: { days?: string; tz?: string }, now: number = Date.now()): StatsPeriod {
  const days = clamp(Math.trunc(Number(query.days)) || DEFAULT_DAYS, 1, MAX_DAYS);
  const tzOffsetMinutes = clamp(
    Math.trunc(Number(query.tz)) || 0,
    -MAX_TZ_OFFSET_MINUTES,
    MAX_TZ_OFFSET_MINUTES,
  );
  const tzOffsetMs = tzOffsetMinutes * 60_000;
  const start = now - days * DAY_MS;

  return {
    days,
    tzOffsetMinutes,
    start,
    previousStart: start - days * DAY_MS,
    todayStart: Math.floor((now + tzOffsetMs) / DAY_MS) * DAY_MS - tzOffsetMs,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
