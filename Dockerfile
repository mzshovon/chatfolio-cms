# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# --- Dependencies ---------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# --webpack (set in package.json's build script): Next.js 16 defaults `next
# build` to Turbopack, whose production build path is far more memory-hungry
# than webpack's for this app — it OOM-killed on a 2GB host where webpack
# builds cleanly with room to spare. Keep this until Turbopack's build
# memory profile is more predictable.
RUN npm run build

# --- Runtime ------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Both overridable at runtime: docker run -e PORT=8080 -e BACKEND_API_URL=...
# src/proxy.ts reads BACKEND_API_URL fresh on every request (Next.js 16's
# `proxy` convention, evaluated at runtime, unlike the old next.config.ts
# `rewrites()` this replaced) — no rebuild needed to point at a different
# backend, unlike before. No default: an unset value makes every /api/v1/*
# call fail loudly (500 with a clear message) rather than silently 404.
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js "standalone" output: a self-contained server plus only the
# node_modules it actually needs, so the runtime image stays small and
# doesn't require a package install step.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE $PORT

CMD ["node", "server.js"]
