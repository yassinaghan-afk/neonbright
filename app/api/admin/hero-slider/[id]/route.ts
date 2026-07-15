import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { safeUpdateHeroSlide } from "@/lib/cms/safe-update";
import type { CMSHeroSlide } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body");

  let found: CMSHeroSlide | undefined;
  await updateCMSContent((c) => ({
    ...c,
    heroSlides: c.heroSlides.map((s) => {
      if (s.id !== id) return s;
      // Use safe update to preserve unchanged fields.
      const updated = safeUpdateHeroSlide(s, body);
      found = updated;
      return updated;
    }),
  }));

  if (!found) return jsonError("Not found", 404);
  return jsonOk(found);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;

  let existed = false;
  await updateCMSContent((c) => {
    existed = c.heroSlides.some((s) => s.id === id);
    const heroSlides = c.heroSlides
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, sortOrder: i }));
    return { ...c, heroSlides };
  });

  if (!existed) return jsonError("Not found", 404);
  return jsonOk({ success: true });
}
