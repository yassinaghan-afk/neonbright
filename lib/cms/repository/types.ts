/**
 * CMS repository interface — pages and APIs depend on this, never directly
 * on Prisma or the JSON file. The same public components work with the JSON
 * repository and the PostgreSQL repository.
 */

import type {
  CMSContent,
  CMSInstagramPost,
  CMSPortfolioProject,
  CMSReview,
  CMSTestimonial,
} from "@/lib/cms/types";

export type CmsStorageMode = "json" | "compare" | "postgres";

export interface CmsRepository {
  /** Which backend served the data (for logging). */
  readonly backend: "json" | "postgres";

  /** Full CMS snapshot in the canonical CMSContent shape. */
  getContent(): Promise<CMSContent>;

  /** Fresh (uncached) full snapshot. */
  getContentFresh(): Promise<CMSContent>;

  listPortfolioProjects(options?: {
    categoryId?: string;
    publishedOnly?: boolean;
  }): Promise<CMSPortfolioProject[]>;

  getPortfolioProjectBySlug(slug: string): Promise<CMSPortfolioProject | null>;

  listReviews(publicOnly?: boolean): Promise<CMSReview[]>;

  listTestimonials(publicOnly?: boolean): Promise<CMSTestimonial[]>;

  listInstagramPosts(publicOnly?: boolean): Promise<CMSInstagramPost[]>;

  getSiteSettings(): Promise<
    Pick<CMSContent, "hero" | "sectionCopy" | "instagram" | "company" | "contact" | "social" | "seo">
  >;
}

export function getCmsStorageMode(): CmsStorageMode {
  const raw = process.env.CMS_STORAGE?.trim().toLowerCase();
  if (raw === "postgres" || raw === "compare") return raw;
  // Default MUST remain json until migration approval.
  return "json";
}
