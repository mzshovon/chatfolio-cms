# Chatfolio CMS

The candidate/admin-facing CMS for Chatfolio — Next.js 16 (App Router), React 19,
TypeScript, and Tailwind CSS v4.

Built so far: the **auth journey** (login, registration, forgot/reset password, 2FA
login verification) and the **candidate dashboard journey** (dashboard home, profile
builder, CV upload, portfolio sections, publish settings, recruiter conversations).
Admin views aren't built yet. See
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
    dashboard/                                          authenticated shell (RequireAuth)
      layout.tsx                                        sidebar + header, wraps every page below
      page.tsx                                           dashboard home
      profile/, cv/, sections/, publish/, conversations/  one page each
  components/
    ui/          generic, reusable primitives (Button, TextField, Alert, ThemeToggle, …)
    auth/        auth-journey composition (AuthShell, RequireAuth, GuestOnly, …)
    dashboard/   dashboard shell composition (Sidebar, Header, nav-items)
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

Everything under `/dashboard` calls the real backend except where no endpoint exists yet
— those stay as illustrative static UI rather than being half-wired or omitted:

- **Dashboard home**: "Portfolio visitors" and "AI tokens used" stat cards are fixed
  placeholders (no candidate-facing analytics endpoint exists — only §8's site-wide admin
  metrics). "Recruiter chats" is real. The conversations preview and publish checklist
  are both real.
- **Header profile menu**: "View public portfolio" and "Account settings" are
  intentionally inert (no public-site link data or account-settings endpoint exists yet).
  "Sign out" is real.
- Two-factor **enrollment** (Docs §2.5 — turning 2FA on from account settings) isn't
  built; only login-time 2FA *verification* (§2.6) is, since enrollment needs an
  account-settings surface that doesn't exist yet.

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
