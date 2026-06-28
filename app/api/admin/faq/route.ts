import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import { createId } from "@/lib/cms/id";
import type { CMSFAQItem } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.faq ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.question?.trim() || !body.answer?.trim()) {
    return jsonError("Question and answer are required.");
  }

  const newItem: CMSFAQItem = {
    id: createId("faq"),
    question: String(body.question).trim(),
    answer: String(body.answer).trim(),
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Date.now(),
    enabled: body.enabled !== false,
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    faq: [...(c.faq ?? []), newItem],
  }));

  return jsonOk(updated.faq, 201);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body)) return jsonError("Expected array of FAQ items.");

  const updated = await updateCMSContent((c) => ({
    ...c,
    faq: body as CMSFAQItem[],
  }));

  return jsonOk(updated.faq);
}
