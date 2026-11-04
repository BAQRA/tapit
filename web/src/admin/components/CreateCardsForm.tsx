import { useState, type FormEvent } from "react";
import type { BusinessListItem, CardListItem } from "../../../../shared/api";
import { adminApi } from "../api";
import { useAdminAction } from "../queries";
import { BusinessSelect } from "./BusinessSelect";

const MAX_CARDS = 500;

export function CreateCardsForm({ businesses }: { businesses: BusinessListItem[] }) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [count, setCount] = useState(1);
  const [created, setCreated] = useState<CardListItem[]>([]);

  const create = useAdminAction(adminApi.createCards, {
    success: (cards) => `${cards.length} card(s) created`,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({ businessId, label: label || null, count }, { onSuccess: setCreated });
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <h2 className="panel__title">Create cards</h2>
      <label>
        Assign to
        <BusinessSelect
          businesses={businesses}
          value={businessId}
          onChange={setBusinessId}
          emptyLabel="— Blank stock (assign later) —"
        />
      </label>
      <label>
        Label (optional)
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Front desk" />
      </label>
      <label>
        How many
        <input
          type="number"
          min={1}
          max={MAX_CARDS}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </label>
      <button className="button-primary" disabled={create.isPending}>
        Create
      </button>

      {created.length > 0 && (
        <pre className="created-links">
          {`URLs to write on the NFC tags:\n${created.map((card) => card.url).join("\n")}`}
        </pre>
      )}
    </form>
  );
}
