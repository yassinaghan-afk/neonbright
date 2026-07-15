import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { safeUpdateFeature } from "@/lib/cms/safe-update";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const updated = await updateCMSContent((c) => ({
    ...c,
    features: (c.features ?? []).map((item) =>
      item.id === id ? safeUpdateFeature(item, body) : item
    ),
  }));

  const item = updated.features.find((f) => f.id === id);
  if (!item) return jsonError("Feature not found.", 404);
  return jsonOk(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  await updateCMSContent((c) => ({
    ...c,
    features: (c.features ?? []).filter((item) => item.id !== id),
  }));

  return jsonOk({ deleted: id });
}
