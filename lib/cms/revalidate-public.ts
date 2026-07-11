import { revalidatePath, revalidateTag, updateTag } from "next/cache";

export const CMS_CACHE_TAG = "cms-content";

/** Fallback ISR interval (seconds). Admin writes bust CMS_CACHE_TAG immediately. */
export const PUBLIC_PAGE_REVALIDATE = 3600;

/**
 * Bust Next.js data + route caches after CMS writes.
 *
 * Tag invalidation and path invalidation are isolated so a tag API failure
 * can never skip revalidatePath (that left the homepage showing stale
 * published Reviews after deactivate).
 */
export function revalidatePublicSite(): void {
  // 1) Immediate expire of tagged unstable_cache entries (CMS blob snapshot).
  try {
    try {
      updateTag(CMS_CACHE_TAG);
    } catch {
      // updateTag is preferred in Next 16; fall through to revalidateTag.
    }
    revalidateTag(CMS_CACHE_TAG, { expire: 0 });
  } catch (err) {
    console.warn("[cms-sync] revalidate-public: tag invalidate failed:", err);
  }

  // 2) Invalidate public page / layout segments — must run even if tags failed.
  try {
    revalidatePath("/", "page");
    revalidatePath("/realisations/events", "page");
    revalidatePath("/realisations/brands", "page");
    revalidatePath("/realisations/events/[slug]", "page");
    revalidatePath("/realisations/brands/[slug]", "page");
    revalidatePath("/", "layout");
    console.log("[cms-sync] revalidate-public: paths invalidated");
  } catch (err) {
    console.warn("[cms-sync] revalidate-public: path invalidate failed:", err);
  }
}
