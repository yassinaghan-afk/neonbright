import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSInstagramMediaItem } from "@/lib/cms/types";

function normalizeItems(items: Partial<CMSInstagramMediaItem>[]): CMSInstagramMediaItem[] {
  return items.map((item, i) => ({
    id: item.id ?? createId("ig"),
    thumbnail: String(item.thumbnail ?? "").trim(),
    url: String(item.url ?? "").trim(),
    alt: String(item.alt ?? "").trim(),
    enabled: item.enabled !== false,
    sortOrder: i,
  }));
}

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.instagramPosts ?? []);
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.items || !Array.isArray(body.items)) {
    return jsonError("items array is required");
  }

  let saved: CMSInstagramMediaItem[] = [];
  await updateCMSContent((c) => {
    saved = normalizeItems(body.items as Partial<CMSInstagramMediaItem>[]);
    return { ...c, instagramPosts: saved };
  });

  return jsonOk(saved);
}
