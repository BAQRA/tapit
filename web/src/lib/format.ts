// Formatting helpers shared by both dashboards.

const DAY_MS = 86_400_000;

export const DEVICE_LABELS: Record<string, string> = { ios: "iPhone", android: "Android", other: "Other" };

export const formatNumber = (value: number | null | undefined): string => Number(value ?? 0).toLocaleString();

/** "just now", "5m ago", "3h ago", "2d ago" — or null if it never happened. */
export function timeAgo(timestamp: number | null, now: number = Date.now()): string | null {
  if (!timestamp) return null;
  const seconds = (now - timestamp) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/** Percentage change vs the previous period, or null when there's nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** The viewer's UTC offset in minutes, as the API expects (e.g. 240 for Tbilisi). */
export const timezoneOffsetMinutes = (): number => -new Date().getTimezoneOffset();

/** "YYYY-MM-DD" for each of the last `days` local days, oldest first. */
export function lastLocalDays(days: number, now: number = Date.now()): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now - (days - 1 - index) * DAY_MS);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  });
}
