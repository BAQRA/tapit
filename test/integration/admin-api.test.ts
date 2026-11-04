import { describe, expect, it } from "vitest";
import { adminApi, ANDROID, countTaps, createBusinessWithCard, send, tap } from "../helpers";

describe("admin authentication", () => {
  it.each(["/api/stats", "/api/businesses", "/api/cards", "/admin", "/admin/"])(
    "requires the password for %s",
    async (path) => {
      const response = await send(path);
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toContain("Basic");
    },
  );

  it("rejects a wrong password", async () => {
    const response = await send("/api/stats", { headers: { authorization: `Basic ${btoa("admin:wrong")}` } });
    expect(response.status).toBe(401);
  });

  it("serves the dashboard after logging in", async () => {
    const response = await send("/admin/", { asAdmin: true });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("asset:/admin/");
  });
});

describe("/api/businesses", () => {
  it("creates a business from a Google Place ID", async () => {
    const business = await adminApi("POST", "/api/businesses", {
      name: "  Only Tasty ",
      reviewUrl: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    });
    expect(business).toMatchObject({
      name: "Only Tasty",
      reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
      active: true,
      ownerUrl: null,
    });
  });

  it("validates input", async () => {
    const response = await send("/api/businesses", {
      method: "POST",
      asAdmin: true,
      body: { name: "", reviewUrl: "http://insecure.example" },
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");

    const insecure = await adminApi("POST", "/api/businesses", { name: "X", reviewUrl: "http://x.ge" }, 400);
    expect(insecure.error).toMatch(/https/);

    const empty = await adminApi("PATCH", "/api/businesses/abc", {}, 400);
    expect(empty.error).toBe("Nothing to update");
  });

  it("renames a business everywhere it appears", async () => {
    const { business } = await createBusinessWithCard("Old Name");

    await adminApi("PATCH", `/api/businesses/${business.id}`, { name: "  New Name  " });

    const [listed] = await adminApi("GET", "/api/businesses");
    expect(listed).toMatchObject({ id: business.id, name: "New Name" });
    const [card] = await adminApi("GET", "/api/cards");
    expect(card.businessName).toBe("New Name");
    const stats = await adminApi("GET", "/api/stats");
    expect(stats.businesses[0].name).toBe("New Name");
  });

  it("refuses an empty business name", async () => {
    const { business } = await createBusinessWithCard("Keep Me");

    await adminApi("PATCH", `/api/businesses/${business.id}`, { name: "   " }, 400);

    const [listed] = await adminApi("GET", "/api/businesses");
    expect(listed.name).toBe("Keep Me");
  });

  it("returns 404 for unknown businesses", async () => {
    await adminApi("PATCH", "/api/businesses/nope", { active: false }, 404);
    await adminApi("DELETE", "/api/businesses/nope", undefined, 404);
  });

  it("deleting a business keeps its cards as blank stock by default", async () => {
    const { business, card } = await createBusinessWithCard();
    await tap(card.id);

    const result = await adminApi("DELETE", `/api/businesses/${business.id}`);

    expect(result).toEqual({ ok: true, cards: "unassign", affectedCards: 1 });
    expect(await countTaps()).toBe(0);
    const [stock] = await adminApi("GET", "/api/cards");
    expect(stock).toMatchObject({ id: card.id, businessId: null });
  });

  it("deleting a business with ?cards=delete removes its cards", async () => {
    const { business } = await createBusinessWithCard();
    await adminApi("DELETE", `/api/businesses/${business.id}?cards=delete`);
    expect(await adminApi("GET", "/api/cards")).toEqual([]);
  });
});

describe("/api/cards", () => {
  it("creates cards in bulk with tap URLs", async () => {
    const cards = await adminApi("POST", "/api/cards", { count: 3, label: "Table" });
    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({ businessId: null, label: "Table", active: true });
    expect(cards[0].url).toBe(`https://tapit.test/t/${cards[0].id}`);
  });

  it("assigns a blank card to a business", async () => {
    const { business } = await createBusinessWithCard();
    const [blank] = await adminApi("POST", "/api/cards", {});

    await adminApi("PATCH", `/api/cards/${blank.id}`, { businessId: business.id });

    expect((await tap(blank.id)).status).toBe(302);
  });

  it("sets, trims and clears a card label", async () => {
    const [card] = await adminApi("POST", "/api/cards", { label: "Old" });
    const labelOf = async () =>
      (await adminApi("GET", "/api/cards")).find((c: { id: string }) => c.id === card.id).label;

    await adminApi("PATCH", `/api/cards/${card.id}`, { label: "  Window  " });
    expect(await labelOf()).toBe("Window");

    await adminApi("PATCH", `/api/cards/${card.id}`, { label: "" });
    expect(await labelOf()).toBeNull();

    await adminApi("PATCH", `/api/cards/${card.id}`, { label: "x".repeat(101) }, 400);
  });

  it("rejects unknown businesses and too many cards", async () => {
    await adminApi("POST", "/api/cards", { businessId: "nope" }, 400);
    await adminApi("POST", "/api/cards", { count: 501 }, 400);
  });

  it("deletes a card and its taps", async () => {
    const { card } = await createBusinessWithCard();
    await tap(card.id);

    await adminApi("DELETE", `/api/cards/${card.id}`);

    expect(await countTaps()).toBe(0);
    expect((await tap(card.id)).status).toBe(404);
    await adminApi("DELETE", `/api/cards/${card.id}`, undefined, 404);
  });
});

describe("/api/stats", () => {
  it("counts taps per business, card and device", async () => {
    const { business, card } = await createBusinessWithCard("Bakery");
    await createBusinessWithCard("Quiet Shop");
    await tap(card.id);
    await tap(card.id);
    await tap(card.id, ANDROID, "198.51.100.1");

    const stats = await adminApi("GET", "/api/stats?days=7&tz=240");

    expect(stats.totals).toEqual({ taps: 3, visitors: 2, blockedTaps: 0 });
    expect(stats.devices).toEqual([
      { device: "ios", taps: 2 },
      { device: "android", taps: 1 },
    ]);
    expect(stats.businesses[0]).toMatchObject({
      id: business.id,
      taps: 3,
      tapsToday: 3,
      iosTaps: 2,
      androidTaps: 1,
      previousTaps: 0,
    });
    expect(stats.businesses[1]).toMatchObject({ name: "Quiet Shop", taps: 0, lastTapAt: null });
    expect(stats.cards.find((c: { id: string }) => c.id === card.id)).toMatchObject({ taps: 3 });
  });

  it("filters to one business", async () => {
    const { business } = await createBusinessWithCard("A");
    await createBusinessWithCard("B");

    const stats = await adminApi("GET", `/api/stats?business=${business.id}`);

    expect(stats.businesses).toHaveLength(1);
    expect(stats.businesses[0].id).toBe(business.id);
  });
});
