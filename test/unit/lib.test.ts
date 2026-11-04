import { describe, expect, it } from "vitest";
import { HttpError } from "../../src/lib/errors";
import {
  CARD_ID_LENGTH,
  isCardId,
  isOwnerToken,
  newCardId,
  newOwnerToken,
  randomId,
} from "../../src/lib/ids";
import { resolvePeriod } from "../../src/lib/period";
import { normalizeReviewUrl } from "../../src/lib/review-url";
import { detectDevice, isNonHuman } from "../../src/lib/user-agent";

describe("ids", () => {
  it("generates readable ids without ambiguous characters", () => {
    const id = randomId(500);
    expect(id).toHaveLength(500);
    expect(id).toMatch(/^[23456789abcdefghjkmnpqrstuvwxyz]+$/);
  });

  it("generates valid card ids and owner tokens", () => {
    expect(newCardId()).toHaveLength(CARD_ID_LENGTH);
    expect(isCardId(newCardId())).toBe(true);
    expect(isOwnerToken(newOwnerToken())).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isCardId("ab")).toBe(false);
    expect(isCardId("../admin")).toBe(false);
    expect(isOwnerToken("short")).toBe(false);
  });
});

describe("normalizeReviewUrl", () => {
  it("turns a Google Place ID into a direct review link", () => {
    expect(normalizeReviewUrl(" ChIJN1t_tDeuEmsRUsoyG83frY4 ")).toBe(
      "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    );
  });

  it("keeps https links", () => {
    expect(normalizeReviewUrl("https://g.page/r/abc/review")).toBe("https://g.page/r/abc/review");
  });

  it.each(["http://example.com", "not a url", "javascript:alert(1)"])("rejects %s", (input) => {
    expect(() => normalizeReviewUrl(input)).toThrow(HttpError);
  });
});

describe("user agent", () => {
  it("detects the phone type", () => {
    expect(detectDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)")).toBe("ios");
    expect(detectDevice("Mozilla/5.0 (Linux; Android 15)")).toBe("android");
    expect(detectDevice("Mozilla/5.0 (Macintosh)")).toBe("other");
  });

  it("recognizes link previews and bots", () => {
    expect(isNonHuman("WhatsApp/2.23")).toBe(true);
    expect(isNonHuman("TelegramBot (like TwitterBot)")).toBe(true);
    expect(isNonHuman("curl/8.0")).toBe(true);
    expect(isNonHuman("Mozilla/5.0 (iPhone)")).toBe(false);
  });
});

describe("resolvePeriod", () => {
  const now = Date.UTC(2026, 10, 5, 12, 0); // 5 Nov 2026, 12:00 UTC

  it("defaults to 30 days in UTC", () => {
    const period = resolvePeriod({}, now);
    expect(period.days).toBe(30);
    expect(period.start).toBe(now - 30 * 86_400_000);
    expect(period.previousStart).toBe(now - 60 * 86_400_000);
  });

  it("clamps out-of-range input", () => {
    expect(resolvePeriod({ days: "9999", tz: "99999" }, now)).toMatchObject({
      days: 365,
      tzOffsetMinutes: 840,
    });
    expect(resolvePeriod({ days: "-5", tz: "abc" }, now)).toMatchObject({ days: 1, tzOffsetMinutes: 0 });
  });

  it("computes local midnight for the viewer's timezone", () => {
    // Tbilisi (UTC+4): 12:00 UTC is 16:00 local, so local midnight is 20:00 UTC the day before.
    expect(resolvePeriod({ tz: "240" }, now).todayStart).toBe(Date.UTC(2026, 10, 4, 20, 0));
  });
});
