import type { TapSeries } from "../../../shared/api";
import { DEVICE_LABELS } from "../lib/format";
import { dailySeries, hourlySeries } from "../lib/series";
import { BarChart } from "./BarChart";
import { BarList } from "./BarList";
import { Panel } from "./Panel";

interface TapChartsProps {
  stats: TapSeries;
  hourlyTitle?: string;
  devicesTitle?: string;
}

/** Taps per day, per hour of day, and per phone type. Used by both dashboards. */
export function TapCharts({ stats, hourlyTitle = "Hour of day", devicesTitle = "Device" }: TapChartsProps) {
  const daily = dailySeries(stats.daily, stats.days);
  const hourly = hourlySeries(stats.hourly);
  const devices = stats.devices.map((row) => ({
    label: DEVICE_LABELS[row.device] ?? row.device,
    value: row.taps,
  }));

  return (
    <>
      <Panel title="Taps per day">
        <BarChart {...daily} axis={[daily.labels[0] ?? "", daily.labels.at(-1) ?? ""]} />
      </Panel>

      <div className="grid">
        <Panel title={hourlyTitle}>
          <BarChart {...hourly} small axis={["00:00", "12:00", "23:00"]} />
        </Panel>
        <Panel title={devicesTitle}>
          <BarList rows={devices} />
        </Panel>
      </div>
    </>
  );
}
