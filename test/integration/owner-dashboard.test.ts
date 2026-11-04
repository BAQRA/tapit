import { describe, expect, it } from "vitest";
import { adminApi, createBusinessWithCard, send, tap } from "../helpers";

/** "/b/<token>" from a full owner URL. */
const pathOf = (ownerUrl: string) => new URL(ownerUrl).pathname;

describe("owner dashboard", () => {
  it("is off until an owner link is created", async () => {
    const { business } = await createBusinessWithCard();
    const [listed] = await adminApi("GET", "/api/businesses");
    expect(listed).toMatchObject({ id: business.id, ownerUrl: null });
    expect(listed).not.toHaveProperty("ownerToken");
  });

  it("serves the page and that business's stats without a password", async () => {
    const { business, card } = await createBusinessWithCard("Bakery");
    await tap(card.id);
    const { ownerUrl } = await adminApi("POST", `/api/businesses/${business.id}/owner-link`);

    const page = await send(pathOf(ownerUrl));
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("asset:/owner/");
    expect(page.headers.get("referrer-policy")).toBe("no-referrer");
    expect(page.headers.get("x-robots-tag")).toContain("noindex");

    const stats = await (await send(`${pathOf(ownerUrl)}/stats?days=30`)).json<any>();
    expect(stats.business).toMatchObject({ name: "Bakery", taps: 1, active: true });
    expect(stats.cards).toEqual([expect.objectContaining({ id: card.id, taps: 1 })]);
    expect(stats.cards[0]).not.toHaveProperty("businessId");
  });

  it("only ever shows the owner's own business", async () => {
    const { business } = await createBusinessWithCard("Mine");
    const other = await createBusinessWithCard("Someone else");
    const { ownerUrl } = await adminApi("POST", `/api/businesses/${business.id}/owner-link`);

    const stats = await (await send(`${pathOf(ownerUrl)}/stats?business=${other.business.id}`)).json<any>();

    expect(stats.business.name).toBe("Mine");
  });

  it("stops working after a reset or turning it off", async () => {
    const { business } = await createBusinessWithCard();
    const first = await adminApi("POST", `/api/businesses/${business.id}/owner-link`);
    const second = await adminApi("POST", `/api/businesses/${business.id}/owner-link`);

    expect((await send(pathOf(first.ownerUrl))).status).toBe(404);
    expect((await send(pathOf(second.ownerUrl))).status).toBe(200);

    await adminApi("DELETE", `/api/businesses/${business.id}/owner-link`);
    expect((await send(pathOf(second.ownerUrl))).status).toBe(404);
    expect((await send(`${pathOf(second.ownerUrl)}/stats`)).status).toBe(404);
  });

  it("rejects invalid tokens", async () => {
    expect((await send("/b/not-a-token")).status).toBe(404);
    expect((await send(`/b/${"a".repeat(32)}`)).status).toBe(404);
  });
});
