# NeonBright — EasyPanel production image (Next.js + local STORAGE_ROOT)
# Volume mount required: /app/storage

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

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/storage/uploads/hero \
             /app/storage/uploads/events \
             /app/storage/uploads/brands \
             /app/storage/uploads/reviews \
             /app/storage/uploads/testimonials \
             /app/storage/uploads/logos \
             /app/storage/uploads/cms \
  && chown -R nextjs:nodejs /app/storage

COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

USER nextjs

EXPOSE 3000

# Do not bake secrets into ARG/ENV — inject at runtime via EasyPanel.
CMD ["npm", "run", "start"]
