import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const updated = await updateCMSContent((c) => ({
    ...c,
    faq: (c.faq ?? []).map((item) =>
      item.id === id ? { ...item, ...body, id } : item
    ),
  }));

  const item = updated.faq.find((f) => f.id === id);
  if (!item) return jsonError("FAQ item not found.", 404);
  return jsonOk(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  await updateCMSContent((c) => ({
    ...c,
    faq: (c.faq ?? []).filter((item) => item.id !== id),
  }));

  return jsonOk({ deleted: id });
}
