import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { normalizeInstagramPosts } from "@/lib/cms/instagram-normalize";
import { readCMSContentFresh, updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import { deleteUploadFile } from "@/lib/cms/upload-storage";
import type { CMSInstagramPost } from "@/lib/cms/types";

function postImageUrls(post: CMSInstagramPost): string[] {
  return [post.image, ...(post.carouselImages ?? [])].filter(Boolean);
}

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

  let oldPosts: CMSInstagramPost[] = [];

  const persisted = await updateCMSContent((c) => {
    oldPosts = c.instagramPosts ?? [];
    return { ...c, instagramPosts: saved };
  });

  revalidatePublicSite();

  // Delete blob files for images that no longer appear in any post.
  const newUrlSet = new Set(saved.flatMap(postImageUrls));
  const toDelete = oldPosts
    .flatMap(postImageUrls)
    .filter((url) => !newUrlSet.has(url));
  for (const url of toDelete) {
    void deleteUploadFile(url, "cms");
  }

  return jsonOk(normalizeInstagramPosts(persisted.instagramPosts ?? []));
}
