import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireAdmin } from "../../middleware/admin-auth";
import { noStore } from "../../middleware/headers";
import { businessRoutes } from "./businesses";
import { cardRoutes } from "./cards";
import { statsRoutes } from "./stats";

/**
 * Everything behind the admin password:
 *   /admin/*  dashboard files from public/admin (wrangler.jsonc routes these through the Worker first)
 *   /api/*    JSON API used by the dashboard
 */
export const adminRoutes = new Hono<AppEnv>()
  .use("/admin/*", requireAdmin)
  .get("/admin/*", (c) => c.env.ASSETS.fetch(c.req.raw))

  .use("/api/*", requireAdmin, noStore)
  .route("/api/businesses", businessRoutes)
  .route("/api/cards", cardRoutes)
  .route("/api/stats", statsRoutes);
