/**
 * The JSON contract between the Worker (src/) and the dashboards (web/).
 *
 * Plain types only: no runtime code and no platform types, so both the Worker
 * and the browser code can import it. Change a field here and TypeScript shows
 * every place on both sides that needs updating.
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Body of every non-2xx JSON response. */
export interface ApiError {
  error: string;
}

// ---------------------------------------------------------------------------
// Businesses — /api/businesses
// ---------------------------------------------------------------------------

export interface BusinessListItem {
  id: string;
  name: string;
  reviewUrl: string;
  /** false = paused: cards show "Card inactive" instead of redirecting. */
  active: boolean;
  createdAt: number;
  cardCount: number;
  /** Ready-to-share owner dashboard link; null = no owner access. */
  ownerUrl: string | null;
}

export interface CreateBusinessRequest {
  name: string;
  /** Full https link or a bare Google Place ID. */
  reviewUrl: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  reviewUrl?: string;
  active?: boolean;
}

export interface DeleteBusinessResponse {
  ok: true;
  cards: "delete" | "unassign";
  affectedCards: number;
}

export interface OwnerLinkResponse {
  ownerUrl: string | null;
}

// ---------------------------------------------------------------------------
// Cards — /api/cards
// ---------------------------------------------------------------------------

export interface CardListItem {
  id: string;
  /** null = blank stock, not assigned yet. */
  businessId: string | null;
  businessName: string | null;
  label: string | null;
  active: boolean;
  createdAt: number;
  /** The link to write on the NFC tag. */
  url: string;
}

export interface CreateCardsRequest {
  businessId?: string | null;
  label?: string | null;
  /** 1–500, default 1. */
  count?: number;
}

export interface UpdateCardRequest {
  label?: string | null;
  active?: boolean;
  businessId?: string | null;
}

export interface OkResponse {
  ok: true;
}

// ---------------------------------------------------------------------------
// Stats — /api/stats (admin) and /b/:token/stats (owner)
// ---------------------------------------------------------------------------

export interface TapTotals {
  taps: number;
  visitors: number;
  /** Taps on paused or blank cards. */
  blockedTaps: number;
}

/** "YYYY-MM-DD" in the viewer's timezone. Only days with taps are included. */
export interface DailyTaps {
  day: string;
  taps: number;
}

/** 0–23 in the viewer's timezone. Only hours with taps are included. */
export interface HourlyTaps {
  hour: number;
  taps: number;
}

export interface DeviceTaps {
  /** "ios" | "android" | "other" */
  device: string;
  taps: number;
}

export interface BusinessStats {
  id: string;
  name: string;
  active: boolean;
  reviewUrl: string;
  cardCount: number;
  taps: number;
  /** Taps in the equally long period before, for the trend. */
  previousTaps: number;
  tapsToday: number;
  visitors: number;
  iosTaps: number;
  androidTaps: number;
  blockedTaps: number;
  /** Most recent tap ever (not limited to the period). */
  lastTapAt: number | null;
}

export interface CardStats {
  id: string;
  label: string | null;
  active: boolean;
  businessId: string | null;
  businessName: string | null;
  taps: number;
  lastTapAt: number | null;
}

/** Numbers shared by both dashboards. */
export interface TapSeries {
  days: number;
  totals: TapTotals;
  daily: DailyTaps[];
  hourly: HourlyTaps[];
  devices: DeviceTaps[];
}

export interface DashboardStats extends TapSeries {
  businesses: BusinessStats[];
  cards: CardStats[];
}

/** GET /api/stats */
export interface AdminStats extends TapSeries {
  businesses: BusinessStats[];
  cards: (CardStats & { url: string })[];
}

/** GET /b/:token/stats — only what a business owner may see. */
export interface OwnerStats extends TapSeries {
  business: Pick<
    BusinessStats,
    | "name"
    | "active"
    | "reviewUrl"
    | "cardCount"
    | "taps"
    | "previousTaps"
    | "tapsToday"
    | "visitors"
    | "lastTapAt"
  >;
  cards: Pick<CardStats, "id" | "label" | "active" | "taps" | "lastTapAt">[];
}
