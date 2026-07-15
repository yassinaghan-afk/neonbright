# Instagram Public Section Fix Report

**Date**: July 16, 2026  
**Status**: Complete — awaiting approval (no commit / push / deploy)

---

## Why only one image was displayed

Two stacked bugs:

1. **Admin multi-upload collapsed into one CMS record**  
   `InstagramPostsManager` used `GalleryUploadField` and wrote:
   - `image: urls[0]`
   - `carouselImages: urls.slice(1)`  
   So uploading 10 files created **1 post**, not 10.

2. **Public marquee only rendered `post.image`**  
   Carousel slides in `carouselImages` were never shown on the homepage.  
   With one post (or few posts) and only **2** track copies, the track was often narrower than the viewport → **one centered card + large empty black area**.

Admin was **overwriting** the posts array on save with that collapsed 1-record payload. It did not preserve prior posts as separate records when a multi-file “gallery” edit was applied.

---

## Final multiple-upload behavior

Admin → Instagram → **Ajouter des publications**:

- Select many images in one action (`multiple` file input / drag-drop).
- Each file uploads to `/uploads/instagram/<filename>`.
- Each file **appends** an independent post: `{ id, image, instagramUrl, altText, enabled, sortOrder, createdAt, updatedAt }`.
- Never replaces the full list with only the first image.
- Never collapses into one record with `carouselImages`.
- Per-post: URL edit, Public/Masqué, delete, reorder.
- Save returns the full canonical array from the API.

Legacy posts that still have `carouselImages` are expanded into separate posts by `normalizeInstagramPosts` / `expandCarouselIntoPosts` on read/save.

---

## Seamless-loop implementation

- Public track: `buildMarqueeTrack(posts, copies)` — animation-only duplication (not written to CMS).
- `copies = computeMarqueeCopies(count, viewportWidth, setWidth)` so track ≥ **2× viewport**.
- CSS: `translate3d(calc(-100% / var(--ig-marquee-copies)), 0, 0)` — distance = **exactly one original set**.
- Cards: `flex-shrink: 0`, ~180–290px responsive widths, small gap, full-width row.
- RTL continuous linear animation; pause on hover / lightbox open; `prefers-reduced-motion` respected.
- Popup shows `N / total`, arrows, keyboard, swipe, “Voir sur Instagram” with per-post URL (profile fallback).

---

## Files modified

| File | Change |
|------|--------|
| `components/admin/InstagramPostsManager.tsx` | Multi-upload → one post per image (append) |
| `components/instagram/InstagramMarqueeRow.tsx` | Full-width marquee + measured copy count |
| `components/instagram/InstagramMarqueeShowcase.tsx` | Pause while modal open; profile fallback URL |
| `components/instagram/InstagramShowcasePostModal.tsx` | Position `4 / 10` |
| `lib/cms/instagram-normalize.ts` | Expand carousel → separate posts |
| `lib/instagram/marquee.ts` | **New** — copy/track helpers |
| `lib/cms/storage-paths.ts` | Add `instagram` upload category |
| `app/api/admin/upload/route.ts` | Map `instagram` preset → category |
| `app/globals.css` | Variable-based seamless translate |
| `tests/instagram-marquee.test.ts` | **New** — 10-post + loop tests |

---

## Test results

```
npx tsx --test tests/instagram-marquee.test.ts
✔ 10/10 passed
```

Covered: 10 posts, append #11, carousel expand, hide one, per-URL, seamless handoff, 3-post fill, 1-post fill, no CMS mutation.

**Tested number of posts**: 10 (plus 1, 3, 11 scenarios)

**Build**: `npm run build` — **SUCCESS** (exit 0)

---

## Confirmations

- Events / Brands / Reviews / Testimonials / Hero / Partners: not modified
- Existing Instagram posts: not deleted (legacy carousel expanded into records)
- Production CMS: not written by tests
- No commit, push, or deploy
