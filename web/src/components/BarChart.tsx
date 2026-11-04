import type { ChartSeries } from "../lib/series";

interface BarChartProps extends ChartSeries {
  small?: boolean;
  /** Labels shown under the chart, spread evenly (e.g. first and last day). */
  axis: string[];
}

/** Vertical bars; the tallest bar fills the chart height. */
export function BarChart({ labels, values, small = false, axis }: BarChartProps) {
  const max = Math.max(1, ...values);
  return (
    <>
      <div className={small ? "bar-chart bar-chart--small" : "bar-chart"}>
        {values.map((value, index) => (
          <div
            key={labels[index]}
            style={{ height: `${(value / max) * 100}%` }}
            title={`${labels[index]}: ${value}`}
          />
        ))}
      </div>
      <div className="chart-axis">
        {axis.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </>
  );
}
