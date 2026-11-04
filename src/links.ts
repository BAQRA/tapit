import type { Env } from "./env";

/**
 * Base URL used for every link we hand out (card URLs, owner dashboard links).
 *
 * Set PUBLIC_BASE_URL (e.g. "https://go.tapit.ge") once you own the domain;
 * until then links use whatever address the request came in on
 * (workers.dev in production, your Wi-Fi IP when testing locally).
 */
export function publicBaseUrl(env: Env, requestUrl: string): string {
  return (env.PUBLIC_BASE_URL || new URL(requestUrl).origin).replace(/\/+$/, "");
}

export const cardUrl = (baseUrl: string, cardId: string) => `${baseUrl}/t/${cardId}`;

export const ownerDashboardUrl = (baseUrl: string, token: string) => `${baseUrl}/b/${token}`;
