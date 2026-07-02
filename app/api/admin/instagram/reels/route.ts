import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { normalizeInstagramReels } from "@/lib/cms/instagram-normalize";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSInstagramReel } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(normalizeInstagramReels(content.instagramReels ?? []));
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.items || !Array.isArray(body.items)) {
    return jsonError("items array is required");
  }

  const saved = normalizeInstagramReels(body.items as Partial<CMSInstagramReel>[]);

  await updateCMSContent((c) => ({
    ...c,
    instagramReels: saved,
  }));

  return jsonOk(saved);
}
