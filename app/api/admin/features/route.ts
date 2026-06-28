import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import { createId } from "@/lib/cms/id";
import type { CMSFeature } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.features ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.title?.trim()) return jsonError("Title is required.");

  const newItem: CMSFeature = {
    id: createId("feat"),
    title: String(body.title).trim(),
    description: String(body.description ?? "").trim(),
    icon: String(body.icon ?? "✦").trim(),
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Date.now(),
    enabled: body.enabled !== false,
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    features: [...(c.features ?? []), newItem],
  }));

  return jsonOk(updated.features, 201);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body)) return jsonError("Expected array of features.");

  const updated = await updateCMSContent((c) => ({
    ...c,
    features: body as CMSFeature[],
  }));

  return jsonOk(updated.features);
}
