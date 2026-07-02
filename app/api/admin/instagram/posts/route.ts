import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { normalizeInstagramPosts } from "@/lib/cms/instagram-normalize";
import { readCMSContentFresh, updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import type { CMSInstagramPost } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContentFresh();
  return jsonOk(normalizeInstagramPosts(content.instagramPosts ?? []));
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.items || !Array.isArray(body.items)) {
    return jsonError("items array is required");
  }

  const saved = normalizeInstagramPosts(body.items as Partial<CMSInstagramPost>[]);

  const persisted = await updateCMSContent((c) => ({
    ...c,
    instagramPosts: saved,
  }));

  revalidatePublicSite();

  return jsonOk(normalizeInstagramPosts(persisted.instagramPosts ?? []));
}
