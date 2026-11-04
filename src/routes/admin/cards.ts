import { Hono } from "hono";
import { z } from "zod";
import type { CardListItem, CreateCardsRequest, OkResponse, UpdateCardRequest } from "../../../shared/api";
import { businessExists } from "../../db/businesses";
import { createCards, deleteCard, listCards, updateCard } from "../../db/cards";
import type { AppEnv, Env } from "../../env";
import { badRequest, notFound } from "../../lib/errors";
import { parseJsonBody } from "../../lib/validation";
import { cardUrl, publicBaseUrl } from "../../links";

const MAX_CARDS_PER_REQUEST = 500;

/** Empty labels are stored as null. */
const label = z
  .string()
  .trim()
  .max(100)
  .nullish()
  .transform((value) => value || null);

const businessId = z.string().min(1).nullable();

const createBody = z.object({
  businessId: businessId.optional().transform((value) => value ?? null),
  label,
  count: z.number().int().min(1).max(MAX_CARDS_PER_REQUEST).default(1),
}) satisfies z.ZodType<unknown, CreateCardsRequest>;

const updateBody = z
  .object({
    label: label.optional(),
    active: z.boolean().optional(),
    businessId: businessId.optional(),
  })
  .refine(
    (body) => Object.values(body).some((value) => value !== undefined),
    "Nothing to update",
  ) satisfies z.ZodType<UpdateCardRequest>;

/** Mounted at /api/cards (admin only). */
export const cardRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const baseUrl = publicBaseUrl(c.env, c.req.url);
    const cards = await listCards(c.env.DB);
    return c.json(cards.map((card): CardListItem => ({ ...card, url: cardUrl(baseUrl, card.id) })));
  })

  // Create one or many cards. Without businessId they're blank stock to assign later.
  .post("/", async (c) => {
    const body = await parseJsonBody(c, createBody);
    await assertBusinessExists(c.env, body.businessId);

    const baseUrl = publicBaseUrl(c.env, c.req.url);
    const cards = await createCards(c.env.DB, body);
    return c.json(
      cards.map((card): CardListItem => ({ ...card, url: cardUrl(baseUrl, card.id) })),
      201,
    );
  })

  .patch("/:id", async (c) => {
    const body = await parseJsonBody(c, updateBody);
    await assertBusinessExists(c.env, body.businessId);

    if (!(await updateCard(c.env.DB, c.req.param("id"), body))) throw notFound("Card not found");
    return c.json({ ok: true } satisfies OkResponse);
  })

  .delete("/:id", async (c) => {
    if (!(await deleteCard(c.env.DB, c.req.param("id")))) throw notFound("Card not found");
    return c.json({ ok: true } satisfies OkResponse);
  });

async function assertBusinessExists(env: Env, id: string | null | undefined): Promise<void> {
  if (id && !(await businessExists(env.DB, id))) throw badRequest("Unknown businessId");
}
