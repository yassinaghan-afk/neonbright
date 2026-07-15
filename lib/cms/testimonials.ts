import { sortByOrder } from "@/lib/cms/normalize";
import type { CMSTestimonial } from "@/lib/cms/types";

export function clampRating(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

/**
 * Normalize an admin payload into CMS testimonials.
 * An empty array is a valid intentional clear — never fall back to previous items.
 */
export function normalizeTestimonials(
  items: Partial<CMSTestimonial>[] | undefined,
  fallback: CMSTestimonial[]
): CMSTestimonial[] {
  const source = Array.isArray(items) ? items : fallback;
  return sortByOrder(
    source.map((t, i) => ({
      id: t.id ?? `test_${i}`,
      quote: String(t.quote ?? "").trim(),
      author: String(t.author ?? "").trim(),
      role: String(t.role ?? "").trim(),
      location: String(t.location ?? "").trim(),
      company: String(t.company ?? "").trim(),
      photo: String(t.photo ?? "").trim(),
      rating: clampRating(t.rating),
      galleryImages: asStringArray(t.galleryImages),
      videos: asStringArray(t.videos),
      audioFiles: asStringArray(t.audioFiles),
      instagramUrl: String(t.instagramUrl ?? "").trim(),
      linkedinUrl: String(t.linkedinUrl ?? "").trim(),
      websiteUrl: String(t.websiteUrl ?? "").trim(),
      sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : i,
      // Public by default; explicit false = Masqué
      enabled: t.enabled !== false,
    }))
  );
}

export function parseTestimonialInput(
  body: Record<string, unknown>,
  existing?: CMSTestimonial
): CMSTestimonial {
  const base = existing ?? {
    id: "",
    quote: "",
    author: "",
    role: "",
    location: "",
    company: "",
    photo: "",
    rating: 5,
    galleryImages: [],
    videos: [],
    audioFiles: [],
    instagramUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
    sortOrder: 0,
    enabled: true,
  };

  return {
    ...base,
    quote: String(body.quote ?? base.quote).trim(),
    author: String(body.author ?? base.author).trim(),
    role: String(body.role ?? base.role).trim(),
    location: String(body.location ?? base.location).trim(),
    company: String(body.company ?? base.company ?? "").trim(),
    photo: String(body.photo ?? base.photo ?? "").trim(),
    rating: body.rating !== undefined ? clampRating(body.rating) : base.rating ?? 5,
    galleryImages:
      body.galleryImages !== undefined
        ? asStringArray(body.galleryImages)
        : base.galleryImages ?? [],
    videos:
      body.videos !== undefined ? asStringArray(body.videos) : base.videos ?? [],
    audioFiles:
      body.audioFiles !== undefined
        ? asStringArray(body.audioFiles)
        : base.audioFiles ?? [],
    instagramUrl: String(body.instagramUrl ?? base.instagramUrl ?? "").trim(),
    linkedinUrl: String(body.linkedinUrl ?? base.linkedinUrl ?? "").trim(),
    websiteUrl: String(body.websiteUrl ?? base.websiteUrl ?? "").trim(),
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : base.sortOrder ?? 0,
    enabled: body.enabled !== undefined ? body.enabled !== false : base.enabled !== false,
  };
}

export function emptyTestimonial(sortOrder: number): Omit<CMSTestimonial, "id"> {
  return {
    quote: "",
    author: "",
    role: "",
    location: "",
    company: "",
    photo: "",
    rating: 5,
    galleryImages: [],
    videos: [],
    audioFiles: [],
    instagramUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
    sortOrder,
    enabled: true,
  };
}

/** Public homepage: only enabled (Public) testimonials with quote + author. */
export function getPublicTestimonials(items: CMSTestimonial[]): CMSTestimonial[] {
  return sortByOrder(items).filter(
    (t) => t.enabled !== false && t.quote && t.author
  );
}
