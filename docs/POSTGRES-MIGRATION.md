# Neon Bright CMS — JSON → PostgreSQL Migration Runbook

Structured CMS data moves to PostgreSQL. **Media files stay in
`/app/storage/uploads` and are never moved or deleted.**

## Storage modes (`CMS_STORAGE`)

| Mode | Reads | Writes | Purpose |
|---|---|---|---|
| `json` (default) | JSON file | JSON file | Current production behavior — unchanged until approval |
| `compare` | JSON file | JSON file | Also reads PostgreSQL in the background and logs `[cms-compare]` count mismatches. Never writes to PostgreSQL. |
| `postgres` | PostgreSQL | PostgreSQL (transactions) | Final state. JSON becomes read-only emergency rollback data. No dual writes. |

The default is `json`. Do not set `CMS_STORAGE=postgres` until the import has
been applied and verified.

## Migration procedure (production)

All commands run inside the app container (EasyPanel → Console), where
`DATABASE_URL` and `STORAGE_ROOT=/app/storage` are already set.

```bash
# 0. Schema — applied automatically at container start by the entrypoint
#    (prisma migrate deploy). To run manually:
npx prisma migrate deploy

# 1. Dry run — validates JSON, prints per-collection counts, writes NOTHING
npm run cms:db:import:dry

# 2. Apply — creates a timestamped JSON backup, then imports inside ONE
#    transaction (rolls back completely if any record fails; idempotent;
#    never deletes existing rows)
npm run cms:db:import

# 3. Verify — compares JSON vs database (counts, IDs, slugs, categoryIds,
#    published, sortOrder). Exits non-zero on any mismatch.
npm run cms:db:verify
```

Then flip modes gradually:

1. Set `CMS_STORAGE=compare`, restart, watch logs for `[cms-compare]`
   mismatches for a day.
2. If clean, set `CMS_STORAGE=postgres` and restart.
3. Keep `/app/storage/cms-content.json` untouched as rollback data.

## Backup and restore

### PostgreSQL backup

```bash
pg_dump "$DATABASE_URL" -Fc > cms-backup-$(date +%Y%m%d-%H%M%S).dump
```

### PostgreSQL restore

```bash
# Restore into an EMPTY database (never overwrite a live one blindly):
createdb -T template0 neonbright_cms_restored
pg_restore -d "postgresql://USER:PASS@HOST:5432/neonbright_cms_restored" cms-backup-XXXX.dump
```

The restore procedure has been proven by `scripts/run-postgres-tests.sh`,
which dumps the test database and restores it into a separate empty database,
then compares row counts.

### Rollback to JSON (emergency)

1. Set `CMS_STORAGE=json` in EasyPanel environment.
2. Restart the service.
3. The app immediately serves from `/app/storage/cms-content.json` again —
   no database required. (This file is never modified while in postgres mode.)

Note: Admin edits made while in postgres mode are not in the JSON file. To
capture them before rollback, re-export or accept the JSON state as of cutover.

## Verification queries

```sql
-- Collection counts
SELECT 'projects' AS t, count(*) FROM "PortfolioProject"
UNION ALL SELECT 'categories', count(*) FROM "PortfolioCategory"
UNION ALL SELECT 'media', count(*) FROM "ProjectMedia"
UNION ALL SELECT 'reviews', count(*) FROM "Review"
UNION ALL SELECT 'testimonials', count(*) FROM "Testimonial"
UNION ALL SELECT 'instagram', count(*) FROM "InstagramPost"
UNION ALL SELECT 'heroSlides', count(*) FROM "HeroSlide"
UNION ALL SELECT 'partners', count(*) FROM "Partner";

-- Published Events / Brands
SELECT "categoryId", count(*) FILTER (WHERE published) AS published, count(*) AS total
FROM "PortfolioProject" GROUP BY "categoryId";

-- Latest revision (audit trail)
SELECT * FROM "CmsRevision" ORDER BY "createdAt" DESC LIMIT 5;
```

## Database health check

```bash
psql "$DATABASE_URL" -c "SELECT 1"                      # connectivity
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"PortfolioProject\""
npx prisma migrate status                                # migrations applied?
```

## Migration recovery procedure

- **Import failed mid-way** → nothing was committed (single transaction).
  Fix the reported record and rerun `npm run cms:db:import` (idempotent).
- **Verify reports mismatches** → stay on `CMS_STORAGE=json`, rerun the
  import, verify again.
- **App errors in postgres mode** → rollback to JSON (above), investigate
  with the health-check commands.
- **Database lost** → restore latest `pg_dump`, or re-import from
  `/app/storage/cms-content.json` (or its timestamped backups under
  `/app/storage/backups/`).

## Production migration rules

- Schema changes ship as committed files in `prisma/migrations/`.
- Deployment runs `prisma migrate deploy` once at container start
  (`scripts/docker-entrypoint.sh`) — never `migrate dev`, never `db push`,
  never reset.
- `DATABASE_URL` is injected at runtime by EasyPanel; it is never a Docker
  build argument and never baked into the image.

## Isolated test suite

```bash
bash scripts/run-postgres-tests.sh
```

Provisions a throwaway local PostgreSQL (initdb + pg_ctl), applies the
migration, runs `tests/cms-postgres-migration.test.ts` (14 tests: counts,
ID/slug parity, media URLs, idempotency, partial updates, scoped reorder,
scoped deletion, custom-field survival, 404 lookups), performs the
pg_dump → empty-database restore drill, then destroys everything. Never
touches production data.
