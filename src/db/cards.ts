import { newCardId } from "../lib/ids";
import { buildAssignments, toFlag } from "./sql";

export interface Card {
  id: string;
  /** null = blank stock, not sold/assigned yet. */
  businessId: string | null;
  businessName: string | null;
  label: string | null;
  active: boolean;
  createdAt: number;
}

export interface CardChanges {
  label?: string | null;
  active?: boolean;
  businessId?: string | null;
}

/** Everything the tap route needs to decide where a card should go. */
export interface CardDestination {
  cardId: string;
  cardActive: boolean;
  businessId: string | null;
  businessActive: boolean;
  reviewUrl: string | null;
}

interface CardRow {
  id: string;
  business_id: string | null;
  business_name: string | null;
  label: string | null;
  active: number;
  created_at: number;
}

const toCard = (row: CardRow): Card => ({
  id: row.id,
  businessId: row.business_id,
  businessName: row.business_name,
  label: row.label,
  active: row.active === 1,
  createdAt: row.created_at,
});

export async function listCards(db: D1Database): Promise<Card[]> {
  const { results } = await db
    .prepare(
      `SELECT c.*, b.name AS business_name
         FROM cards c LEFT JOIN businesses b ON b.id = c.business_id
        ORDER BY c.created_at DESC`,
    )
    .all<CardRow>();
  return results.map(toCard);
}

export async function createCards(
  db: D1Database,
  input: { businessId: string | null; label: string | null; count: number },
): Promise<Card[]> {
  const createdAt = Date.now();
  const cards: Card[] = Array.from({ length: input.count }, () => ({
    id: newCardId(),
    businessId: input.businessId,
    businessName: null,
    label: input.label,
    active: true,
    createdAt,
  }));

  const insert = db.prepare(
    `INSERT INTO cards (id, business_id, label, active, created_at) VALUES (?, ?, ?, 1, ?)`,
  );
  await db.batch(cards.map((card) => insert.bind(card.id, card.businessId, card.label, createdAt)));
  return cards;
}

/** @returns false if the card doesn't exist. */
export async function updateCard(db: D1Database, id: string, changes: CardChanges): Promise<boolean> {
  const { sql, params } = buildAssignments(
    { label: "label", active: "active", businessId: "business_id" },
    { ...changes, active: changes.active === undefined ? undefined : toFlag(changes.active) },
  );
  const result = await db
    .prepare(`UPDATE cards SET ${sql} WHERE id = ?`)
    .bind(...params, id)
    .run();
  return result.meta.changes > 0;
}

/** Deletes a card and its tap history. @returns false if the card doesn't exist. */
export async function deleteCard(db: D1Database, id: string): Promise<boolean> {
  const [, cardResult] = await db.batch([
    db.prepare(`DELETE FROM taps WHERE card_id = ?`).bind(id),
    db.prepare(`DELETE FROM cards WHERE id = ?`).bind(id),
  ]);
  return (cardResult?.meta.changes ?? 0) > 0;
}

export async function findCardDestination(db: D1Database, cardId: string): Promise<CardDestination | null> {
  const row = await db
    .prepare(
      `SELECT c.id, c.active AS card_active, c.business_id,
              b.review_url, b.active AS business_active
         FROM cards c LEFT JOIN businesses b ON b.id = c.business_id
        WHERE c.id = ?`,
    )
    .bind(cardId)
    .first<{
      id: string;
      card_active: number;
      business_id: string | null;
      review_url: string | null;
      business_active: number | null;
    }>();

  if (!row) return null;
  return {
    cardId: row.id,
    cardActive: row.card_active === 1,
    businessId: row.business_id,
    businessActive: row.business_active === 1,
    reviewUrl: row.review_url,
  };
}
