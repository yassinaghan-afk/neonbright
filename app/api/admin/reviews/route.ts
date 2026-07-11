import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { normalizeReviews, reviewImageUrls } from "@/lib/cms/reviews";
import { readCMSContentFresh, updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import { logCmsSync } from "@/lib/cms/sync-log";
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
    // Non-critical.
  }
}

// ─── GET — list all reviews (admin) ─────────────────────────────────────────

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContentFresh();
  return jsonOk(normalizeReviews(content.reviews ?? []));
}

// ─── PUT — replace entire list (reorder / publish / bulk operations) ─────────

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
  await Promise.all(toDelete.map((url) => tryDeleteBlob(url)));

  const result = normalizeReviews(persisted.reviews ?? []);

  logCmsSync("save", {
    route: "PUT /api/admin/reviews",
    count: result.length,
    deletedBlobs: toDelete.length,
    updatedAt: persisted.updatedAt,
  });

  return jsonOk(result);
}

// ─── DELETE — remove a single review by id (atomic, no race with PUT) ────────

export async function DELETE(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id query param is required");

  let deletedUrl: string | undefined;

  const persisted = await updateCMSContent((c) => {
    const current = normalizeReviews(c.reviews ?? []);
    const target = current.find((r) => r.id === id);
    deletedUrl = target?.image;
    const next = current.filter((r) => r.id !== id);
    return { ...c, reviews: next };
  });

  revalidatePublicSite();

  if (deletedUrl && isBlobUrl(deletedUrl)) {
    await tryDeleteBlob(deletedUrl);
  }

  const result = normalizeReviews(persisted.reviews ?? []);

  logCmsSync("save", {
    route: `DELETE /api/admin/reviews?id=${id}`,
    count: result.length,
    updatedAt: persisted.updatedAt,
  });

  return jsonOk(result);
}
