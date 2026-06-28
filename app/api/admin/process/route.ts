import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import { createId } from "@/lib/cms/id";
import type { CMSProcessStep } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.processSteps ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.title?.trim()) return jsonError("Title is required.");

  const existing = await readCMSContent();
  const nextStep = existing.processSteps.length + 1;

  const newItem: CMSProcessStep = {
    id: createId("step"),
    step: String(body.step ?? String(nextStep).padStart(2, "0")),
    title: String(body.title).trim(),
    description: String(body.description ?? "").trim(),
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Date.now(),
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    processSteps: [...(c.processSteps ?? []), newItem],
  }));

  return jsonOk(updated.processSteps, 201);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body)) return jsonError("Expected array of process steps.");

  const updated = await updateCMSContent((c) => ({
    ...c,
    processSteps: body as CMSProcessStep[],
  }));

  return jsonOk(updated.processSteps);
}
