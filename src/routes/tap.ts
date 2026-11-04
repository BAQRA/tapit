import { Hono } from "hono";
import { findCardDestination, type CardDestination } from "../db/cards";
import type { TapOutcome } from "../db/taps";
import type { AppEnv } from "../env";
import { isCardId } from "../lib/ids";
import { recordTap } from "../services/tap-recorder";
import { MESSAGES, messageResponse } from "../views/message-page";

/**
 * GET /t/:cardId — the URL written on every NFC card.
 * Redirects straight to the business's Google review page and records the tap afterwards.
 */
export const tapRoutes = new Hono<AppEnv>().get("/t/:cardId", async (c) => {
  const cardId = c.req.param("cardId").toLowerCase();
  const destination = isCardId(cardId) ? await findCardDestination(c.env.DB, cardId) : null;
  if (!destination) return messageResponse(c, MESSAGES.cardNotFound, 404);

  const decision = decide(destination);

  c.executionCtx.waitUntil(
    recordTap(c.env, c.req.raw, {
      cardId: destination.cardId,
      businessId: destination.businessId,
      outcome: decision.outcome,
    }).catch((error: unknown) => console.error("Failed to record tap", error)),
  );

  switch (decision.outcome) {
    case "unassigned":
      return messageResponse(c, MESSAGES.cardNotSetUp);
    case "inactive":
      return messageResponse(c, MESSAGES.cardInactive);
    case "redirect":
      // no-store: every tap must reach the Worker so it gets counted.
      c.header("cache-control", "no-store");
      c.header("referrer-policy", "no-referrer");
      return c.redirect(decision.reviewUrl, 302);
  }
});

type TapDecision =
  | { outcome: Extract<TapOutcome, "redirect">; reviewUrl: string }
  | { outcome: Exclude<TapOutcome, "redirect"> };

function decide(destination: CardDestination): TapDecision {
  if (!destination.businessId || !destination.reviewUrl) return { outcome: "unassigned" };
  if (!destination.cardActive || !destination.businessActive) return { outcome: "inactive" };
  return { outcome: "redirect", reviewUrl: destination.reviewUrl };
}
