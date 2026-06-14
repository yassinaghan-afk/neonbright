import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import type { CMSTestimonial } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body");

  let found: CMSTestimonial | undefined;
  await updateCMSContent((c) => ({
    ...c,
    testimonials: c.testimonials.map((t) => {
      if (t.id !== id) return t;
      const updated: CMSTestimonial = { ...t, ...body, id: t.id };
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
    existed = c.testimonials.some((t) => t.id === id);
    return { ...c, testimonials: c.testimonials.filter((t) => t.id !== id) };
  });

  if (!existed) return jsonError("Not found", 404);
  return jsonOk({ success: true });
}
