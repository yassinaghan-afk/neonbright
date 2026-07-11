import { revalidatePath, revalidateTag, updateTag } from "next/cache";

export const CMS_CACHE_TAG = "cms-content";

/** Fallback ISR interval (seconds). Admin writes bust CMS_CACHE_TAG immediately. */
export const PUBLIC_PAGE_REVALIDATE = 3600;

/**
 * Bust Next.js data + route caches after CMS writes.
 *
 * Uses updateTag (immediate expire) plus revalidateTag({ expire: 0 }) so the
 * next public request cannot serve a stale unstable_cache CMS snapshot.
 */
export function revalidatePublicSite(): void {
  try {
    // Immediate: expire tagged entries now (required for Admin → site sync).
    try {
      updateTag(CMS_CACHE_TAG);
    } catch {
      // updateTag is preferred in Next 16; fall through to revalidateTag.
    }
    revalidateTag(CMS_CACHE_TAG, { expire: 0 });

    // Invalidate all public page segments.
    revalidatePath("/", "page");
    revalidatePath("/realisations/events", "page");
    revalidatePath("/realisations/brands", "page");
    // Invalidate all dynamic slug pages under these routes.
    revalidatePath("/realisations/events/[slug]", "page");
    revalidatePath("/realisations/brands/[slug]", "page");
    // Invalidate the root layout (covers contact, company, nav across all routes).
    revalidatePath("/", "layout");
    console.log("[cms-sync] revalidate-public: paths invalidated");
  } catch (err) {
    console.warn("[cms-sync] revalidate-public: failed (ok during build):", err);
  }
}
