import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { normalizeReviews, reviewImageUrls } from "@/lib/cms/reviews";
import { readCMSContentFresh, updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import type { CMSReview } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isBlobUrl(url: string | undefined): url is string {
  if (!url) return false;
  return (
    url.includes(".blob.vercel-storage.com/") ||
    url.includes(".public.blob.vercel-storage.com/")
  );
}

async function tryDeleteBlob(url: string): Promise<void> {
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch {
    // Non-critical — do not block the response.
  }
}

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContentFresh();
  return jsonOk(normalizeReviews(content.reviews ?? []));
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.items || !Array.isArray(body.items)) {
    return jsonError("items array is required");
  }

  const saved = normalizeReviews(body.items as Partial<CMSReview>[]);

  let oldReviews: CMSReview[] = [];

  const persisted = await updateCMSContent((c) => {
    oldReviews = normalizeReviews(c.reviews ?? []);
    return { ...c, reviews: saved };
  });

  revalidatePublicSite();

  const newUrls = new Set(reviewImageUrls(saved));
  const toDelete = reviewImageUrls(oldReviews).filter(
    (url) => isBlobUrl(url) && !newUrls.has(url)
  );
  for (const url of toDelete) {
    void tryDeleteBlob(url);
  }

  return jsonOk(normalizeReviews(persisted.reviews ?? []));
}
