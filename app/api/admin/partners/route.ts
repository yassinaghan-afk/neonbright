import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSPartner } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.partners);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.name) return jsonError("Name is required");

  const item: CMSPartner = {
    id: createId("partner"),
    name: body.name,
    logoUrl: body.logoUrl ?? "",
  };

  await updateCMSContent((c) => ({
    ...c,
    partners: [...c.partners, item],
  }));

  return jsonOk(item, 201);
}
