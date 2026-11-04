import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { adminApi, ANDROID, countTaps, createBusinessWithCard, send, tap } from "../helpers";

describe("GET /t/:cardId", () => {
  it("redirects to the review page and records the tap", async () => {
    const { business, card } = await createBusinessWithCard();

    const response = await tap(card.id);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(business.reviewUrl);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const saved = await env.DB.prepare("SELECT * FROM taps").first<Record<string, unknown>>();
    expect(saved).toMatchObject({
      card_id: card.id,
      business_id: business.id,
      outcome: "redirect",
      device: "ios",
    });
    expect(saved?.visitor).toMatch(/^[0-9a-f]{16}$/);
  });

  it("accepts upper-case IDs and a trailing slash", async () => {
    const { card } = await createBusinessWithCard();
    const response = await send(`/t/${card.id.toUpperCase()}/`);
    expect(response.status).toBe(302);
  });

  it("shows 'not found' for unknown cards", async () => {
    const response = await tap("zzzzzzzz");
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Card not found");
  });

  it("shows 'not set up' for blank cards and counts it as blocked", async () => {
    const [blank] = await adminApi("POST", "/api/cards", {});

    const response = await tap(blank.id);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Almost ready");
    const saved = await env.DB.prepare("SELECT outcome FROM taps").first();
    expect(saved).toEqual({ outcome: "unassigned" });
  });

  it("shows 'inactive' when the business is paused", async () => {
    const { business, card } = await createBusinessWithCard();
    await adminApi("PATCH", `/api/businesses/${business.id}`, { active: false });

    const response = await tap(card.id);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Card inactive");
  });

  it("shows 'inactive' when the card is disabled", async () => {
    const { card } = await createBusinessWithCard();
    await adminApi("PATCH", `/api/cards/${card.id}`, { active: false });

    expect(await (await tap(card.id)).text()).toContain("Card inactive");
  });

  it("redirects link previews and bots without counting them", async () => {
    const { card } = await createBusinessWithCard();

    expect((await tap(card.id, "WhatsApp/2.23")).status).toBe(302);
    expect((await send(`/t/${card.id}`, { method: "HEAD", headers: { "user-agent": ANDROID } })).status).toBe(
      302,
    );
    expect(await countTaps()).toBe(0);
  });
});
