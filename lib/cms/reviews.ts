import { createId } from "@/lib/cms/id";
import type { CMSReview } from "@/lib/cms/types";

export function normalizeReview(item: Partial<CMSReview>, sortOrder: number): CMSReview {
  return {
    id: item.id ?? createId("rev"),
    screenshots: (item.screenshots ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean),
    company: String(item.company ?? "").trim(),
    reviewer: item.reviewer ? String(item.reviewer).trim() || undefined : undefined,
    rating: Math.min(5, Math.max(1, Math.round(Number(item.rating) || 5))),
    title: item.title ? String(item.title).trim() || undefined : undefined,
    description: item.description
      ? String(item.description).trim() || undefined
      : undefined,
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
    company: "",
    reviewer: undefined,
    rating: 5,
    title: undefined,
    description: undefined,
    enabled: true,
    sortOrder,
  };
}
