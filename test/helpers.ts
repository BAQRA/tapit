import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import app from "../src/index";
import { TEST_ADMIN_PASSWORD } from "./constants";

export const BASE_URL = "https://tapit.test";
export const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)";
export const ANDROID = "Mozilla/5.0 (Linux; Android 15)";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Send the admin login. */
  asAdmin?: boolean;
}

/**
 * Sends a request to the Worker and waits for its background work (tap recording)
 * to finish, so tests can check the database right after.
 */
export async function send(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.asAdmin) headers.set("authorization", `Basic ${btoa(`admin:${TEST_ADMIN_PASSWORD}`)}`);
  if (options.body !== undefined) headers.set("content-type", "application/json");

  const request = new Request(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: "manual",
  });

  const ctx = createExecutionContext();
  const response = await app.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

/** Calls the admin API and returns the parsed JSON, failing loudly on unexpected status. */
export async function adminApi<T = any>(
  method: string,
  path: string,
  body?: unknown,
  expectedStatus = method === "POST" ? 201 : 200,
): Promise<T> {
  const response = await send(path, { method, body, asAdmin: true });
  const data = await response.json();
  if (response.status !== expectedStatus) {
    throw new Error(`${method} ${path} → ${response.status} ${JSON.stringify(data)}`);
  }
  return data as T;
}

/** Taps a card like a phone would. */
export const tap = (cardId: string, userAgent = IPHONE, ip = "203.0.113.7") =>
  send(`/t/${cardId}`, { headers: { "user-agent": userAgent, "cf-connecting-ip": ip } });

/** A business with one card, ready to tap. */
export async function createBusinessWithCard(name = "Test Cafe") {
  const business = await adminApi("POST", "/api/businesses", {
    name,
    reviewUrl: "https://example.com/review",
  });
  const [card] = await adminApi("POST", "/api/cards", { businessId: business.id, label: "Counter" });
  return { business, card };
}

export async function countTaps(): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM taps").first<{ n: number }>();
  return row?.n ?? 0;
}
