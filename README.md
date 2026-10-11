# Aerlume — Travel Booking Platform

Aerlume is a full-stack travel booking platform: search and book flights, hotels, and curated
holiday packages against real managed inventory, pay securely through Stripe, and manage
everything from a user dashboard or an admin console.

This README documents what's built, how it's built, and — just as importantly — what is **not**
yet built, so nobody mistakes a work-in-progress phase for a finished feature.

---

## 1. Product overview

Users can:
- Search flights, hotels, and holiday packages with real server-side filtering, sorting, and pagination
- View rich detail pages (maps, live weather, room availability, day-by-day itineraries)
- Book with a real inventory hold → payment → confirmation flow, with double-booking prevented
  by MongoDB transactions
- Pay via Stripe (PaymentIntents + signature-verified webhooks — never a client-trusted "success" flag)
- Manage bookings, cancel eligible ones (with real refund initiation), leave reviews on
  completed trips, build day-by-day itineraries, save destinations, and get notified of booking events
- Convert currency using a live third-party rate (clearly labeled as an estimate)

Admins can:
- View overview stats and real aggregation-based analytics (revenue/bookings over time, popular
  destinations, cancellation rate)
- Manage users (search, deactivate, change role)
- Manage flight, hotel (+ room type), and package inventory
- Oversee all bookings and moderate reviews

---

## 2. Architecture

```
aerlume/
├── backend/          Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── config/          env loading + validation, DB connection
│   │   ├── models/           12 Mongoose models
│   │   ├── middleware/       auth, error handling, rate limiting, validation
│   │   ├── controllers/      route handlers, thin — logic lives in services
│   │   ├── services/         business logic (booking, pricing, payments, inventory, email)
│   │   │   └── providers/    swappable abstractions: Payment, Flight, Hotel, Weather, Currency
│   │   ├── routes/           REST route definitions
│   │   ├── validators/       express-validator rule sets
│   │   ├── jobs/              cron jobs (hold expiration, booking completion)
│   │   └── seed/              realistic seed data + runner
│   └── tests/                 Jest + Supertest + mongodb-memory-server
└── frontend/          React + Vite + Tailwind
    └── src/
        ├── pages/             route-level pages (including nested admin/ pages)
        ├── components/        reusable UI, feature components (booking, reviews, maps, etc.)
        ├── context/           auth state
        └── lib/                API client, React Query hooks
```

**Why services are separated from controllers:** booking creation, payment confirmation, and
cancellation all involve multi-step logic wrapped in MongoDB transactions. Keeping that logic in
`services/` (not routes or controllers) means it's testable in isolation and reusable — e.g. the
webhook handler and a future admin "force-confirm" action could both call `confirmBooking()`
without duplicating transaction logic.

**Provider abstractions** (`services/providers/`): Payment, Flight, Hotel, Weather, and Currency
providers are each behind an interface. Today, Flight/Hotel inventory is internal (MongoDB);
Payment is Stripe; Weather is Open-Meteo (no key required); Currency is exchangerate.host. Swapping
any of these for a different provider later means writing one new class, not touching controllers.

---

## 3. Tech stack

**Backend:** Node.js, Express, MongoDB + Mongoose, JWT auth, bcrypt, Stripe, Nodemailer, node-cron, Winston, Helmet, express-rate-limit, express-mongo-sanitize, xss-clean.

**Frontend:** React 18, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Stripe.js/React Stripe.js, Leaflet/React-Leaflet, Recharts, Lucide icons.

---

## 4. Installation

### Prerequisites
- Node.js 18+
- MongoDB **running as a replica set** — this is not optional. The booking/inventory logic uses
  MongoDB transactions to prevent double-booking, and standalone `mongod` instances reject
  transactions outright.
  - **MongoDB Atlas** (recommended, free tier works): a replica set by default, nothing to configure.
  - **Local MongoDB**: start it as a single-node replica set:
    ```bash
    mongod --replSet rs0 --dbpath /path/to/data
    # in a separate mongosh session, once:
    rs.initiate()
    ```
- A Stripe account (test mode is fine) for payments
- An SMTP provider (SendGrid, Mailgun, or similar) for transactional email — optional; the app
  degrades gracefully (logs instead of sending) if unset

### Backend

```bash
cd backend
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, EMAIL_*
npm install
npm run seed        # populates destinations, flights, hotels, packages, users, reviews
npm run dev          # http://localhost:5000
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend

```bash
cd frontend
cp .env.example .env
# fill in VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev          # http://localhost:5173, proxies /api to :5000
```

### Stripe webhook (local development)

Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhook events to your local server:
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```
Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` in `backend/.env`.

---

## 5. Seed data & demo accounts

`npm run seed` creates realistic destinations, flights, hotels (with room types), packages, users,
and reviews. It also prints demo credentials:

| Role  | Email                     | Password       |
|-------|---------------------------|----------------|
| Admin | admin@aerlume.dev         | DevAdmin#2026  |
| User  | amara.chen@example.com    | DevUser#2026   |

**These are development-only credentials, clearly marked as such in the seed script.** Never use
them, or a default password like them, in a real deployment — set real credentials via the admin
account you create after deploying.

---

## 6. Testing

```bash
cd backend
npm test
```

53 tests across 7 files (Jest + Supertest + an in-memory MongoDB replica set via
`mongodb-memory-server`, so transactions work exactly as they do in production). Coverage includes:

- **Auth** — registration, login, invalid credentials, brute-force lockout, protected routes
- **Search** — flight/hotel/package filtering, availability-aware results, pagination
- **Booking core** — hold creation, **real concurrent double-booking tests** (two simultaneous
  requests for the last seat/room/slot — exactly one must succeed), hold expiration, cancellation
- **Payments** — webhook confirms only on matching amount/currency, idempotent event replay,
  failed-payment handling
- **Reviews** — eligibility (completed booking only), duplicate prevention, cross-user rejection
- **Admin authorization** — non-admins blocked from every admin route
- **Dedicated negative-testing suite** (`tests/negative.test.js`) mapping directly to the explicit
  "things a user should not be able to do" list: unavailable inventory, wrong payment amounts,
  viewing/cancelling another user's booking, admin API access as a regular user, expired coupon
  reuse, and price/inventory tampering attempts.

---

## 7. Security considerations

- Passwords hashed with bcrypt (cost factor 12); never returned in any API response
- JWT in httpOnly cookies (+ bearer token fallback for the SPA)
- Brute-force lockout after 5 failed logins (15-minute lock)
- All authorization checks happen server-side; ownership checks return 404 (not 403) to
  non-owners so booking/itinerary existence isn't leaked
- Every payable amount is computed server-side from live inventory prices — no endpoint accepts
  a client-supplied price or payment status
- Stripe webhook signatures are verified before any event is processed; a mismatched
  amount/currency on `payment_intent.succeeded` fails the payment instead of confirming it
- Helmet, CORS scoped to `CLIENT_URL`, rate limiting (tighter on auth routes), NoSQL-injection and
  XSS sanitization on all input
- Logs never contain passwords, tokens, or card data (enforced by a redaction filter in the logger)

---

## 8. What's built vs. what's not

**Built and working (subject to you verifying locally — see §10):**
Auth & authorization · flight/hotel/package search · booking core with transactional
double-booking prevention · hold expiration · Stripe payments & webhooks · refunds · user
dashboard · admin console (inventory CRUD, users, analytics) · reviews · notifications ·
itinerary builder · currency converter · PDF booking confirmations · SEO meta tags on public
pages · dark mode (see note below) · AI trip planner (see note below) · automated test suite
(backend + a starter frontend suite).

**Dark mode — complete.** The toggle, persistence (localStorage + best-effort sync to the user's
profile), shared chrome (navbar, footer, cards, buttons, inputs, badges, centralized in
`index.css`), and every page's inline text/background/border color utility (`text-indigo-900`,
`text-muted`, `bg-ivory`, `bg-surface`, `bg-indigo-50`/`100`, `border-border`, `text-border`,
`text-indigo-600`) all have a `dark:` companion class, applied systematically — not just shared
chrome. Mechanically: a script walked every `.jsx` file and appended the correct `dark:` variant
after each occurrence of a known token, then every file was re-scanned to confirm zero tokens were
missed and no duplicate/malformed classes were introduced; `Navbar.jsx` (which had some earlier
hand-written dark classes) and `Footer.jsx` (whose background never changes between themes, so
nothing there needed to change) were reviewed by hand instead. A handful of `border-indigo-900`
selected-state indicators that would have been too close in value to the dark background were
given a `dark:border-gold` companion instead, for visibility. I still have no way to render this
and visually confirm it — the fix is correct by construction and by systematic audit, not by
looking at it, so treat it as "should be right" until you've actually seen it render.

**AI trip planner — real integration, optional configuration:** `POST /api/ai/trip-plan`
(authenticated, rate-limited to 15/hour) calls the Anthropic Messages API to generate a structured
day-by-day plan, which the frontend can save directly into the itinerary builder. If `AI_API_KEY`
is unset, the endpoint returns a clear "not configured" error rather than a fake plan, and the
frontend shows a matching message — this mirrors the `WeatherProvider` pattern. Swapping providers
means writing a new class matching `AIPlannerProvider`'s interface.

**Explicitly not built — do not assume these work:**
- Full per-page dark-mode text color retrofit (see above)
- Accessibility audit (base semantic HTML and focus states exist; no formal audit has been done)
- Comprehensive frontend test coverage (backend has 53 tests; frontend has a handful of starter
  unit/component tests, not full coverage)
- Deployment has not been performed or verified — see §10

---

## 9. API overview

All routes are prefixed `/api`. Full route definitions live in `backend/src/routes/`.

| Area | Base path | Notes |
|---|---|---|
| Health | `/health` | Service + integration status, no secrets exposed |
| Auth | `/auth` | Register, login, logout, password reset, profile |
| Flights / Hotels / Packages | `/flights`, `/hotels`, `/packages` | Public search + detail |
| Destinations | `/destinations` | Public, includes live weather |
| Currency | `/currency/convert` | Public |
| AI trip planner | `/ai/status`, `/ai/trip-plan` | `status` public, `trip-plan` auth required + rate-limited |
| Bookings | `/bookings` | Auth required; create, list mine, detail, cancel |
| Payments | `/payments` | `create-intent` (auth), `webhook` (Stripe-signed, public) |
| Reviews | `/reviews` | List public; create/edit/delete auth required |
| Notifications | `/notifications` | Auth required |
| Itineraries | `/itineraries` | Auth required |
| Users | `/users/me/saved-destinations` | Auth required |
| Admin | `/admin/*` | Admin role required for everything under this path |

---

## 10. Deployment

**This has not been deployed or tested end-to-end in production — treat the following as a
starting configuration, not a verified deployment guide.**

- **Frontend → Vercel.** `frontend/vercel.json` sets the build command and SPA rewrite. Set
  `VITE_STRIPE_PUBLISHABLE_KEY` as a Vercel environment variable.
- **Backend → Render or Railway.** `backend/render.yaml` is a starting service definition. Set all
  variables from `.env.example` in the platform's environment settings — never commit real secrets.
- **Database → MongoDB Atlas.** Already a replica set by default, which the booking transactions require.
- Point the deployed frontend's API calls at the deployed backend URL (update the Vite proxy /
  API base URL for production, since the local dev proxy only works with `vite dev`).
- Add a **production** Stripe webhook endpoint in the Stripe Dashboard pointing at
  `https://<your-backend>/api/payments/webhook`, and set that endpoint's signing secret as
  `STRIPE_WEBHOOK_SECRET` in production — it will differ from your local Stripe CLI secret.

---

## 11. Troubleshooting

- **"Transaction numbers are only allowed on a replica set member"** — your MongoDB isn't running
  as a replica set. See the Prerequisites section above.
- **Booking creation fails immediately with a 500** — check the backend logs; this is almost
  always the replica-set issue above.
- **Payments page shows "Payments aren't configured yet"** — set `VITE_STRIPE_PUBLISHABLE_KEY` in
  `frontend/.env`.
- **Webhook events never confirm a booking locally** — make sure `stripe listen` is running and
  `STRIPE_WEBHOOK_SECRET` matches what it printed.
- **Emails aren't sending** — this is expected if `EMAIL_HOST`/`EMAIL_USER` aren't set; the app
  logs a warning and continues rather than failing the request.

---

## 12. User roles

- **Guest** — browse, search, view details, register/login
- **User** — book, pay, manage own bookings, cancel eligible bookings, review completed trips,
  manage profile, itineraries, and saved destinations
- **Admin** — everything above, plus inventory/user management and analytics
