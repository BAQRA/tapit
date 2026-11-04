import { Hono } from "hono";
import type { AdminStats } from "../../../shared/api";
import { getDashboardStats } from "../../db/stats";
import type { AppEnv } from "../../env";
import { resolvePeriod } from "../../lib/period";
import { cardUrl, publicBaseUrl } from "../../links";

/**
 * Mounted at /api/stats (admin only).
 *   ?days=30       period length (1–365)
 *   ?tz=240        viewer's UTC offset in minutes
 *   ?business=id   limit to one business
 */
export const statsRoutes = new Hono<AppEnv>().get("/", async (c) => {
  const period = resolvePeriod({ days: c.req.query("days"), tz: c.req.query("tz") });
  const stats = await getDashboardStats(c.env.DB, period, c.req.query("business") || null);

  const baseUrl = publicBaseUrl(c.env, c.req.url);
  return c.json({
    ...stats,
    cards: stats.cards.map((card) => ({ ...card, url: cardUrl(baseUrl, card.id) })),
  } satisfies AdminStats);
});
