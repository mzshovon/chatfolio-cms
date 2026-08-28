# Chatfolio CMS

The candidate/admin-facing CMS for Chatfolio — Next.js 16 (App Router), React 19,
TypeScript, and Tailwind CSS v4.

Built so far: the **auth journey** (login, registration, forgot/reset password, 2FA
login verification), the **candidate dashboard journey** (dashboard home, profile
builder, CV upload — with a review-before-import step for parsed CV data —, portfolio
sections, publish settings, recruiter conversations), and the **admin journey**
(dashboard home, users, roles, permissions, chatfolios, metrics, failed CV jobs). See
[`Docs/ADMIN_PANEL_UI_REFERENCE.md`](./Docs/ADMIN_PANEL_UI_REFERENCE.md) for the backend
contract everything here is built against.

## Getting started

```bash
npm install
cp .env.example .env.local   # set BACKEND_API_URL to your backend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/login`.

## Structure

```text
src/
  app/
    (auth)/login, (auth)/register,                    guest-only route pages
    (auth)/forgot-password, (auth)/reset-password,     (GuestOnly, see below)
    (auth)/verify-2fa
    dashboard/                                          candidate shell (RequireAuth)
      layout.tsx                                        sidebar + header, wraps every page below
      page.tsx                                           dashboard home
      profile/, cv/, sections/, publish/,
      conversations/, settings/                           one page each
    admin/                                               admin shell (RequireAdmin)
      layout.tsx                                        separate sidebar + header, "Chatfolio Admin"
      page.tsx                                           admin dashboard home
      users/, users/add/, users/[id]/edit/,
      roles/, permissions/, chatfolios/, metrics/, cv-jobs/
  components/
    ui/          generic, reusable primitives (Button, TextField, Alert, ThemeToggle, …)
    auth/        auth-journey composition (AuthShell, RequireAuth, RequireAdmin, GuestOnly, …)
    dashboard/   candidate shell composition (Sidebar, Header, nav-items)
    admin/       admin shell composition (Sidebar, Header, nav-items)
  lib/
    api/         fetch wrapper + typed endpoint calls, one file per Docs section
    validation/  zod schemas shared by react-hook-form
    hooks/       useAuthedRequest — token-or-redirect wrapper for dashboard API calls
  store/         zustand auth store (in-memory session state)
```

## Auth & token handling

Docs/ADMIN_PANEL_UI_REFERENCE.md §2.2 ranks refresh-token storage options from safest
to riskiest and recommends memory-only (safest, but every reload forces a fresh login).
That was the initial implementation; **it was deliberately changed on request** to
persist the refresh token in `localStorage` (`src/lib/storage/refresh-token.ts`) so a
reload keeps the session — explicitly the doc's highest-risk option (any XSS becomes a
30-day account takeover, not just a same-tab one), chosen anyway after that tradeoff was
surfaced. If that changes, reverting `settleSession`/`getValidAccessToken` in
`src/store/auth-store.ts` to skip `setStoredRefreshToken` goes back to memory-only.

- The **access token** still never touches storage — it stays memory-only and is
  cheaply re-derived via `/auth/refresh` on load.
- On app boot, `SessionRestorer` (mounted once in the root layout) calls
  `restoreSession()`, which reads the stored refresh token (if any) and silently calls
  `/auth/refresh` before either route guard makes a redirect decision — see `restoring`
  in the store. Without this, a reload would flash "redirect to /login" before the
  restore had a chance to run.
- Concurrent requests share a single in-flight `/auth/refresh` call
  (`getValidAccessToken` in `src/store/auth-store.ts`) so two racing refreshes can't
  invalidate each other's single-use refresh token (§2.3).
- `/dashboard` is gated client-side by `RequireAuth`; the backend remains the real
  authorization boundary for any API call.
- If `/auth/login` returns `requires_two_factor: true` (§2.6), the `challenge_token` is
  held in the same in-memory store (`pendingChallenge`) and never persisted either —
  landing on `/verify-2fa` with no pending challenge (e.g. a reload) sends the user back
  to `/login` to start over, per the doc's guidance for a stalled/expired challenge.

## Route guards (both directions)

- `RequireAuth` (used by `src/app/dashboard/layout.tsx`, so it covers every dashboard
  page): no `user` in the store → redirect to `/login`.
- `GuestOnly` (used by `src/app/(auth)/layout.tsx`, so it covers every auth page): a
  `user` already in the store → redirect to `/dashboard`. An authenticated visitor can't
  get back to login/register/forgot-password by URL, a stray link, or the browser Back
  button — verified with Playwright, not just assumed.
- Both are client-side checks reacting to the in-memory store; the backend remains the
  actual authorization boundary for every API call, same as noted below.

## What's static vs. live

Everything under `/dashboard` now calls the real backend. The gaps that used to force
static placeholders were closed once the backend implemented the endpoints tracked in
[`Docs/Required_API_Doc.md`](./Docs/Required_API_Doc.md):

- **Dashboard home**: "Portfolio visitors" and "AI tokens used" stat cards come from
  `GET /v1/dashboard/analytics`. "Recruiter chats" is real. The conversations preview
  and publish checklist are both real.
- **Header profile menu → Account settings**: `/dashboard/settings` (real, both roles)
  covers `POST /auth/change-password` and `PATCH /auth/change-email`. "View public
  portfolio" is still inert — the data exists (`portfolio-settings.subdomain`), it's
  just an unbuilt frontend feature, not a backend gap. "Sign out" is real.
- Two-factor **enrollment** (Docs §2.5 — turning 2FA on from account settings) still
  isn't built; only login-time 2FA *verification* (§2.6) is. Account settings now has a
  real surface to build it on, but enrollment itself is a separate, not-yet-requested
  feature.

## Candidate onboarding (first-run tutorial + progress tracker)

Ported from `Templates/CMS Candidate Dashboard user journey tutorial.dc.html`, mounted
once in `src/app/dashboard/layout.tsx` so both persist across every `/dashboard/*` page:

- **`OnboardingTutorial`** (`src/components/dashboard/onboarding-tutorial.tsx`): a
  4-step modal (Welcome → Upload CV → Approve AI voice → Publish and share) shown once
  per browser, gated by a `chatfolio-onboarding-seen` localStorage flag — there's no
  backend field for "has this candidate seen the tour," so this is deliberately
  client-only state, same as the template's own `localStorage` calls.
- **`OnboardingTracker`** (`src/components/dashboard/onboarding-tracker.tsx`): the
  floating "Get chatfolio-ready" checklist / progress pill. Unlike the template's mock
  data, its four steps are derived from real state: sections all `approved`
  (`GET /sections`), the slug no longer matching the auto-generated
  `candidate-<random>` pattern (`GET /portfolio-settings`), and `is_published`. The
  "Upload your CV" step is the one exception — there's no endpoint to ask "has this
  candidate ever uploaded a CV" (§4 has upload/status/retry, no list), so
  `src/app/dashboard/cv/page.tsx` sets a `chatfolio-cv-uploaded` localStorage flag the
  moment a job reaches `"parsed"`, and the tracker just reads that.
- Both the tutorial's dismissal and the tracker's open/collapsed state read their
  initial value via `useSyncExternalStore` rather than `useState` + `useEffect` — the
  server-rendered HTML has no `localStorage`, so a naive effect would flash the tutorial
  open (or the tracker in its default state) for one frame before correcting itself.
  `useSyncExternalStore`'s server-snapshot argument sidesteps that: it renders the
  "safe" default (tutorial closed, tracker open) on both the server and the very first
  client paint, then reconciles against the real localStorage value immediately.

**Ideas for making onboarding easier that weren't asked for but seem worth
considering**: auto-collapsing the tracker to its pill (or hiding it outright) once all
four steps are done, instead of leaving a static "4 of 4" card sitting in the corner
forever; linking the tutorial's own step copy directly to the matching tracker
step/page instead of only closing the modal on "Let's go"; and using the CV-parsed
webhook moment to *pre-fill* the "Approve AI intro & summary" step's expectations (e.g.
"2 sections are ready to review") rather than a generic label, since that's the exact
moment a candidate has the most context on what they just uploaded.

## Admin journey — what's real vs. preview-only

Every admin page is now real and live, backed by the endpoints tracked in
[`Docs/Required_API_Doc.md`](./Docs/Required_API_Doc.md) once the backend implemented
them:

- Users list: real data, real ban/unban (`PATCH .../users/{id}`) and delete
  (`DELETE .../users/{id}`), real pagination via `limit`/`offset` — there's no
  total-count field so "Next" is just "did we get a full page back". Add User
  (`POST .../users`) and Edit User (`GET`/`PATCH .../users/{id}`, fetched by the `id` in
  the route rather than query-string prefill) are both real.
- Roles and Permissions: full `GET/POST/PATCH/DELETE` CRUD against
  `/admin/roles(/{id})` and `/admin/permissions(/{id})`. A permission's `key` is treated
  as immutable after creation in the UI (only `description` is editable), matching the
  open question the gap doc raised about renaming keys that roles reference.
- Admin dashboard home: `total_portfolio_visitors`, `recruiters_engaged`,
  `ai_tokens_used`, and `ai_tokens_monthly_quota` are additive fields read off the
  existing `GET /admin/metrics` (Option A from the gap doc) — those fields are typed as
  optional in `AdminMetrics` so a stat card degrades to `—` rather than crashing if a
  given deploy hasn't rolled them out yet. Chatfolios (list + filter + unpublish),
  Metrics, and Failed CV Jobs (list + retry) were already real before this pass.
- `RequireAdmin` (`src/components/auth/require-admin.tsx`) mirrors `RequireAuth` plus a
  `role === "admin"` check — same "UX nicety, not the security boundary" caveat the docs
  give for this (§8): the backend 403s every admin endpoint for a non-admin token
  regardless. A signed-in admin can jump between the two shells via "Switch to admin
  view" / "Switch to candidate view" in each header's profile menu.

## Talking to the backend (and why there's no CORS setup)

The app never calls the backend directly from the browser. `src/lib/api/http.ts`
requests same-origin `/api/v1/...`, and `next.config.ts` rewrites that to
`${BACKEND_API_URL}/v1/...` on the Next.js server. Since the browser only ever
talks to its own origin, CORS never applies — no `Access-Control-*` headers
needed on the backend for this app to work.

The one thing this **does** require of the backend: it must be reachable from
wherever the Next.js server runs (same network/host in dev, same
VPC/deployment in production) — not from the visitor's browser.

If the backend is ever called directly from a browser (a different frontend,
a mobile web view, local testing with `curl`/Postman from a browser-based
tool, etc.), it will still need real CORS headers for that path
(`Access-Control-Allow-Origin` for the calling origin, `Allow-Methods`,
`Allow-Headers: Authorization, Content-Type`) — the proxy here only removes
the requirement for *this* app.

## Theming

Light/dark mode is available everywhere via `next-themes` (`ThemeToggle`, top-right on
every page) and follows the system theme by default. Both palettes are defined as CSS
variables in `src/app/globals.css`, sourced from the warm cream/charcoal brand used in
`Templates/`.
