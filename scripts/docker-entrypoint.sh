#!/bin/sh
# Neon Bright production entrypoint.
#
# Runs Prisma migrations once (prisma migrate deploy — never migrate dev,
# never db push, never reset) before starting Next.js, and only when a
# database is configured. JSON mode (default) starts instantly.
#
# DATABASE_URL is injected at runtime by EasyPanel — never baked into the image.

set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] DATABASE_URL detected — running prisma migrate deploy"
  npx prisma migrate deploy
  echo "[entrypoint] migrations complete"
else
  echo "[entrypoint] no DATABASE_URL — skipping migrations (CMS_STORAGE=json)"
fi

exec npm run start
