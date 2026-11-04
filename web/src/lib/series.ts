import type { DailyTaps, HourlyTaps } from "../../../shared/api";
import { lastLocalDays } from "./format";

export interface ChartSeries {
  labels: string[];
  values: number[];
}

/** API daily rows → one value per local day, with zero for days without taps. */
export function dailySeries(daily: DailyTaps[], days: number): ChartSeries {
  const tapsByDay = new Map(daily.map((row) => [row.day, row.taps]));
  const labels = lastLocalDays(days);
  return { labels, values: labels.map((day) => tapsByDay.get(day) ?? 0) };
}

/** API hourly rows → 24 values (00:00–23:00). */
export function hourlySeries(hourly: HourlyTaps[]): ChartSeries {
  const tapsByHour = new Map(hourly.map((row) => [row.hour, row.taps]));
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  return {
    labels: hours.map((hour) => `${String(hour).padStart(2, "0")}:00`),
    values: hours.map((hour) => tapsByHour.get(hour) ?? 0),
  };
}
