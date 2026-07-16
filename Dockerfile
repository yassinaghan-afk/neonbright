# NeonBright — EasyPanel production image (Next.js + local STORAGE_ROOT)
# Volume mount required: /app/storage  (do NOT mount over /app/.next)

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV STORAGE_ROOT=/app/storage
# Generate the Prisma client (build-time only; placeholder URL — no DB access,
# real DATABASE_URL is injected at runtime and never baked into the image).
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV STORAGE_ROOT=/app/storage
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user and runtime-writable directories BEFORE artifact copy.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p \
       /app/.next/cache/images \
       /app/storage/uploads/hero \
       /app/storage/uploads/events \
       /app/storage/uploads/brands \
       /app/storage/uploads/reviews \
       /app/storage/uploads/testimonials \
       /app/storage/uploads/logos \
       /app/storage/uploads/cms \
  && chown -R nextjs:nodejs /app/storage /app/.next

# Copy build artifacts with nextjs ownership so runtime cache/prerender writes succeed.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Re-assert cache dirs + ownership after COPY (COPY can replace /app/.next tree).
RUN mkdir -p /app/.next/cache/images \
  && chmod +x /app/scripts/docker-entrypoint.sh \
  && chown -R nextjs:nodejs /app/.next /app/storage /app/scripts

USER nextjs

EXPOSE 3000

# Do not bake secrets into ARG/ENV — DATABASE_URL/CMS_STORAGE injected at runtime.
# Entrypoint runs `prisma migrate deploy` once (only when DATABASE_URL is set),
# then starts Next.js. Never uses migrate dev / db push / reset.
CMD ["sh", "./scripts/docker-entrypoint.sh"]
