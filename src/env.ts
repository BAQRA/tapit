/**
 * Bindings available to the Worker, configured in wrangler.jsonc and secrets.
 * Merged into the global `Cloudflare.Env` so `import { env } from "cloudflare:workers"`
 * (used in tests) is typed the same way as the Worker's `env`.
 */
declare global {
  namespace Cloudflare {
    interface Env {
      /** D1 database with businesses, cards and taps. */
      DB: D1Database;
      /** Static files in /public (admin and owner dashboards). */
      ASSETS: Fetcher;
      /** Password for /admin and /api (username: "admin"). Secret. */
      ADMIN_PASSWORD: string;
      /** Salt for the daily visitor hash. Secret. */
      IP_SALT?: string;
      /** Base URL written on cards, e.g. "https://go.tapit.ge". Defaults to the request's origin. */
      PUBLIC_BASE_URL?: string;
    }
  }
}

export type Env = Cloudflare.Env;

/** Hono generic for every app and route module in this Worker. */
export interface AppEnv {
  Bindings: Env;
}
