import { timeAgo } from "../lib/format";

export function LastTap({ at }: { at: number | null }) {
  return <>{timeAgo(at) ?? <span className="text-muted">never</span>}</>;
}
