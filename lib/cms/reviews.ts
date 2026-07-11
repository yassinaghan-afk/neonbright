import { createId } from "@/lib/cms/id";
import type { CMSReview } from "@/lib/cms/types";

export function normalizeReview(item: Partial<CMSReview>, sortOrder: number): CMSReview {
  return {
    id: item.id ?? createId("rev"),
    screenshots: (item.screenshots ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean),
    enabled: item.enabled !== false,
    sortOrder,
  };
}

export function normalizeReviews(items: Partial<CMSReview>[]): CMSReview[] {
  return items.map((item, i) => normalizeReview(item, i));
}

export function filterPublicReviews(reviews: CMSReview[]): CMSReview[] {
  return reviews.filter((r) => r.enabled && r.screenshots.length > 0);
}

export function emptyReview(sortOrder: number): CMSReview {
  return {
    id: createId("rev"),
    screenshots: [],
    enabled: true,
    sortOrder,
  };
}
