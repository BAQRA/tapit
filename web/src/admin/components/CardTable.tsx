import type { AdminStats, BusinessListItem } from "../../../../shared/api";
import { LastTap } from "../../components/LastTap";
import { Panel } from "../../components/Panel";
import { StatusPill } from "../../components/StatusPill";
import { formatNumber } from "../../lib/format";
import { adminApi } from "../api";
import { useAdminAction, useCopy } from "../queries";
import { BusinessSelect } from "./BusinessSelect";
import { EditableText } from "./EditableText";
import { LinkButton } from "./LinkButton";
import { RowActions } from "./RowActions";

interface CardTableProps {
  cards: AdminStats["cards"];
  businesses: BusinessListItem[];
}

export function CardTable({ cards, businesses }: CardTableProps) {
  const copy = useCopy();
  const assign = useAdminAction(
    (v: { id: string; businessId: string | null }) => adminApi.updateCard(v.id, { businessId: v.businessId }),
    { success: "Card reassigned" },
  );
  const setLabel = useAdminAction(
    (v: { id: string; label: string }) => adminApi.updateCard(v.id, { label: v.label || null }),
    { success: "Label saved" },
  );
  const setActive = useAdminAction((v: { id: string; active: boolean }) =>
    adminApi.updateCard(v.id, { active: v.active }),
  );
  const remove = useAdminAction(adminApi.deleteCard, { success: "Card deleted" });

  const confirmDelete = (cardId: string) => {
    const confirmed = window.confirm(
      `Delete card ${cardId} and all its taps?\n\n` +
        `A tag with this link will show "Card not found". This can't be undone.`,
    );
    if (confirmed) remove.mutate(cardId);
  };

  return (
    <Panel title="Cards">
      <div className="table-scroll">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Card</th>
              <th>Label</th>
              <th>Business</th>
              <th className="num">Taps</th>
              <th>Last tap</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted">
                  No cards yet
                </td>
              </tr>
            )}
            {cards.map((card) => (
              <tr key={card.id}>
                <td className="cell-title">
                  <code>{card.id}</code>
                </td>
                <td className="cell-wide" data-label="Label">
                  <EditableText
                    value={card.label}
                    label="Card label"
                    maxLength={100}
                    placeholder="e.g. Front desk"
                    onSave={(label) => setLabel.mutateAsync({ id: card.id, label })}
                  >
                    {card.label || <span className="text-muted">—</span>}
                  </EditableText>
                </td>
                <td className="cell-wide" data-label="Business">
                  <BusinessSelect
                    aria-label={`Business for card ${card.id}`}
                    businesses={businesses}
                    value={card.businessId}
                    emptyLabel="— unassigned —"
                    onChange={(businessId) => assign.mutate({ id: card.id, businessId })}
                  />
                </td>
                <td className="num" data-label="Taps">
                  {formatNumber(card.taps)}
                </td>
                <td data-label="Last tap">
                  <LastTap at={card.lastTapAt} />
                </td>
                <td className="cell-status">
                  <StatusPill active={card.active} off="disabled" />
                </td>
                <td className="cell-actions">
                  <RowActions>
                    <LinkButton onClick={() => copy(card.url)}>Copy URL</LinkButton>
                    <LinkButton onClick={() => setActive.mutate({ id: card.id, active: !card.active })}>
                      {card.active ? "Disable" : "Enable"}
                    </LinkButton>
                    <LinkButton danger onClick={() => confirmDelete(card.id)}>
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
