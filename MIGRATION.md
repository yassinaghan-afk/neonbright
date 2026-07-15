# Vercel Blob → Local Storage (EasyPanel)

## Canonical storage path

```
STORAGE_ROOT=/app/storage
```

| Asset | Path |
|-------|------|
| CMS JSON | `$STORAGE_ROOT/cms-content.json` → `/app/storage/cms-content.json` |
| Uploads | `$STORAGE_ROOT/uploads/...` → `/app/storage/uploads/...` |

Local development default (when `STORAGE_ROOT` unset): `<cwd>/storage`.

All application code resolves paths via `lib/cms/storage-paths.ts` (`getStorageRoot()`).

## Public URL format

```
/uploads/{category}/{filename}
```

Rewrite in `next.config.ts`:

```
/uploads/:path*  →  /api/uploads/:path*
```

Categories: `hero`, `events`, `brands`, `reviews`, `testimonials`, `logos`, `cms`.

Legacy Vercel Blob URLs continue to display until the (optional) Blob→local media migration is run.

## EasyPanel volume

Mount a persistent volume at:

```
/app/storage
```

Set env:

```
STORAGE_ROOT=/app/storage
```

Do not bake secrets into the image. Inject auth secrets at runtime.

## CMS bootstrap

On first read/write:

1. If `/app/storage/cms-content.json` exists → **never overwrite** (log: bootstrap skipped).
2. If missing → atomically copy bundled `data/cms-content.json` once (log: bootstrap performed).
3. Defaults are only returned in-memory if bootstrap fails; they are **not** written over an existing file.

## Import production CMS snapshot (do not run until approved)

Dry-run:

```bash
cd neonbright
node scripts/import-cms-content.mjs \
  --source "/Users/herofamily1/Downloads/content-before-recovery-2026-07-15.json" \
  --dry-run \
  --storage-root "./storage"
```

Apply (writes `$STORAGE_ROOT/cms-content.json`, backs up if target exists):

```bash
STORAGE_ROOT=/app/storage node scripts/import-cms-content.mjs \
  --source "/path/to/content-before-recovery-2026-07-15.json" \
  --apply
```

## Docker

```bash
docker build -t neonbright .
# volume: -v easypanel_volume:/app/storage
```

Persistence proof (local named volume, not production):

```bash
npm run test:docker-persist
```

## Blob media migration

`scripts/migrate-blob-to-local.ts` — **do not run yet**.

## Removed

- `@vercel/blob`, `@vercel/oidc`
- `lib/cms/blob-client.ts`
- `/api/admin/upload/blob/presign`
- Dependency on `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID`
