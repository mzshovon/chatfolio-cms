import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Content-Security-Policy is set per-request in proxy.ts so it can
  // include a fresh nonce for Next.js's own inline hydration scripts.
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