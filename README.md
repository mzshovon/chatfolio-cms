# Chatfolio CMS

The candidate/admin-facing CMS for Chatfolio — Next.js 16 (App Router), React 19,
TypeScript, and Tailwind CSS v4.

Only the **auth journey** (login, registration) is built so far; the rest of the CMS
(profile, CV, portfolio, dashboard, admin views) is still being designed against
[`Docs/ADMIN_PANEL_UI_REFERENCE.md`](./Docs/ADMIN_PANEL_UI_REFERENCE.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
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

## Theming

Light/dark mode is available everywhere via `next-themes` (`ThemeToggle`, top-right on
every page) and follows the system theme by default. Both palettes are defined as CSS
variables in `src/app/globals.css`, sourced from the warm cream/charcoal brand used in
`Templates/`.
