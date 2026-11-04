import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach } from "vitest";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// Every test starts with an empty database.
beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM taps"),
    env.DB.prepare("DELETE FROM cards"),
    env.DB.prepare("DELETE FROM businesses"),
  ]);
});
