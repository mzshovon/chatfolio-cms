import { NextResponse, type NextRequest } from "next/server";

// Same-origin `/api/v1/*` -> the real backend, so the browser only ever
// talks to its own origin and CORS never applies (see README "Talking to
// the backend"). This used to live in next.config.ts's `rewrites()`, which
// Next resolves ONCE at build time and bakes into
// `.next/routes-manifest.json` — the standalone server never re-reads it,
// so BACKEND_API_URL had to be a Docker build-arg, and pointing at a
// different backend meant rebuilding the image.
//
// `proxy` (Next.js 16's renamed, runtime-evaluated successor to
// `middleware`) runs this function fresh on every request instead, so
// BACKEND_API_URL now behaves like PORT: a plain container-runtime env var,
// no rebuild needed to change it.
//
// Deliberately staging/production only: `next dev` sets NODE_ENV to
// "development" automatically, and any built run (staging or prod, via
// `next start` or this repo's standalone Docker image) is "production" —
// no separate flag needed. In dev, this bails out immediately and
// next.config.ts's own `rewrites()` handles `/api/v1/*` directly instead,
// since going through this extra network hop on every request added
// noticeable latency locally for no benefit dev doesn't already have
// (dev's `.env.local` + next.config.ts are already read fresh on every
// `next dev` restart, so there's no build-time-baking problem to solve
// there in the first place).
const API_PREFIX = "/api/v1";

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return;

  const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");

  if (!backendUrl) {
    console.error(
      "BACKEND_API_URL is not set — every /api/v1/* request will fail. " +
        "Set it in the environment this server is running in."
    );
    return NextResponse.json(
      { detail: "Server misconfigured: BACKEND_API_URL is not set." },
      { status: 500 }
    );
  }

  const rest = request.nextUrl.pathname.slice(API_PREFIX.length);
  const target = new URL(`${backendUrl}/v1${rest}${request.nextUrl.search}`);
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: "/api/v1/:path*",
};
