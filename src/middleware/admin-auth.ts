import type { MiddlewareHandler } from "hono";
import { basicAuth } from "hono/basic-auth";
import type { AppEnv } from "../env";
import { HttpError } from "../lib/errors";

export const ADMIN_USERNAME = "admin";

/**
 * HTTP Basic auth for /admin and /api. The browser shows its own login prompt.
 * Fails closed: if ADMIN_PASSWORD isn't configured, nobody gets in.
 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const password = c.env.ADMIN_PASSWORD;
  if (!password) throw new HttpError(503, "ADMIN_PASSWORD is not configured");

  // `await` (not a bare return) so the 401 rejection is handled immediately,
  // instead of briefly looking like an unhandled promise rejection.
  return await basicAuth({ username: ADMIN_USERNAME, password, realm: "TapIT admin" })(c, next);
};
