import type { NextConfig } from "next";

// Dev-only path for the same-origin `/api/v1/*` -> backend proxy — see
// src/proxy.ts, which handles this same job for staging/production and
// deliberately no-ops in development. `next dev` re-reads next.config.ts
// and .env.local on every restart, so unlike the production/standalone
// build, there's no build-time-baking problem here: this is just the
// simplest, lowest-latency way to do it locally, without the extra
// proxy hop on every request.
const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // No Content-Security-Policy yet — a real one needs a per-request nonce
  // threaded through to Next's inline hydration scripts, which is a
  // separate piece of work from the headers here, not implemented yet.
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  experimental: {
    // Default worker count is CPU count - 1, which is wasteful on small
    // build hosts (each worker is a separate process). Scale by available
    // memory instead, capped at 1 as a floor for 1-2GB VPS builds.
    memoryBasedWorkersCount: true,
    cpus: 1,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    // Dev only — see the comment on `backendUrl` above. In a built run,
    // src/proxy.ts's Proxy step already produces a response for every
    // `/api/v1/*` request before Next.js reaches this rewrite, so this
    // never actually executes there; returning [] keeps that explicit
    // rather than relying on that ordering alone.
    if (process.env.NODE_ENV !== "development" || !backendUrl) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;