import { createId } from "@/lib/cms/id";
import type { CMSReview } from "@/lib/cms/types";

type LegacyReview = Partial<CMSReview> & {
  screenshots?: string[];
};

export function normalizeReview(item: Partial<CMSReview>, sortOrder: number): CMSReview {
  return {
    id: item.id ?? createId("rev"),
    image: String(item.image ?? "").trim(),
    enabled: item.enabled !== false,
    sortOrder,
  };
}

/** Flatten legacy grouped `screenshots[]` items into one image per entry. */
export function normalizeReviews(items: LegacyReview[]): CMSReview[] {
  const flat: Partial<CMSReview>[] = [];
  for (const item of items) {
    const image = String(item.image ?? "").trim();
    if (image) {
      flat.push(item);
      continue;
    }
    const shots = (item.screenshots ?? []).map((s) => String(s).trim()).filter(Boolean);
    for (const src of shots) {
      flat.push({
        id: createId("rev"),
        image: src,
        enabled: item.enabled !== false,
      });
    }
  }
  return flat.map((item, i) => normalizeReview(item, i));
}

export function filterPublicReviews(reviews: CMSReview[]): CMSReview[] {
  return reviews.filter((r) => r.enabled && Boolean(r.image?.trim()));
}

export function emptyReview(sortOrder: number): CMSReview {
  return {
    id: createId("rev"),
    image: "",
    enabled: true,
    sortOrder,
  };
}

export function reviewImageUrls(reviews: CMSReview[]): string[] {
  return reviews.map((r) => r.image).filter(Boolean);
}
