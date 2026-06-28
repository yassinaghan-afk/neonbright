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
  const tags: string[] = body.tags ?? [];

  for (const p of paths) {
    revalidatePath(p, "page");
  }
  // Revalidate dynamic layout routes too
  revalidatePath("/", "layout");

  // revalidateTag is not used in this project's Next.js version — skip tags silently

  return jsonOk({ revalidated: paths, tags, at: new Date().toISOString() });
}
