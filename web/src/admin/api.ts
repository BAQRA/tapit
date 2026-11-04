import type {
  AdminStats,
  BusinessListItem,
  CardListItem,
  CreateBusinessRequest,
  CreateCardsRequest,
  DeleteBusinessResponse,
  OkResponse,
  OwnerLinkResponse,
  UpdateBusinessRequest,
  UpdateCardRequest,
} from "../../../shared/api";
import { requestJson } from "../lib/http";

export interface StatsQuery {
  days: number;
  /** Viewer's UTC offset in minutes. */
  tz: number;
  /** null = all businesses. */
  businessId: string | null;
}

// location.origin never contains "user:pass@", so this works even if the page was
// opened with credentials in the URL. The browser re-sends the Basic-auth login itself.
const api = <T>(path: string, options?: { method?: string; body?: unknown }) =>
  requestJson<T>(`${location.origin}${path}`, options);

/** Typed client for the admin JSON API (/api/*). */
export const adminApi = {
  getStats: ({ days, tz, businessId }: StatsQuery) => {
    const query = new URLSearchParams({ days: String(days), tz: String(tz) });
    if (businessId) query.set("business", businessId);
    return api<AdminStats>(`/api/stats?${query}`);
  },

  listBusinesses: () => api<BusinessListItem[]>("/api/businesses"),
  createBusiness: (body: CreateBusinessRequest) =>
    api<BusinessListItem>("/api/businesses", { method: "POST", body }),
  updateBusiness: (id: string, body: UpdateBusinessRequest) =>
    api<OkResponse>(`/api/businesses/${id}`, { method: "PATCH", body }),
  deleteBusiness: (id: string, deleteCards: boolean) =>
    api<DeleteBusinessResponse>(`/api/businesses/${id}?cards=${deleteCards ? "delete" : "unassign"}`, {
      method: "DELETE",
    }),

  /** Creates the owner link, or replaces it (the old link stops working). */
  createOwnerLink: (id: string) =>
    api<OwnerLinkResponse>(`/api/businesses/${id}/owner-link`, { method: "POST" }),
  removeOwnerLink: (id: string) =>
    api<OwnerLinkResponse>(`/api/businesses/${id}/owner-link`, { method: "DELETE" }),

  createCards: (body: CreateCardsRequest) => api<CardListItem[]>("/api/cards", { method: "POST", body }),
  updateCard: (id: string, body: UpdateCardRequest) =>
    api<OkResponse>(`/api/cards/${id}`, { method: "PATCH", body }),
  deleteCard: (id: string) => api<OkResponse>(`/api/cards/${id}`, { method: "DELETE" }),
};
