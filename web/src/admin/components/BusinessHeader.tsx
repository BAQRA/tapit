import type { BusinessStats } from "../../../../shared/api";
import { StatusPill } from "../../components/StatusPill";
import { Trend } from "../../components/Trend";
import { formatNumber } from "../../lib/format";
import { useCopy } from "../queries";
import { useBusinessActions } from "../useBusinessActions";
import { LinkButton } from "./LinkButton";

interface BusinessHeaderProps {
  business: BusinessStats;
  ownerUrl: string | null;
  days: number;
  onShowAll: () => void;
}

/** Highlighted summary shown above the stats when one business is selected. */
export function BusinessHeader({ business, ownerUrl, days, onShowAll }: BusinessHeaderProps) {
  const actions = useBusinessActions();
  const copy = useCopy();

  return (
    <section className="panel business-header">
      <div>
        <div className="business-header__title">
          {business.name} <StatusPill active={business.active} />
        </div>
        <div className="text-muted">
          {formatNumber(business.cardCount)} card(s) · {formatNumber(business.tapsToday)} tap(s) today ·{" "}
          <Trend current={business.taps} previous={business.previousTaps} /> vs previous {days} days
        </div>
      </div>

      <div className="toolbar">
        <a href={business.reviewUrl} target="_blank" rel="noopener noreferrer">
          Open review page ↗
        </a>
        <button type="button" onClick={onShowAll}>
          ← All businesses
        </button>
      </div>

      <div className="business-header__owner">
        <strong>Owner dashboard:</strong>{" "}
        {ownerUrl ? (
          <>
            <code>{ownerUrl}</code>
            <br />
            <LinkButton onClick={() => copy(ownerUrl)}>Copy link</LinkButton> ·{" "}
            <a href={ownerUrl} target="_blank" rel="noopener noreferrer">
              Open
            </a>{" "}
            · <LinkButton onClick={() => actions.resetOwnerLink(business.id)}>Reset link</LinkButton> ·{" "}
            <LinkButton danger onClick={() => actions.turnOffOwnerLink(business.id)}>
              Turn off
            </LinkButton>
          </>
        ) : (
          <>
            <span className="text-muted">not shared</span> ·{" "}
            <LinkButton onClick={() => actions.createOwnerLink(business.id)}>
              Create a link for the owner
            </LinkButton>
          </>
        )}
      </div>
    </section>
  );
}
