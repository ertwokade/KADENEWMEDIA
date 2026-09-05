# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS dependencies
WORKDIR /repo

# The production build contains both the legacy public site and the KadexAI
# Next application. Keep their dependency trees separate, just as Vercel does.
COPY package.json package-lock.json ./
RUN npm ci

COPY apps/kadexai/package.json apps/kadexai/package-lock.json ./apps/kadexai/
RUN cd apps/kadexai && CI=1 npm ci

FROM node:22-alpine AS builder
WORKDIR /repo
ENV CI=1 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /repo/node_modules ./node_modules
COPY --from=dependencies /repo/apps/kadexai/node_modules ./apps/kadexai/node_modules
COPY . .

ARG NEXT_PUBLIC_BASE_PATH=/kadexai
ARG NEXT_PUBLIC_APP_URL=https://kadexai.kadenewmedia.com/kadexai
ARG NEXT_PUBLIC_SITE_URL=https://kadenewmedia.com
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Match the existing Vercel build: generate the public site, stage it under
# Next's public directory, then produce a standalone Next server.
RUN npm run legacy:build \
    && node scripts/stage-static-into-next.mjs \
    && cd apps/kadexai \
    && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app/apps/kadexai
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/kadexai/.next/standalone /app
COPY --from=builder --chown=nextjs:nodejs /repo/apps/kadexai/public ./public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/kadexai/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/kadexai/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
