import { revalidatePath } from "next/cache";
import { requireAdmin, jsonOk } from "@/lib/cms/api";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Revalidate every public page and the root layout after any CMS change.
  revalidatePath("/", "page");
  revalidatePath("/realisations/events", "page");
  revalidatePath("/realisations/brands", "page");
  revalidatePath("/realisations/events/[slug]", "page");
  revalidatePath("/realisations/brands/[slug]", "page");
  revalidatePath("/", "layout");

  return jsonOk({ revalidated: true, at: new Date().toISOString() });
}
