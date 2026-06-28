import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import { createId } from "@/lib/cms/id";
import type { CMSIndustry } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.industries ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.name?.trim()) return jsonError("Name is required.");

  const newItem: CMSIndustry = {
    id: createId("ind"),
    name: String(body.name).trim(),
    icon: String(body.icon ?? "✨").trim(),
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Date.now(),
    enabled: body.enabled !== false,
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    industries: [...(c.industries ?? []), newItem],
  }));

  return jsonOk(updated.industries, 201);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body)) return jsonError("Expected array of industries.");

  const updated = await updateCMSContent((c) => ({
    ...c,
    industries: body as CMSIndustry[],
  }));

  return jsonOk(updated.industries);
}
