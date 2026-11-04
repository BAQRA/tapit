import { Hono } from "hono";
import { z } from "zod";
import type {
  BusinessListItem,
  CreateBusinessRequest,
  DeleteBusinessResponse,
  OkResponse,
  OwnerLinkResponse,
  UpdateBusinessRequest,
} from "../../../shared/api";
import {
  createBusiness,
  deleteBusiness,
  listBusinesses,
  setOwnerToken,
  updateBusiness,
  type Business,
  type CardsOnDelete,
} from "../../db/businesses";
import type { AppEnv } from "../../env";
import { notFound } from "../../lib/errors";
import { newOwnerToken } from "../../lib/ids";
import { normalizeReviewUrl } from "../../lib/review-url";
import { parseJsonBody } from "../../lib/validation";
import { ownerDashboardUrl, publicBaseUrl } from "../../links";

const name = z.string().trim().min(1).max(200);
const reviewUrl = z.string().trim().min(1).max(2000);

const createBody = z.object({ name, reviewUrl }) satisfies z.ZodType<CreateBusinessRequest>;

const updateBody = z
  .object({ name: name.optional(), reviewUrl: reviewUrl.optional(), active: z.boolean().optional() })
  .refine(
    (body) => Object.values(body).some((value) => value !== undefined),
    "Nothing to update",
  ) satisfies z.ZodType<UpdateBusinessRequest>;

/** Mounted at /api/businesses (admin only). */
export const businessRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const baseUrl = publicBaseUrl(c.env, c.req.url);
    const businesses = await listBusinesses(c.env.DB);
    return c.json(businesses.map((business) => toResponse(business, baseUrl)));
  })

  .post("/", async (c) => {
    const body = await parseJsonBody(c, createBody);
    const business = await createBusiness(c.env.DB, {
      name: body.name,
      reviewUrl: normalizeReviewUrl(body.reviewUrl),
    });
    return c.json(toResponse(business, publicBaseUrl(c.env, c.req.url)), 201);
  })

  .patch("/:id", async (c) => {
    const body = await parseJsonBody(c, updateBody);
    const changed = await updateBusiness(c.env.DB, c.req.param("id"), {
      ...body,
      reviewUrl: body.reviewUrl === undefined ? undefined : normalizeReviewUrl(body.reviewUrl),
    });
    if (!changed) throw notFound("Business not found");
    return c.json({ ok: true } satisfies OkResponse);
  })

  // ?cards=delete also deletes its cards; otherwise they become unassigned stock.
  .delete("/:id", async (c) => {
    const cardsOnDelete: CardsOnDelete = c.req.query("cards") === "delete" ? "delete" : "unassign";
    const result = await deleteBusiness(c.env.DB, c.req.param("id"), cardsOnDelete);
    if (!result.deleted) throw notFound("Business not found");
    return c.json({
      ok: true,
      cards: cardsOnDelete,
      affectedCards: result.affectedCards,
    } satisfies DeleteBusinessResponse);
  })

  // Create, or reset (old link stops working), the owner's dashboard link.
  .post("/:id/owner-link", async (c) => {
    const token = newOwnerToken();
    if (!(await setOwnerToken(c.env.DB, c.req.param("id"), token))) {
      throw notFound("Business not found");
    }
    const ownerUrl = ownerDashboardUrl(publicBaseUrl(c.env, c.req.url), token);
    return c.json({ ownerUrl } satisfies OwnerLinkResponse, 201);
  })

  .delete("/:id/owner-link", async (c) => {
    if (!(await setOwnerToken(c.env.DB, c.req.param("id"), null))) {
      throw notFound("Business not found");
    }
    return c.json({ ownerUrl: null } satisfies OwnerLinkResponse);
  });

/** Never send the raw token field; send the ready-to-share link instead. */
function toResponse({ ownerToken, ...business }: Business, baseUrl: string): BusinessListItem {
  return {
    ...business,
    ownerUrl: ownerToken ? ownerDashboardUrl(baseUrl, ownerToken) : null,
  };
}
