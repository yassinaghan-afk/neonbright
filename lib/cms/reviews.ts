import { createId } from "@/lib/cms/id";
import type { CMSReview } from "@/lib/cms/types";

type LegacyReview = Partial<CMSReview> & {
  screenshots?: string[];
};

export function normalizeReview(item: Partial<CMSReview>, sortOrder: number): CMSReview {
  return {
    id: item.id && String(item.id).trim() ? String(item.id) : createId("rev"),
    image: String(item.image ?? "").trim(),
    enabled: item.enabled !== false,
    sortOrder,
  };
}

/**
 * Flatten legacy grouped `screenshots[]` into one image per entry.
 * Preserves existing IDs — never regenerates IDs on every read (that caused
 * delete/create sync bugs where items appeared to resurrect with new IDs).
 */
export function normalizeReviews(items: LegacyReview[]): CMSReview[] {
  const flat: Partial<CMSReview>[] = [];

  for (const item of items) {
    const image = String(item.image ?? "").trim();
    if (image) {
      flat.push({
        id: item.id,
        image,
        enabled: item.enabled !== false,
        sortOrder: item.sortOrder,
      });
      continue;
    }

    const shots = (item.screenshots ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    if (shots.length === 0) continue;

    // Single legacy screenshot → keep the parent id. Multiple → stable
    // derived ids so re-normalization does not churn identities.
    if (shots.length === 1) {
      flat.push({
        id: item.id,
        image: shots[0],
        enabled: item.enabled !== false,
        sortOrder: item.sortOrder,
      });
    } else {
      const baseId = item.id && String(item.id).trim() ? String(item.id) : createId("rev");
      shots.forEach((src, shotIndex) => {
        flat.push({
          id: `${baseId}_s${shotIndex}`,
          image: src,
          enabled: item.enabled !== false,
          sortOrder: typeof item.sortOrder === "number" ? item.sortOrder + shotIndex : undefined,
        });
      });
    }
  }

  return flat
    .filter((item) => Boolean(String(item.image ?? "").trim()))
    .map((item, i) => normalizeReview(item, i));
}

export function filterPublicReviews(reviews: CMSReview[]): CMSReview[] {
  // Strict: only explicitly published reviews reach the website / public API.
  return reviews.filter((r) => r.enabled === true && Boolean(r.image?.trim()));
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
