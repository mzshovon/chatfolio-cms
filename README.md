# Chatfolio CMS

The candidate/admin-facing CMS for Chatfolio — Next.js 16 (App Router), React 19,
TypeScript, and Tailwind CSS v4.

Only the **auth journey** (login, registration) is built so far; the rest of the CMS
(profile, CV, portfolio, dashboard, admin views) is still being designed against
[`Docs/ADMIN_PANEL_UI_REFERENCE.md`](./Docs/ADMIN_PANEL_UI_REFERENCE.md).

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
    (auth)/login, (auth)/register, (auth)/forgot-password   route pages
    dashboard                                                post-login landing (stub)
  components/
    ui/          generic, reusable primitives (Button, TextField, Alert, ThemeToggle, …)
    auth/        auth-journey-specific composition (AuthShell, BrandPanel, RequireAuth, …)
  lib/
    api/         fetch wrapper + typed endpoint calls (auth.ts mirrors Docs §2)
    validation/  zod schemas shared by react-hook-form
  store/         zustand auth store (in-memory session state)
```

## Auth & token handling

Follows `Docs/ADMIN_PANEL_UI_REFERENCE.md` §2.2 exactly:

- Access **and** refresh tokens live only in memory (the Zustand store), never in
  `localStorage`/cookies — the safest option given the backend has no httpOnly-cookie
  flow yet. A hard page reload always requires signing in again; this is intentional.
- Concurrent requests share a single in-flight `/auth/refresh` call
  (`getValidAccessToken` in `src/store/auth-store.ts`) so two racing refreshes can't
  invalidate each other's single-use refresh token (§2.3).
- `/dashboard` is gated client-side by `RequireAuth`; the backend remains the real
  authorization boundary for any API call.

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
