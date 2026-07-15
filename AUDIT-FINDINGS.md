# CMS DATA FLOW AUDIT - CRITICAL FINDINGS

**Date:** 2026-07-15  
**Scope:** Complete Admin → Storage → Public data flow audit  
**Status:** IN PROGRESS

---

## EXECUTIVE SUMMARY

Multiple **CRITICAL** data integrity vulnerabilities found that can cause:
- Lost updates due to race conditions
- Data loss from unsafe partial updates
- Stale reads from module-level memory cache
- No protection against concurrent writes

---

## CRITICAL ISSUES

### 1. ⚠️ UNSAFE PARTIAL UPDATES (SEVERITY: CRITICAL)

**Problem:** Multiple mutation routes use dangerous spread operator pattern:
```typescript
const updated = { ...existing, ...body };
```

This CANNOT distinguish between:
- Field omitted from request → should PRESERVE existing value
- Field is `undefined` in request → OVERWRITES existing value with undefined

**Impact:** Publish-only updates like `{ published: false }` can accidentally clear other fields if client sends `undefined` values.

**Affected Routes:**
- `/api/admin/portfolio/projects/[id]` (line 13) 
- `/api/admin/hero-slider/[id]` (line 19-23)
- `/api/admin/partners/[id]` (line 20)

**Safe Pattern:** Testimonials route uses `parseTestimonialInput` which explicitly checks each field:
```typescript
quote: body.quote !== undefined ? String(body.quote) : base.quote
```

**Fix Required:** Create safe update helpers for ALL mutation types.

---

### 2. ⚠️ NO CONCURRENCY CONTROL (SEVERITY: CRITICAL)

**Problem:** `updateCMSContent` uses read-modify-write with NO locking:

```typescript
export async function updateCMSContent(updater) {
  const current = await readCMSContentFresh(); // Request A reads at T0
  const next = await writeCMSContent(updater(current)); // Request A writes at T2
  // Request B reads at T1 (between A's read and write)
  // Request B writes at T3
  // Result: A's changes are LOST
}
```

**Impact:** Simultaneous saves to different sections can cause lost updates.

**Example Race Condition:**
```
T0: Admin A reads CMS (10 projects, 5 testimonials)
T1: Admin B reads CMS (10 projects, 5 testimonials) 
T2: Admin A writes (11 projects, 5 testimonials) ← adds project
T3: Admin B writes (10 projects, 6 testimonials) ← OVERWRITES A's project!
```

**Fix Required:** File-based exclusive lock or serialized mutation queue.

---

### 3. ⚠️ MODULE-LEVEL MEMORY CACHE (SEVERITY: HIGH)

**Problem:** `lib/cms/store.ts` has module-scoped variable:
```typescript
let memoryCMS: CMSContent | null = null;
```

**Impact:** 
- Cached value persists across different requests in same process
- Can serve stale data even after file write
- `readCMSContent` returns cached value without checking file staleness

**Fix Required:** Remove memory cache or make it request-scoped only.

---

### 4. NO REVISION TRACKING (SEVERITY: HIGH)

**Problem:** No versioning to detect stale writes.

**Impact:** Cannot implement optimistic concurrency control without revisions.

**Fix Required:** Add `revision: number` to CMS root, increment on each write, reject stale writes with HTTP 409.

---

### 5. NO AUTOMATED BACKUPS (SEVERITY: MEDIUM)

**Problem:** `atomicWriteFile` has no backup mechanism.

**Impact:** No safety net for accidental destructive operations.

**Fix Required:** 
- Create timestamped backups before writes
- Keep rotating history (e.g., last 30 versions)
- Include restore utility

---

### 6. CACHE INVALIDATION (SEVERITY: MEDIUM)

**Current:** `revalidatePublicSite()` invalidates:
- `/` (page)
- `/realisations/events` (page)
- `/realisations/brands` (page)
- `/realisations/events/[slug]` (page)
- `/realisations/brands/[slug]` (page)
- `/` (layout)

**Missing:**
- No slug-specific invalidation when slug changes
- No tag-based invalidation for unchanged slugs
- API routes `/api/portfolio`, `/api/public/homepage` not invalidated

**Fix Required:** Comprehensive invalidation including old slugs, APIs, metadata routes.

---

## DATA FLOW MATRIX

### Events/Brands (HIGHEST PRIORITY)

| Component | File | Function | Safety Status |
|-----------|------|----------|---------------|
| Admin Form | `app/admin/portfolio/events/page.tsx` | N/A | ⚠️ TO AUDIT |
| POST (Create) | `app/api/admin/portfolio/projects/route.ts:25` | ✅ SAFE | Creates full object |
| PUT (Update) | `app/api/admin/portfolio/projects/[id]/route.ts:51` | ⚠️ UNSAFE | Uses spread operator |
| DELETE | `app/api/admin/portfolio/projects/[id]/route.ts:94` | ✅ SAFE | Filter only |
| Storage Write | `lib/cms/store.ts:295` | ⚠️ NO LOCK | No concurrency control |
| Storage Read | `lib/cms/store.ts:287` | ⚠️ CACHED | Uses module-level cache |
| Public API | `app/api/portfolio/route.ts` | ⚠️ TO AUDIT | |
| Public Listing | `app/realisations/events/page.tsx` | ⚠️ TO AUDIT | |
| Public Detail | `app/realisations/events/[slug]/page.tsx` | ✅ DYNAMIC | `force-dynamic` |
| Transform | `lib/cms/portfolio.ts:78` | ✅ SAFE | Read-only transform |

### Hero Slides

| Component | File | Function | Safety Status |
|-----------|------|----------|---------------|
| PUT (Update) | `app/api/admin/hero-slider/[id]/route.ts:7` | ⚠️ UNSAFE | Uses spread operator |
| DELETE | `app/api/admin/hero-slider/[id]/route.ts:33` | ✅ SAFE | Filter + reindex |

### Partners

| Component | File | Function | Safety Status |
|-----------|------|----------|---------------|
| PUT (Update) | `app/api/admin/partners/[id]/route.ts:8` | ⚠️ UNSAFE | Uses spread operator |
| DELETE | `app/api/admin/partners/[id]/route.ts:31` | ✅ SAFE | Filter only |

### Testimonials

| Component | File | Function | Safety Status |
|-----------|------|----------|---------------|
| PUT (Update) | `app/api/admin/testimonials/[id]/route.ts:9` | ✅ SAFE | Uses `parseTestimonialInput` |
| DELETE | `app/api/admin/testimonials/[id]/route.ts:32` | ✅ SAFE | Filter only |

---

## IMPLEMENTATION PLAN

### Phase 1: Core Infrastructure (IN PROGRESS)
1. ✅ Create audit document
2. ⏳ Implement file-based mutex lock
3. ⏳ Add revision tracking to CMS schema
4. ⏳ Create automated backup system
5. ⏳ Create safe partial update helpers

### Phase 2: Fix Unsafe Routes
1. Fix portfolio projects PUT route
2. Fix hero slider PUT route
3. Fix partners PUT route
4. Audit and fix remaining routes

### Phase 3: Cache & Validation
1. Remove/fix memory cache
2. Comprehensive cache invalidation
3. Add server-side validation for all inputs

### Phase 4: Testing
1. Integration tests for concurrent writes
2. Integration tests for partial updates
3. Events/Brands full parity tests
4. Production smoke tests

### Phase 5: Observability
1. Structured mutation logging
2. Backup/restore logging
3. Lock contention logging

---

## NOTES

- All changes implemented with NO modification to production CMS data
- All changes tested locally before commit
- No deploy until user approval
