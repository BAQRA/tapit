import { insertTap, type TapOutcome } from "../db/taps";
import type { Env } from "../env";
import { sha256Hex } from "../lib/hash";
import { detectDevice, isNonHuman } from "../lib/user-agent";

/**
 * Saves one tap. Called via `waitUntil` after the redirect has been sent,
 * so it never slows the customer down.
 *
 * Not recorded: HEAD requests, link previews, crawlers and scripts.
 */
export async function recordTap(
  env: Env,
  request: Request,
  tap: { cardId: string; businessId: string | null; outcome: TapOutcome },
): Promise<void> {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (request.method === "HEAD" || isNonHuman(userAgent)) return;

  const now = Date.now();
  const cf = request.cf as IncomingRequestCfProperties | undefined;

  await insertTap(env.DB, {
    ...tap,
    timestamp: now,
    country: cf?.country ?? null,
    city: cf?.city ?? null,
    device: detectDevice(userAgent),
    userAgent,
    visitorId: await dailyVisitorId(request, env.IP_SALT ?? "", now),
  });
}

/**
 * A short hash of (salt, day, IP). Same person on the same day → same ID,
 * so we can count unique visitors; it changes every day and can't be reversed
 * to an IP, so it can't track anyone over time.
 */
async function dailyVisitorId(request: Request, salt: string, now: number): Promise<string | null> {
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip) return null;
  const day = new Date(now).toISOString().slice(0, 10);
  return (await sha256Hex(`${salt}|${day}|${ip}`)).slice(0, 16);
}
