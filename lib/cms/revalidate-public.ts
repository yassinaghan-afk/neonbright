import { revalidatePath } from "next/cache";

/** Bust Next.js route/layout caches after CMS writes. */
export function revalidatePublicSite(): void {
  try {
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
