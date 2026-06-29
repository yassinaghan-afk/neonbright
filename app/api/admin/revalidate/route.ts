import { revalidatePath } from "next/cache";
import { requireAdmin, jsonOk } from "@/lib/cms/api";
import { NextRequest } from "next/server";

const ALL_PATHS = [
  "/",
  "/realisations/events",
  "/realisations/brands",
];

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const paths: string[] = body.paths ?? ALL_PATHS;

  // Revalidate route cache for all CMS-dependent public paths.
  // Public pages are force-dynamic so this mainly helps any cached layouts.
  for (const p of paths) {
    revalidatePath(p, "page");
  }
  revalidatePath("/", "layout");

  return jsonOk({ revalidated: paths, at: new Date().toISOString() });
}
