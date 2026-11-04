import type { BusinessStats } from "../../../../shared/api";
import { LastTap } from "../../components/LastTap";
import { Panel } from "../../components/Panel";
import { StatusPill } from "../../components/StatusPill";
import { Trend } from "../../components/Trend";
import { formatNumber } from "../../lib/format";
import { useBusinessActions } from "../useBusinessActions";
import { EditableText } from "./EditableText";
import { LinkButton } from "./LinkButton";
import { RowActions } from "./RowActions";

interface BusinessTableProps {
  businesses: BusinessStats[];
  /** Owner links by business id (stats don't include them). */
  ownerUrls: ReadonlyMap<string, string | null>;
  days: number;
  onSelect: (businessId: string) => void;
}

export function BusinessTable({ businesses, ownerUrls, days, onSelect }: BusinessTableProps) {
  const actions = useBusinessActions();

  return (
    <Panel title="Businesses">
      <div className="table-scroll">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="num">Cards</th>
              <th className="num">Taps</th>
              <th className="num" title="Compared with the previous period of the same length">
                vs prev.
              </th>
              <th className="num">Today</th>
              <th className="num" title="Unique visitors (counted per day)">
                Visitors
              </th>
              <th className="num">Per day</th>
              <th className="num">iPhone / Android</th>
              <th className="num" title="Taps while the business or card was paused">
                Blocked
              </th>
              <th>Last tap</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 && (
              <tr>
                <td colSpan={12} className="text-muted">
                  No businesses yet
                </td>
              </tr>
            )}
            {businesses.map((business) => (
              <tr key={business.id}>
                <td className="cell-title">
                  <EditableText
                    value={business.name}
                    label="Business name"
                    required
                    maxLength={200}
                    onSave={(name) => actions.rename(business, name)}
                  >
                    <LinkButton title="Show stats for this business" onClick={() => onSelect(business.id)}>
                      {business.name}
                    </LinkButton>
                    <a
                      href={business.reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted"
                      title="Open review page"
                    >
                      ↗
                    </a>
                  </EditableText>
                </td>
                <td className="num" data-label="Cards">
                  {formatNumber(business.cardCount)}
                </td>
                <td className="num" data-label="Taps">
                  <strong>{formatNumber(business.taps)}</strong>
                </td>
                <td className="num" data-label="vs prev.">
                  <Trend current={business.taps} previous={business.previousTaps} />
                </td>
                <td className="num" data-label="Today">
                  {formatNumber(business.tapsToday)}
                </td>
                <td className="num" data-label="Visitors">
                  {formatNumber(business.visitors)}
                </td>
                <td className="num" data-label="Per day">
                  {(business.taps / days).toFixed(1)}
                </td>
                <td className="num" data-label="iPhone / Android">
                  {formatNumber(business.iosTaps)} / {formatNumber(business.androidTaps)}
                </td>
                <td className="num" data-label="Blocked">
                  <span className={business.blockedTaps ? "text-bad" : "text-muted"}>
                    {formatNumber(business.blockedTaps)}
                  </span>
                </td>
                <td data-label="Last tap">
                  <LastTap at={business.lastTapAt} />
                </td>
                <td className="cell-status">
                  <StatusPill active={business.active} />
                </td>
                <td className="cell-actions">
                  <RowActions>
                    <LinkButton onClick={() => actions.togglePaused(business)}>
                      {business.active ? "Pause" : "Resume"}
                    </LinkButton>
                    <LinkButton onClick={() => actions.changeReviewUrl(business)}>Change link</LinkButton>
                    <LinkButton
                      title="Copy the owner's dashboard link (creates one if needed)"
                      onClick={() => actions.copyOwnerLink(business.id, ownerUrls.get(business.id) ?? null)}
                    >
                      Owner link
                    </LinkButton>
                    <LinkButton danger onClick={() => actions.delete(business)}>
                      Delete
                    </LinkButton>
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
