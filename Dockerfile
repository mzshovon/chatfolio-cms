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
# next.config.ts's rewrites() (the CORS-avoidance /api/v1/* proxy) is
# resolved once here and baked into .next/routes-manifest.json — Next does
# NOT re-evaluate it when the standalone server boots. So unlike PORT below,
# BACKEND_API_URL must be supplied at *build* time, not just container run
# time: `docker build --build-arg BACKEND_API_URL=https://api.example.com`.
# Pointing this image at a different backend means rebuilding, not just
# restarting with a new env var.
ARG BACKEND_API_URL
ENV BACKEND_API_URL=$BACKEND_API_URL
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
# Overridable at runtime: docker run -e PORT=8080 ...
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
