import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSService } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.services);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.title) return jsonError("Title is required");

  const item: CMSService = {
    id: createId("svc"),
    title: body.title,
    description: body.description ?? "",
    icon: body.icon ?? "✦",
  };

  await updateCMSContent((c) => ({
    ...c,
    services: [...c.services, item],
  }));

  return jsonOk(item, 201);
}
