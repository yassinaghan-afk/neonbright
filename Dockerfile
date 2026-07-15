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
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Re-assert cache dirs + ownership after COPY (COPY can replace /app/.next tree).
RUN mkdir -p /app/.next/cache/images \
  && chown -R nextjs:nodejs /app/.next /app/storage

USER nextjs

EXPOSE 3000

# Do not bake secrets into ARG/ENV — inject at runtime via EasyPanel.
CMD ["npm", "run", "start"]
