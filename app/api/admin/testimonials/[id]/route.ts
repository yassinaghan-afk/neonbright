import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import { updateCMSContent } from "@/lib/cms/store";
import { parseTestimonialInput } from "@/lib/cms/testimonials";
import type { CMSTestimonial } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid body");

  let found: CMSTestimonial | undefined;
  const updated = await updateCMSContent((c) => ({
    ...c,
    testimonials: c.testimonials.map((t) => {
      if (t.id !== id) return t;
      const next = parseTestimonialInput(body as Record<string, unknown>, t);
      found = { ...next, id: t.id };
      return found;
    }),
  }));

  if (!found) return jsonError("Not found", 404);
  revalidatePublicSite();
  return jsonOk(updated.testimonials.find((t) => t.id === id) ?? found);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;

  let existed = false;
  const updated = await updateCMSContent((c) => {
    existed = c.testimonials.some((t) => t.id === id);
    // Remove item and preserve relative order of remaining testimonials.
    const next = c.testimonials
      .filter((t) => t.id !== id)
      .map((t, i) => ({ ...t, sortOrder: i }));
    return { ...c, testimonials: next };
  });

  if (!existed) return jsonError("Not found", 404);
  revalidatePublicSite();
  return jsonOk({ success: true, testimonials: updated.testimonials });
}
