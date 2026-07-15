/**
 * JSON-backed repository — wraps the existing hardened file store
 * (atomic writes, file lock, backups). This is the production default.
 */

import { readCMSContent, readCMSContentFresh } from "@/lib/cms/store";
import { sortByOrder } from "@/lib/cms/normalize";
import { getPublicTestimonials } from "@/lib/cms/testimonials";
import { filterPublicPosts, normalizeInstagramPosts } from "@/lib/cms/instagram-normalize";
import { filterPublicReviews, normalizeReviews } from "@/lib/cms/reviews";
import type {
  CMSContent,
  CMSInstagramPost,
  CMSPortfolioProject,
  CMSReview,
  CMSTestimonial,
} from "@/lib/cms/types";
import type { CmsRepository } from "./types";

export class JsonCmsRepository implements CmsRepository {
  readonly backend = "json" as const;

  getContent(): Promise<CMSContent> {
    return readCMSContent();
  }

  getContentFresh(): Promise<CMSContent> {
    return readCMSContentFresh();
  }

  async listPortfolioProjects(options?: {
    categoryId?: string;
    publishedOnly?: boolean;
  }): Promise<CMSPortfolioProject[]> {
    const content = await readCMSContent();
    let projects = sortByOrder(content.portfolioProjects ?? []);
    if (options?.categoryId) {
      projects = projects.filter((p) => p.categoryId === options.categoryId);
    }
    if (options?.publishedOnly) {
      projects = projects.filter((p) => p.published);
    }
    return projects;
  }

  async getPortfolioProjectBySlug(slug: string): Promise<CMSPortfolioProject | null> {
    const content = await readCMSContent();
    return (content.portfolioProjects ?? []).find((p) => p.slug === slug) ?? null;
  }

  async listReviews(publicOnly = false): Promise<CMSReview[]> {
    const content = await readCMSContent();
    const reviews = normalizeReviews(sortByOrder(content.reviews ?? []));
    return publicOnly ? filterPublicReviews(reviews) : reviews;
  }

  async listTestimonials(publicOnly = false): Promise<CMSTestimonial[]> {
    const content = await readCMSContent();
    return publicOnly
      ? getPublicTestimonials(content.testimonials)
      : sortByOrder(content.testimonials ?? []);
  }

  async listInstagramPosts(publicOnly = false): Promise<CMSInstagramPost[]> {
    const content = await readCMSContent();
    const posts = normalizeInstagramPosts(sortByOrder(content.instagramPosts ?? []));
    return publicOnly ? filterPublicPosts(posts) : posts;
  }

  async getSiteSettings() {
    const content = await readCMSContent();
    return {
      hero: content.hero,
      sectionCopy: content.sectionCopy,
      instagram: content.instagram,
      company: content.company,
      contact: content.contact,
      social: content.social,
      seo: content.seo,
    };
  }
}
