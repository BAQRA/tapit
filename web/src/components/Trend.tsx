import { percentChange } from "../lib/format";

/** ▲ 12% / ▼ 5% vs the previous period; "new" if there was nothing before. */
export function Trend({ current, previous }: { current: number; previous: number }) {
  const change = percentChange(current, previous);

  if (change === null) {
    return current ? <span className="text-good">new</span> : <span className="text-muted">—</span>;
  }
  if (change === 0) return <span className="text-muted">0%</span>;
  return change > 0 ? (
    <span className="text-good">▲ {change}%</span>
  ) : (
    <span className="text-bad">▼ {-change}%</span>
  );
}
