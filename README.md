# TapIT

NFC Google-review cards by [TapIT.ge](https://tapit.ge), with redirect tracking and dashboards.

Each card holds **our** link (`https://…/t/<cardId>`), never the business's Google link. When a customer taps:

1. The Worker looks up the card (a few ms).
2. It answers with an instant `302` redirect to the business's Google review page. The customer never sees our page.
3. The tap is recorded in the background, so it never slows the redirect.

Because cards only point at us, we can change a business's review link, pause cards (for example when a customer stops paying) or move a card to another business without rewriting it.

**Stack:** runs on Cloudflare's free tier.

- **Backend:** Cloudflare Workers + D1 (SQLite), [Hono](https://hono.dev) for routing, [Zod](https://zod.dev) for validation.
- **Frontend:** React + TypeScript, built with [Vite](https://vite.dev), [TanStack Query](https://tanstack.com/query) for data loading.
- **Glue:** the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) runs both in one dev server, and `shared/api.ts` types every API response for both sides.

---

## Quick start (local)

```bash
npm install
cp .dev.vars.example .dev.vars   # set ADMIN_PASSWORD and IP_SALT
npm run db:migrate:local
npm run dev                      # http://localhost:8787/admin  (user: admin)
```

`npm run dev` starts one Vite server that runs the Worker and the React dashboards together, with instant reload when you edit either. It listens on your whole Wi-Fi network, so a phone can tap a test card. Open the dashboard at `http://<your-mac-ip>:8787/admin` (find the IP with `ipconfig getifaddr en0`), so copied card links use an address the phone can reach. Write test tags with an `http://` prefix.

## Scripts

| Command                     | What it does                                            |
| --------------------------- | ------------------------------------------------------- |
| `npm run dev`               | Run locally with hot reload (reachable from your Wi-Fi) |
| `npm run build`             | Production build into `dist/`                           |
| `npm run preview`           | Run the production build locally                        |
| `npm test`                  | Run all tests in the Workers runtime                    |
| `npm run check`             | Typecheck + format + tests + build. Run before deploy.  |
| `npm run format`            | Auto-format everything with Prettier                    |
| `npm run deploy`            | Build and publish to Cloudflare                         |
| `npm run db:migrate:local`  | Apply database migrations locally                       |
| `npm run db:migrate:remote` | Apply database migrations in production                 |
| `npm run types`             | Regenerate Workers runtime types after a config change  |

---

## Project structure

```
src/                      Backend (Cloudflare Worker)
├── index.ts              Entry point: mounts all routes
├── env.ts                Bindings and secrets the Worker receives
├── links.ts              Builds public URLs (card links, owner links)
├── routes/               HTTP layer: validate input, call db/, shape the response
│   ├── tap.ts            GET /t/:cardId: the redirect written on every card
│   ├── owner.ts          GET /b/:token: business owner's read-only dashboard
│   └── admin/            Everything behind the admin password
│       ├── index.ts      Auth, /admin pages, mounts the API below
│       ├── businesses.ts /api/businesses
│       ├── cards.ts      /api/cards
│       └── stats.ts      /api/stats
├── db/                   All SQL lives here; returns typed camelCase objects
│   ├── businesses.ts
│   ├── cards.ts
│   ├── taps.ts
│   ├── stats.ts          Every dashboard number in one D1 round trip
│   └── sql.ts            Small shared helpers
├── services/
│   └── tap-recorder.ts   Records a tap (device, daily visitor hash, bot filtering)
├── middleware/           Auth, error handling, response headers
├── views/
│   └── message-page.ts   "Card not found" / "Card inactive" pages
└── lib/                  Pure helpers: IDs, review-URL parsing, time periods, validation

shared/
└── api.ts                The API contract: request/response types used by src/ AND web/

web/                      Frontend (React, built by Vite)
├── index.html            Landing page at /
├── admin/index.html      Entry for /admin
├── owner/index.html      Entry for /b/:token
└── src/
    ├── admin/            Your dashboard
    │   ├── main.tsx      Mounts the app (React Query + toasts)
    │   ├── AdminApp.tsx  Page layout and selected business/period
    │   ├── api.ts        Typed API client
    │   ├── queries.ts    Data loading + actions (TanStack Query)
    │   ├── useBusinessActions.ts  Pause, delete, owner links… with confirmations
    │   ├── toast.tsx     Status messages
    │   └── components/   Tables, forms, business header
    ├── owner/            Business owner's dashboard (OwnerApp.tsx)
    ├── components/       Shared UI: Panel, Kpi, BarChart, Trend, TapCharts…
    ├── lib/              Formatting, chart series, fetch, clipboard
    └── styles/           base.css + one stylesheet per dashboard

migrations/               Database schema, applied in order
test/
├── unit/                 Pure functions
└── integration/          Real HTTP requests against the Worker + a fresh D1 per test
```

**Dependency direction:**

- **Backend:** `routes → services → db → lib`. Routes never contain SQL, and `db/` never knows about HTTP.
- **Frontend:** `App → components → queries/api → lib`. Components never call `fetch` directly.
- **Both** import their API types from `shared/api.ts`. Change a field there and TypeScript flags every place that must follow.

### Conventions

- **Files:** backend `kebab-case.ts`; React components `PascalCase.tsx` (one component per file); hooks `useThing.ts`.
- **Code:** `camelCase` for values, `PascalCase` for types and components.
- **Database:** `snake_case` columns. `db/` maps rows to camelCase objects, so nothing else sees a raw row.
- **API JSON:** camelCase, e.g. `{ reviewUrl, businessId, lastTapAt }`.
- **Errors:** throw `badRequest()` / `notFound()`. The error handler turns them into `{ "error": "…" }`.
- **Input validation:** every request body goes through a Zod schema in its route file.
- **Schema changes:** add a new numbered file in `migrations/`. Never edit an applied one.
- **TypeScript:** one config per runtime: `tsconfig.worker.json` (Workers), `tsconfig.web.json` (browser), `tsconfig.node.json` (build tools).

---

## Deploy (free)

```bash
npx wrangler login
npx wrangler d1 create tapit           # copy the database_id into wrangler.jsonc
npm run db:migrate:remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put IP_SALT        # any long random string
npm run check && npm run deploy
```

Your dashboard is then at `https://go.<your-account-subdomain>.workers.dev/admin`.

### Start free now, add tapit.ge later

You can write your first cards with the free `*.workers.dev` link and add the domain later, without rewriting any card:

- One Worker and one database answer on **both** addresses. Old cards (workers.dev) and new cards (tapit.ge) count in the same dashboard.
- `"workers_dev": true` in `wrangler.jsonc` keeps the free address on after you add the domain. **Never turn it off, rename the Worker, or change your account's workers.dev subdomain**, or old cards stop working.
- Protect tags with an **NFC password** (NFC Tools → Other → Set password) instead of locking them permanently. Strangers can't overwrite them, but you can still rewrite them later.

### Moving to tapit.ge (when you buy it)

1. Add `tapit.ge` to Cloudflare (free plan) and change the nameservers at your `.ge` registrar to the two Cloudflare gives you.
2. In `wrangler.jsonc`, uncomment the `routes` and `vars` lines at the bottom (they're already written for `go.tapit.ge`).
3. `npm run deploy`.

From then on, new cards and owner links use `https://go.tapit.ge/…`. `tapit.ge` itself stays free for a marketing site.

---

## Using it

1. **Add a business:** paste its Google review link, or just its **Place ID** (from Google's Place ID Finder). A Place ID becomes a direct "write a review" link.
2. **Create cards:** assign them to a business, or create **blank stock** to program in bulk and assign later.
3. **Write the link** to the NFC tag (for example with the NFC Tools app). NTAG213 is enough.
4. **Owner dashboard:** click **Owner link** next to a business to copy a private, read-only link for its owner. **Reset link** makes the old one stop working; **Turn off** removes access.

## API (Basic auth, user `admin`)

| Method        | Path                             | Body / query                                  |
| ------------- | -------------------------------- | --------------------------------------------- |
| GET           | `/api/stats`                     | `?days=30&tz=240&business=<id>`               |
| GET           | `/api/businesses`                |                                               |
| POST          | `/api/businesses`                | `{ name, reviewUrl }`                         |
| PATCH         | `/api/businesses/:id`            | `{ name?, reviewUrl?, active? }`              |
| DELETE        | `/api/businesses/:id`            | `?cards=delete` (default keeps them as stock) |
| POST / DELETE | `/api/businesses/:id/owner-link` | Create or reset / turn off the owner link     |
| GET           | `/api/cards`                     |                                               |
| POST          | `/api/cards`                     | `{ businessId?, label?, count? (1–500) }`     |
| PATCH         | `/api/cards/:id`                 | `{ label?, active?, businessId? }`            |
| DELETE        | `/api/cards/:id`                 | Deletes the card and its taps                 |

Public: `GET /t/:cardId` (card redirect), `GET /b/:token` and `/b/:token/stats` (owner dashboard), `GET /health`.

## Privacy and policy

- **No raw IPs stored.** `visitor` is a hash salted per day, so it counts unique taps within a day but can't track a person across days.
- **Bots aren't counted.** Link previews (WhatsApp, Telegram, Slack…) and crawlers still get the redirect but aren't recorded.
- **Owner links** send no `Referer` and tell search engines not to index them.
- **No review gating.** Don't send happy customers to Google and unhappy ones to a private form. Google prohibits it and can remove a business's reviews. Every tap goes to the review page.
