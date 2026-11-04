import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    interface Env {
      /** Provided by vitest.config.ts so test/setup.ts can create the tables. */
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

export {};
