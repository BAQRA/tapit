import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";
import { TEST_ADMIN_PASSWORD } from "./test/constants.ts";

/** Tests run inside the Workers runtime with a fresh local D1 database per test. */
export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
          IP_SALT: "test-salt",
          TEST_MIGRATIONS: await readD1Migrations("./migrations"),
        },
        serviceBindings: {
          // Stand-in for the built React pages, so tests don't need `vite build` first.
          // It answers with the path it was asked for, so tests can check which page the
          // Worker served (e.g. "/owner/" for an owner link).
          ASSETS: (request: Request) =>
            new Response(`<!doctype html><title>asset:${new URL(request.url).pathname}</title>`, {
              headers: { "content-type": "text/html; charset=utf-8" },
            }),
        },
      },
    })),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
  },
});
