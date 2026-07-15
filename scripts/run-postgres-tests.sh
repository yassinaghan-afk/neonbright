#!/usr/bin/env bash
# Provision an ISOLATED throwaway PostgreSQL instance, apply the Prisma
# migration, run the CMS migration test suite, prove backup/restore into a
# second empty database, then tear everything down.
#
# Requires local postgres binaries (initdb/pg_ctl/psql/pg_dump).
# Never touches production. Never touches /app/storage.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGDIR="$(mktemp -d /tmp/neonbright-pgtest.XXXXXX)"
PGDATA="$PGDIR/data"
PGPORT="${PGTEST_PORT:-54329}"
PGUSER="cmstest"
DBNAME="neonbright_cms_test"
RESTORE_DBNAME="neonbright_cms_restore_test"

cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$PGDIR"
}
trap cleanup EXIT

echo "── Provisioning isolated Postgres at $PGDIR (port $PGPORT)"
initdb -D "$PGDATA" -U "$PGUSER" --auth=trust >/dev/null
pg_ctl -D "$PGDATA" -o "-p $PGPORT -c listen_addresses=127.0.0.1" -l "$PGDIR/pg.log" start >/dev/null
createdb -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" "$DBNAME"

export DATABASE_URL="postgresql://$PGUSER@127.0.0.1:$PGPORT/$DBNAME"
echo "── DATABASE_URL=$DATABASE_URL"

echo "── Applying Prisma migration (migrate deploy)"
cd "$REPO_ROOT"
npx prisma migrate deploy

echo "── Running CMS Postgres migration test suite"
npx --yes tsx --test tests/cms-postgres-migration.test.ts

echo "── Backup/restore drill: pg_dump → restore into empty database"
pg_dump -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" -Fc "$DBNAME" > "$PGDIR/cms-backup.dump"
createdb -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" "$RESTORE_DBNAME"
pg_restore -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" -d "$RESTORE_DBNAME" "$PGDIR/cms-backup.dump"

ORIG_COUNT=$(psql -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" -d "$DBNAME" -tAc 'SELECT count(*) FROM "PortfolioProject"')
REST_COUNT=$(psql -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" -d "$RESTORE_DBNAME" -tAc 'SELECT count(*) FROM "PortfolioProject"')
if [ "$ORIG_COUNT" != "$REST_COUNT" ]; then
  echo "✖ Restore drill failed: $ORIG_COUNT projects in source, $REST_COUNT after restore"
  exit 1
fi
echo "✓ Restore drill passed ($REST_COUNT projects restored into empty database)"

echo ""
echo "ALL POSTGRES MIGRATION TESTS PASSED"
