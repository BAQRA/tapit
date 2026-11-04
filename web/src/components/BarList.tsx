import { formatNumber } from "../lib/format";

interface BarListProps {
  rows: { label: string; value: number }[];
  emptyText?: string;
}

/** Horizontal bars with a label and count per row. */
export function BarList({ rows, emptyText = "No taps yet" }: BarListProps) {
  if (rows.length === 0)
    return (
      <p className="text-muted" style={{ margin: 0 }}>
        {emptyText}
      </p>
    );

  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div>
      {rows.map((row) => (
        <div className="bar-list__row" key={row.label}>
          <span>{row.label}</span>
          <div className="bar-list__track">
            <div className="bar-list__fill" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <span className="num">{formatNumber(row.value)}</span>
        </div>
      ))}
    </div>
  );
}
