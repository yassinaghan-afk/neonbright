import { NextRequest } from "next/server";
import { jsonOk, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.instagram);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));

  const updated = await updateCMSContent((c) => ({
    ...c,
    instagram: { ...c.instagram, ...body },
  }));

  return jsonOk(updated.instagram);
}
