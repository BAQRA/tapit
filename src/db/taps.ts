import type { Device } from "../lib/user-agent";

/**
 * - redirect:   sent to the Google review page (counts as a tap)
 * - inactive:   card or business is paused
 * - unassigned: blank card, not set up yet
 */
export type TapOutcome = "redirect" | "inactive" | "unassigned";

export interface NewTap {
  cardId: string;
  businessId: string | null;
  outcome: TapOutcome;
  timestamp: number;
  country: string | null;
  city: string | null;
  device: Device;
  userAgent: string;
  /** Daily-salted IP hash; counts unique visitors without storing IPs. */
  visitorId: string | null;
}

const MAX_USER_AGENT_LENGTH = 300;

export async function insertTap(db: D1Database, tap: NewTap): Promise<void> {
  await db
    .prepare(
      `INSERT INTO taps (card_id, business_id, ts, outcome, country, city, device, ua, visitor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      tap.cardId,
      tap.businessId,
      tap.timestamp,
      tap.outcome,
      tap.country,
      tap.city,
      tap.device,
      tap.userAgent.slice(0, MAX_USER_AGENT_LENGTH),
      tap.visitorId,
    )
    .run();
}
