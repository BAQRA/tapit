import { badRequest } from "./errors";

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

/**
 * Accepts either a full https URL or a bare Google Place ID.
 * A Place ID becomes Google's direct "write a review" link.
 */
export function normalizeReviewUrl(input: string): string {
  const value = input.trim();

  if (PLACE_ID_PATTERN.test(value)) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(value)}`;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw badRequest("reviewUrl must be a URL or a Google Place ID");
  }
  if (url.protocol !== "https:") throw badRequest("reviewUrl must use https");

  return url.toString();
}
