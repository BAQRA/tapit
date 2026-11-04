import { newBusinessId } from "../lib/ids";
import { buildAssignments, toFlag } from "./sql";

export interface Business {
  id: string;
  name: string;
  reviewUrl: string;
  /** false = paused: cards show "Card inactive" instead of redirecting. */
  active: boolean;
  createdAt: number;
  cardCount: number;
  /** Secret for the owner's read-only dashboard; null = no owner access. */
  ownerToken: string | null;
}

export interface BusinessChanges {
  name?: string;
  reviewUrl?: string;
  active?: boolean;
}

/** What happens to a business's cards when it is deleted. */
export type CardsOnDelete = "delete" | "unassign";

interface BusinessRow {
  id: string;
  name: string;
  review_url: string;
  active: number;
  created_at: number;
  card_count: number;
  owner_token: string | null;
}

const toBusiness = (row: BusinessRow): Business => ({
  id: row.id,
  name: row.name,
  reviewUrl: row.review_url,
  active: row.active === 1,
  createdAt: row.created_at,
  cardCount: row.card_count,
  ownerToken: row.owner_token,
});

export async function listBusinesses(db: D1Database): Promise<Business[]> {
  const { results } = await db
    .prepare(
      `SELECT b.*, (SELECT COUNT(*) FROM cards c WHERE c.business_id = b.id) AS card_count
         FROM businesses b
        ORDER BY b.name COLLATE NOCASE`,
    )
    .all<BusinessRow>();
  return results.map(toBusiness);
}

export async function businessExists(db: D1Database, id: string): Promise<boolean> {
  return (await db.prepare(`SELECT 1 FROM businesses WHERE id = ?`).bind(id).first()) !== null;
}

export async function createBusiness(
  db: D1Database,
  input: { name: string; reviewUrl: string },
): Promise<Business> {
  const business: Business = {
    id: newBusinessId(),
    name: input.name,
    reviewUrl: input.reviewUrl,
    active: true,
    createdAt: Date.now(),
    cardCount: 0,
    ownerToken: null,
  };
  await db
    .prepare(`INSERT INTO businesses (id, name, review_url, active, created_at) VALUES (?, ?, ?, 1, ?)`)
    .bind(business.id, business.name, business.reviewUrl, business.createdAt)
    .run();
  return business;
}

/** @returns false if the business doesn't exist. */
export async function updateBusiness(db: D1Database, id: string, changes: BusinessChanges): Promise<boolean> {
  const { sql, params } = buildAssignments(
    { name: "name", reviewUrl: "review_url", active: "active" },
    { ...changes, active: changes.active === undefined ? undefined : toFlag(changes.active) },
  );
  const result = await db
    .prepare(`UPDATE businesses SET ${sql} WHERE id = ?`)
    .bind(...params, id)
    .run();
  return result.meta.changes > 0;
}

/**
 * Deletes a business and its tap history, in one transaction.
 * Its cards are either deleted too, or kept as unassigned stock to reuse.
 */
export async function deleteBusiness(
  db: D1Database,
  id: string,
  cardsOnDelete: CardsOnDelete,
): Promise<{ deleted: boolean; affectedCards: number }> {
  const cardsStatement =
    cardsOnDelete === "delete"
      ? db.prepare(`DELETE FROM cards WHERE business_id = ?`)
      : db.prepare(`UPDATE cards SET business_id = NULL WHERE business_id = ?`);

  const [, cardsResult, businessResult] = await db.batch([
    db.prepare(`DELETE FROM taps WHERE business_id = ?`).bind(id),
    cardsStatement.bind(id),
    db.prepare(`DELETE FROM businesses WHERE id = ?`).bind(id),
  ]);
  return {
    deleted: (businessResult?.meta.changes ?? 0) > 0,
    affectedCards: cardsResult?.meta.changes ?? 0,
  };
}

/** Sets (or with null, removes) the owner dashboard token. @returns false if the business doesn't exist. */
export async function setOwnerToken(db: D1Database, id: string, token: string | null): Promise<boolean> {
  const result = await db.prepare(`UPDATE businesses SET owner_token = ? WHERE id = ?`).bind(token, id).run();
  return result.meta.changes > 0;
}

export async function findBusinessIdByOwnerToken(db: D1Database, token: string): Promise<string | null> {
  const row = await db
    .prepare(`SELECT id FROM businesses WHERE owner_token = ?`)
    .bind(token)
    .first<{ id: string }>();
  return row?.id ?? null;
}
