import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { requireAdmin, jsonOk } from "@/lib/cms/api";
import { CMS_CACHE_TAG } from "@/lib/cms/revalidate-public";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    try {
      updateTag(CMS_CACHE_TAG);
    } catch {
      // Fallback below.
    }
    revalidateTag(CMS_CACHE_TAG, { expire: 0 });
  } catch (err) {
    console.warn("[api/admin/revalidate] tag invalidate failed:", err);
  }

  // Path invalidation must not depend on tag success — otherwise published
  // Reviews can stay visible on the homepage after deactivate.
  revalidatePath("/", "page");
  revalidatePath("/realisations/events", "page");
  revalidatePath("/realisations/brands", "page");
  revalidatePath("/realisations/events/[slug]", "page");
  revalidatePath("/realisations/brands/[slug]", "page");
  revalidatePath("/", "layout");

  return jsonOk({ revalidated: true, at: new Date().toISOString() });
}
