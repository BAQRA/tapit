import { Hono, type Context } from "hono";
import type { ApiError, OwnerStats } from "../../shared/api";
import { findBusinessIdByOwnerToken } from "../db/businesses";
import { getDashboardStats, type DashboardStats } from "../db/stats";
import type { AppEnv } from "../env";
import { isOwnerToken } from "../lib/ids";
import { resolvePeriod } from "../lib/period";
import { PRIVATE_PAGE_HEADERS, withHeaders } from "../middleware/headers";
import { MESSAGES, messageResponse } from "../views/message-page";

/**
 * Read-only dashboard for a business owner. The secret token in the URL is the
 * only credential, and it only ever unlocks that one business.
 *
 *   GET /b/:token        the dashboard page (web/owner/index.html)
 *   GET /b/:token/stats  that business's numbers as JSON
 */
export const ownerRoutes = new Hono<AppEnv>()
  .get("/b/:token", async (c) => {
    const businessId = await businessIdFromToken(c);
    if (!businessId) return messageResponse(c, MESSAGES.ownerLinkInvalid, 404);

    const page = await c.env.ASSETS.fetch(new URL("/owner/", c.req.url));
    return withHeaders(page, PRIVATE_PAGE_HEADERS);
  })

  .get("/b/:token/stats", async (c) => {
    const businessId = await businessIdFromToken(c);
    if (!businessId) {
      return c.json({ error: "Link not active" } satisfies ApiError, 404, PRIVATE_PAGE_HEADERS);
    }

    const period = resolvePeriod({ days: c.req.query("days"), tz: c.req.query("tz") });
    const stats = await getDashboardStats(c.env.DB, period, businessId);
    return c.json(toOwnerStats(stats), 200, PRIVATE_PAGE_HEADERS);
  });

async function businessIdFromToken(c: Context<AppEnv>): Promise<string | null> {
  const token = c.req.param("token") ?? "";
  return isOwnerToken(token) ? findBusinessIdByOwnerToken(c.env.DB, token) : null;
}

/** Only what an owner should see: their own business, no admin-only fields. */
function toOwnerStats(stats: DashboardStats): OwnerStats {
  const business = stats.businesses[0];
  if (!business) throw new Error("Owner stats requested for a business that doesn't exist");

  return {
    days: stats.days,
    business: {
      name: business.name,
      active: business.active,
      reviewUrl: business.reviewUrl,
      cardCount: business.cardCount,
      taps: business.taps,
      previousTaps: business.previousTaps,
      tapsToday: business.tapsToday,
      visitors: business.visitors,
      lastTapAt: business.lastTapAt,
    },
    totals: stats.totals,
    daily: stats.daily,
    hourly: stats.hourly,
    devices: stats.devices,
    cards: stats.cards.map(({ id, label, active, taps, lastTapAt }) => ({
      id,
      label,
      active,
      taps,
      lastTapAt,
    })),
  };
}
