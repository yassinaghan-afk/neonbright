import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import type { CMSPartner } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body");

  let found: CMSPartner | undefined;
  await updateCMSContent((c) => ({
    ...c,
    partners: c.partners.map((p) => {
      if (p.id !== id) return p;
      const updated: CMSPartner = { ...p, ...body, id: p.id };
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
    existed = c.partners.some((p) => p.id === id);
    return { ...c, partners: c.partners.filter((p) => p.id !== id) };
  });

  if (!existed) return jsonError("Not found", 404);
  return jsonOk({ success: true });
}
