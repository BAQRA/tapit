import { useEffect, useMemo, useState } from "react";
import type { AdminStats } from "../../../shared/api";
import { Kpi } from "../components/Kpi";
import { TapCharts } from "../components/TapCharts";
import { formatNumber, timezoneOffsetMinutes } from "../lib/format";
import { BusinessHeader } from "./components/BusinessHeader";
import { BusinessSelect } from "./components/BusinessSelect";
import { BusinessTable } from "./components/BusinessTable";
import { CardTable } from "./components/CardTable";
import { CreateBusinessForm } from "./components/CreateBusinessForm";
import { CreateCardsForm } from "./components/CreateCardsForm";
import { useAdminStats, useBusinesses } from "./queries";

const PERIODS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 365, label: "Last 365 days" },
];

export function AdminApp() {
  const [days, setDays] = useState(30);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const tz = useMemo(timezoneOffsetMinutes, []);

  const businessesQuery = useBusinesses();
  const statsQuery = useAdminStats({ days, tz, businessId: selectedBusinessId });

  const businesses = businessesQuery.data ?? [];
  const stats = statsQuery.data;
  const ownerUrls = useMemo(() => new Map(businesses.map((b) => [b.id, b.ownerUrl])), [businesses]);

  // If the selected business gets deleted, go back to "all businesses".
  useEffect(() => {
    if (selectedBusinessId && businessesQuery.data && !ownerUrls.has(selectedBusinessId)) {
      setSelectedBusinessId(null);
    }
  }, [selectedBusinessId, businessesQuery.data, ownerUrls]);

  const selectBusiness = (businessId: string | null) => {
    setSelectedBusinessId(businessId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedBusiness = selectedBusinessId
    ? stats?.businesses.find((b) => b.id === selectedBusinessId)
    : undefined;
  const error = statsQuery.error ?? businessesQuery.error;

  return (
    <>
      <header className="page-header sticky">
        <div className="page-header__inner">
          <h1 className="brand">TapIT</h1>
          <div className="toolbar">
            <BusinessSelect
              aria-label="Business"
              businesses={businesses}
              value={selectedBusinessId}
              onChange={selectBusiness}
              emptyLabel="All businesses"
            />
            <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {PERIODS.map((period) => (
                <option key={period.days} value={period.days}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="page-main container">
        {error && <div className="notice">Couldn't load data: {error.message}</div>}

        {selectedBusiness && (
          <BusinessHeader
            business={selectedBusiness}
            ownerUrl={ownerUrls.get(selectedBusiness.id) ?? null}
            days={days}
            onShowAll={() => selectBusiness(null)}
          />
        )}

        <OverviewKpis stats={stats} />

        {stats && (
          <>
            <TapCharts stats={stats} />
            <BusinessTable
              businesses={stats.businesses}
              ownerUrls={ownerUrls}
              days={days}
              onSelect={selectBusiness}
            />
            <CardTable cards={stats.cards} businesses={businesses} />
          </>
        )}

        <div className="grid">
          <CreateBusinessForm />
          <CreateCardsForm businesses={businesses} />
        </div>
      </main>
    </>
  );
}

function OverviewKpis({ stats }: { stats: AdminStats | undefined }) {
  const value = (n: number | undefined) => (n === undefined ? "–" : formatNumber(n));
  const tappedCards = stats?.cards.filter((card) => card.taps > 0).length;

  return (
    <section className="kpis">
      <Kpi value={value(stats?.totals.taps)} label="Taps → Google" />
      <Kpi value={value(stats?.totals.visitors)} label="Unique visitors (per day)" />
      <Kpi
        value={stats ? `${formatNumber(tappedCards)} / ${formatNumber(stats.cards.length)}` : "–"}
        label="Cards tapped at least once"
      />
      <Kpi value={value(stats?.totals.blockedTaps)} label="Taps on inactive / blank cards" />
    </section>
  );
}
