import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { safeUpdateService } from "@/lib/cms/safe-update";
import type { CMSService } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body");

  let found: CMSService | undefined;
  await updateCMSContent((c) => ({
    ...c,
    services: c.services.map((s) => {
      if (s.id !== id) return s;
      const updated = safeUpdateService(s, body);
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
    existed = c.services.some((s) => s.id === id);
    return { ...c, services: c.services.filter((s) => s.id !== id) };
  });

  if (!existed) return jsonError("Not found", 404);
  return jsonOk({ success: true });
}
