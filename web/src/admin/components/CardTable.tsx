import type { AdminStats, BusinessListItem } from "../../../../shared/api";
import { LastTap } from "../../components/LastTap";
import { Panel } from "../../components/Panel";
import { StatusPill } from "../../components/StatusPill";
import { formatNumber } from "../../lib/format";
import { adminApi } from "../api";
import { useAdminAction, useCopy } from "../queries";
import { BusinessSelect } from "./BusinessSelect";
import { LinkButton } from "./LinkButton";

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
        <table>
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
                <td>
                  <code>{card.id}</code>
                </td>
                <td>{card.label || <span className="text-muted">—</span>}</td>
                <td>
                  <BusinessSelect
                    aria-label={`Business for card ${card.id}`}
                    businesses={businesses}
                    value={card.businessId}
                    emptyLabel="— unassigned —"
                    onChange={(businessId) => assign.mutate({ id: card.id, businessId })}
                  />
                </td>
                <td className="num">{formatNumber(card.taps)}</td>
                <td>
                  <LastTap at={card.lastTapAt} />
                </td>
                <td>
                  <StatusPill active={card.active} off="disabled" />
                </td>
                <td>
                  <LinkButton onClick={() => copy(card.url)}>Copy URL</LinkButton> ·{" "}
                  <LinkButton onClick={() => setActive.mutate({ id: card.id, active: !card.active })}>
                    {card.active ? "Disable" : "Enable"}
                  </LinkButton>{" "}
                  ·{" "}
                  <LinkButton danger onClick={() => confirmDelete(card.id)}>
                    Delete
                  </LinkButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
