import type { NextConfig } from "next";

// Server-only — never exposed to the browser. Set in .env.local.
const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendUrl) return [];
    // Browser calls same-origin `/api/v1/...`; Next's server proxies it to
    // the real backend. Server-to-server requests aren't subject to CORS,
    // so this avoids the browser CORS check entirely instead of depending
    // on the backend sending Access-Control-* headers.
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
