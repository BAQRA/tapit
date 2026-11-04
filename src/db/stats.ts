import type {
  BusinessStats,
  CardStats,
  DailyTaps,
  DashboardStats,
  DeviceTaps,
  HourlyTaps,
} from "../../shared/api";
import type { StatsPeriod } from "../lib/period";

export type { DashboardStats };

/**
 * All dashboard numbers in one D1 round trip.
 * Pass `businessId` to limit everything to one business, or null for all.
 *
 * Bound parameters (D1 rejects unused ones, so each query binds only what it uses):
 *   ?1 period start   ?2 business id or NULL                         — every query
 *   ?3 previous period start   ?4 local midnight today               — per-business query only
 */
export async function getDashboardStats(
  db: D1Database,
  period: StatsPeriod,
  businessId: string | null,
): Promise<DashboardStats> {
  // Converts a tap's UTC timestamp to the viewer's local time, for grouping by day/hour.
  // tzOffsetMinutes is a clamped integer (see resolvePeriod), so inlining it is safe.
  const localTime = `((ts / 1000) + ${period.tzOffsetMinutes * 60})`;
  const tapsInPeriod = `ts >= ?1 AND (?2 IS NULL OR business_id = ?2)`;
  const redirectsInPeriod = `${tapsInPeriod} AND outcome = 'redirect'`;

  const query = (sql: string) => db.prepare(sql).bind(period.start, businessId);
  const queryWithTrend = (sql: string) =>
    db.prepare(sql).bind(period.start, businessId, period.previousStart, period.todayStart);

  const [totals, daily, hourly, devices, businesses, cards] = await db.batch([
    query(`
      SELECT COALESCE(SUM(outcome = 'redirect'), 0)                                AS taps,
             COUNT(DISTINCT CASE WHEN outcome = 'redirect' THEN visitor END)      AS visitors,
             COALESCE(SUM(outcome != 'redirect'), 0)                               AS blocked_taps
        FROM taps WHERE ${tapsInPeriod}`),

    query(`
      SELECT date(${localTime}, 'unixepoch') AS day, COUNT(*) AS taps
        FROM taps WHERE ${redirectsInPeriod}
       GROUP BY day ORDER BY day`),

    query(`
      SELECT CAST(strftime('%H', ${localTime}, 'unixepoch') AS INTEGER) AS hour, COUNT(*) AS taps
        FROM taps WHERE ${redirectsInPeriod}
       GROUP BY hour ORDER BY hour`),

    query(`
      SELECT device, COUNT(*) AS taps
        FROM taps WHERE ${redirectsInPeriod}
       GROUP BY device ORDER BY taps DESC`),

    queryWithTrend(`
      WITH per_business AS (
        SELECT business_id,
               SUM(outcome = 'redirect' AND ts >= ?1)                       AS taps,
               SUM(outcome = 'redirect' AND ts <  ?1)                       AS previous_taps,
               SUM(outcome = 'redirect' AND ts >= ?4)                       AS taps_today,
               COUNT(DISTINCT CASE WHEN outcome = 'redirect' AND ts >= ?1 THEN visitor END) AS visitors,
               SUM(outcome = 'redirect' AND ts >= ?1 AND device = 'ios')     AS ios_taps,
               SUM(outcome = 'redirect' AND ts >= ?1 AND device = 'android') AS android_taps,
               SUM(outcome != 'redirect' AND ts >= ?1)                      AS blocked_taps
          FROM taps
         WHERE ts >= ?3 AND business_id IS NOT NULL
         GROUP BY business_id
      )
      SELECT b.id, b.name, b.active, b.review_url,
             (SELECT COUNT(*) FROM cards c WHERE c.business_id = b.id) AS card_count,
             COALESCE(p.taps, 0)          AS taps,
             COALESCE(p.previous_taps, 0) AS previous_taps,
             COALESCE(p.taps_today, 0)    AS taps_today,
             COALESCE(p.visitors, 0)      AS visitors,
             COALESCE(p.ios_taps, 0)      AS ios_taps,
             COALESCE(p.android_taps, 0)  AS android_taps,
             COALESCE(p.blocked_taps, 0)  AS blocked_taps,
             (SELECT MAX(ts) FROM taps t WHERE t.business_id = b.id AND t.outcome = 'redirect') AS last_tap_at
        FROM businesses b
        LEFT JOIN per_business p ON p.business_id = b.id
       WHERE ?2 IS NULL OR b.id = ?2
       ORDER BY taps DESC, b.name COLLATE NOCASE`),

    query(`
      SELECT c.id, c.label, c.active, c.business_id, b.name AS business_name,
             COUNT(t.id) AS taps, MAX(t.ts) AS last_tap_at
        FROM cards c
        LEFT JOIN businesses b ON b.id = c.business_id
        LEFT JOIN taps t ON t.card_id = c.id AND t.ts >= ?1 AND t.outcome = 'redirect'
       WHERE ?2 IS NULL OR c.business_id = ?2
       GROUP BY c.id
       ORDER BY taps DESC, c.created_at DESC`),
  ]);

  const totalsRow = totals?.results[0] as
    { taps: number; visitors: number; blocked_taps: number } | undefined;

  return {
    days: period.days,
    totals: {
      taps: totalsRow?.taps ?? 0,
      visitors: totalsRow?.visitors ?? 0,
      blockedTaps: totalsRow?.blocked_taps ?? 0,
    },
    daily: rows<DailyTaps>(daily),
    hourly: rows<HourlyTaps>(hourly),
    devices: rows<DeviceTaps>(devices),
    businesses: rows<BusinessStatsRow>(businesses).map(toBusinessStats),
    cards: rows<CardStatsRow>(cards).map(toCardStats),
  };
}

interface BusinessStatsRow {
  id: string;
  name: string;
  active: number;
  review_url: string;
  card_count: number;
  taps: number;
  previous_taps: number;
  taps_today: number;
  visitors: number;
  ios_taps: number;
  android_taps: number;
  blocked_taps: number;
  last_tap_at: number | null;
}

interface CardStatsRow {
  id: string;
  label: string | null;
  active: number;
  business_id: string | null;
  business_name: string | null;
  taps: number;
  last_tap_at: number | null;
}

const toBusinessStats = (row: BusinessStatsRow): BusinessStats => ({
  id: row.id,
  name: row.name,
  active: row.active === 1,
  reviewUrl: row.review_url,
  cardCount: row.card_count,
  taps: row.taps,
  previousTaps: row.previous_taps,
  tapsToday: row.taps_today,
  visitors: row.visitors,
  iosTaps: row.ios_taps,
  androidTaps: row.android_taps,
  blockedTaps: row.blocked_taps,
  lastTapAt: row.last_tap_at,
});

const toCardStats = (row: CardStatsRow): CardStats => ({
  id: row.id,
  label: row.label,
  active: row.active === 1,
  businessId: row.business_id,
  businessName: row.business_name,
  taps: row.taps,
  lastTapAt: row.last_tap_at,
});

function rows<Row>(result: D1Result | undefined): Row[] {
  return (result?.results ?? []) as Row[];
}
