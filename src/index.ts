import { Hono } from "hono";
import type { AppEnv } from "./env";
import { handleError } from "./middleware/error-handler";
import { adminRoutes } from "./routes/admin";
import { ownerRoutes } from "./routes/owner";
import { tapRoutes } from "./routes/tap";

/**
 * TapIT Worker
 *
 *   /t/:cardId   public   NFC card → Google review page (+ records the tap)
 *   /b/:token    public   business owner's read-only dashboard (secret link)
 *   /admin       admin    your dashboard
 *   /api/*       admin    JSON API for the dashboard
 *   /health      public   uptime check
 *
 * Anything else is served from /public by Workers Static Assets.
 */
const app = new Hono<AppEnv>({ strict: false }) // "/t/abc/" behaves like "/t/abc"
  .get("/health", (c) => c.text("ok"))
  .route("/", tapRoutes)
  .route("/", ownerRoutes)
  .route("/", adminRoutes);

app.notFound((c) => c.text("Not found", 404));
app.onError(handleError);

export default app;
