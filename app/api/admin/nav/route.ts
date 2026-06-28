import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import { createId } from "@/lib/cms/id";
import type { CMSNavLink } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.nav ?? []);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body)) return jsonError("Expected array of nav links.");

  const updated = await updateCMSContent((c) => ({
    ...c,
    nav: body as CMSNavLink[],
  }));

  return jsonOk(updated.nav);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.label?.trim() || !body.href?.trim()) {
    return jsonError("Label and href are required.");
  }

  const newItem: CMSNavLink = {
    id: createId("nav"),
    label: String(body.label).trim(),
    href: String(body.href).trim(),
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Date.now(),
    enabled: body.enabled !== false,
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    nav: [...(c.nav ?? []), newItem],
  }));

  return jsonOk(updated.nav, 201);
}
