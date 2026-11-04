import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { OwnerStats } from "../../../shared/api";
import { Kpi } from "../components/Kpi";
import { LastTap } from "../components/LastTap";
import { Panel } from "../components/Panel";
import { TapCharts } from "../components/TapCharts";
import { formatNumber, percentChange, timezoneOffsetMinutes } from "../lib/format";
import { requestJson } from "../lib/http";

const AUTO_REFRESH_MS = 60_000;

const PERIODS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 365, label: "Last 12 months" },
];

/** This page lives at /b/<token>; its data at /b/<token>/stats. */
const dashboardPath = location.pathname.replace(/\/+$/, "");

export function OwnerApp() {
  const [days, setDays] = useState(30);
  const tz = useMemo(timezoneOffsetMinutes, []);

  const { data: stats, isError } = useQuery({
    queryKey: ["owner-stats", days, tz],
    queryFn: () => requestJson<OwnerStats>(`${dashboardPath}/stats?days=${days}&tz=${tz}`),
    refetchInterval: AUTO_REFRESH_MS,
    placeholderData: keepPreviousData,
    retry: false,
  });

  useEffect(() => {
    if (stats) document.title = `${stats.business.name} · TapIT`;
  }, [stats]);

  return (
    <>
      <header className="page-header">
        <div className="page-header__inner container">
          <div>
            <div className="brand">TapIT</div>
            <h1 className="business-name">
              {isError ? "This link is no longer active" : (stats?.business.name ?? "Loading…")}
            </h1>
          </div>
          <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIODS.map((period) => (
              <option key={period.days} value={period.days}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {stats && <OwnerDashboard stats={stats} />}

      <footer className="page-footer">
        NFC review cards by{" "}
        <a href="https://tapit.ge" rel="noreferrer">
          TapIT.ge
        </a>
      </footer>
    </>
  );
}

function OwnerDashboard({ stats }: { stats: OwnerStats }) {
  const { business } = stats;
  const change = percentChange(business.taps, business.previousTaps);

  return (
    <main className="page-main container">
      {!business.active && (
        <div className="notice">
          <strong>Your TapIT cards are paused.</strong> Customers who tap them are not reaching your Google
          review page. Please contact TapIT to turn them back on.
        </div>
      )}

      <section className="kpis">
        <Kpi value={formatNumber(business.taps)} label="Customers sent to your review page" />
        <Kpi
          value={change === null ? "–" : `${change > 0 ? "▲ " : change < 0 ? "▼ " : ""}${Math.abs(change)}%`}
          valueClassName={
            change === null || change === 0 ? "text-muted" : change > 0 ? "text-good" : "text-bad"
          }
          label={`Compared with the ${stats.days} days before`}
        />
        <Kpi value={formatNumber(business.tapsToday)} label="Today" />
        <Kpi value={formatNumber(business.visitors)} label="Different people" />
      </section>

      <TapCharts stats={stats} hourlyTitle="Busiest hours" devicesTitle="Phones" />

      <Panel title="Your cards">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Card</th>
                <th className="num">Taps</th>
                <th>Last tap</th>
              </tr>
            </thead>
            <tbody>
              {stats.cards.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted">
                    No cards yet
                  </td>
                </tr>
              )}
              {stats.cards.map((card, index) => (
                <tr key={card.id}>
                  <td>
                    {card.label || `Card ${index + 1}`}{" "}
                    {!card.active && <span className="text-bad">(off)</span>}
                  </td>
                  <td className="num">{formatNumber(card.taps)}</td>
                  <td>
                    <LastTap at={card.lastTapAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="footnote">
        A tap means a customer opened your review page. Not everyone who opens it leaves a review.{" "}
        <a href={business.reviewUrl} target="_blank" rel="noopener noreferrer">
          Open your review page ↗
        </a>
      </p>
    </main>
  );
}
