import { revalidatePath } from "next/cache";

const PUBLIC_PATHS = ["/", "/realisations/events", "/realisations/brands"];

/** Bust Next.js route/layout caches after CMS writes. */
export function revalidatePublicSite(): void {
  try {
    for (const p of PUBLIC_PATHS) {
      revalidatePath(p, "page");
    }
    revalidatePath("/", "layout");
  } catch {
    // OK during build or non-revalidatable contexts
  }
}
