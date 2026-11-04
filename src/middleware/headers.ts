import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../env";

/** Data that changes on every tap must never be cached. */
export const noStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  c.res.headers.set("cache-control", "no-store");
};

/**
 * For pages whose URL is itself the secret (owner dashboards):
 * don't cache, don't leak the URL via Referer, don't let search engines index it.
 */
export const PRIVATE_PAGE_HEADERS = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
} as const;

/** Copies a response (e.g. from ASSETS, whose headers are immutable) with extra headers. */
export function withHeaders(response: Response, headers: Record<string, string>): Response {
  const copy = new Response(response.body, response);
  for (const [name, value] of Object.entries(headers)) copy.headers.set(name, value);
  return copy;
}
