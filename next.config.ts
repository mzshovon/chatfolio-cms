import type { NextConfig } from "next";

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
};

export default nextConfig;