export type Device = "ios" | "android" | "other";

/** Link previews (messengers), crawlers and scripts: they follow the link but aren't real taps. */
const NON_HUMAN_PATTERN =
  /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|telegram|discord|curl\/|wget/i;

export function isNonHuman(userAgent: string): boolean {
  return NON_HUMAN_PATTERN.test(userAgent);
}

export function detectDevice(userAgent: string): Device {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  return "other";
}
