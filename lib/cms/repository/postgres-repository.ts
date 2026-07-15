/**
 * PostgreSQL-backed repository. Returns the exact same CMSContent shapes as
 * the JSON repository so public components work unchanged.
 *
 * Reads assemble CMSContent from normalized tables + SiteSetting JSONB blocks.
 */

import { unstable_noStore as noStore } from "next/cache";
import { getPrisma } from "@/lib/db/prisma";
import {
  rowToCategory,
  rowToFAQ,
  rowToFeature,
  rowToHeroSlide,
  rowToIndustry,
  rowToInstagramPost,
  rowToInstagramReel,
  rowToNav,
  rowToPartner,
  rowToProcessStep,
  rowToProject,
  rowToReview,
  rowToService,
  rowToTestimonial,
} from "@/lib/db/cms-mapping";
import { getDefaultCMSContent } from "@/lib/cms/defaults";
import type {
  CMSContent,
  CMSInstagramPost,
  CMSPortfolioProject,
  CMSReview,
  CMSTestimonial,
} from "@/lib/cms/types";
import type { CmsRepository } from "./types";

async function loadSettings(): Promise<Map<string, unknown>> {
  const prisma = getPrisma();
  const rows = await prisma.siteSetting.findMany();
  return new Map(rows.map((r) => [r.key, r.value]));
}

async function loadFullContent(): Promise<CMSContent> {
  const prisma = getPrisma();
  const defaults = getDefaultCMSContent();

  const [
    categories, projects, media, heroSlides, partners, reviews,
    testimonials, igPosts, igReels, features, industries, processSteps,
    faqs, services, navItems, settings, lastRevision,
  ] = await Promise.all([
    prisma.portfolioCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.portfolioProject.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.projectMedia.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.partner.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.instagramPost.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.instagramReel.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.feature.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.industry.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.processStep.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.fAQ.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.navigationItem.findMany({ orderBy: { sortOrder: "asc" } }),
    loadSettings(),
    prisma.cmsRevision.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const mediaByProject = new Map<string, Array<{ role: string; url: string; sortOrder: number }>>();
  for (const m of media) {
    const list = mediaByProject.get(m.projectId) ?? [];
    list.push({ role: m.role, url: m.url, sortOrder: m.sortOrder });
    mediaByProject.set(m.projectId, list);
  }

  const setting = <T>(key: string, fallback: T): T => {
    const value = settings.get(key);
    return value === undefined || value === null ? fallback : (value as T);
  };

  return {
    hero: setting("hero", defaults.hero),
    heroSlides: heroSlides.map(rowToHeroSlide),
    heroMediaVersion: setting<string | undefined>("heroMediaVersion", undefined) ?? undefined,
    projects: setting("legacyProjects", []),
    portfolioCategories: categories.map(rowToCategory),
    portfolioProjects: projects.map((p) =>
      rowToProject(p, mediaByProject.get(p.id) ?? [])
    ),
    testimonials: testimonials.map(rowToTestimonial),
    partners: partners.filter((p) => p.kind === "partner").map(rowToPartner),
    brandsPageLogos: partners.filter((p) => p.kind === "brandsLogo").map(rowToPartner),
    services: services.map(rowToService),
    faq: faqs.map(rowToFAQ),
    features: features.map(rowToFeature),
    industries: industries.map(rowToIndustry),
    processSteps: processSteps.map(rowToProcessStep),
    sectionCopy: setting("sectionCopy", defaults.sectionCopy),
    instagram: setting("instagram", defaults.instagram),
    reviews: reviews.map(rowToReview),
    instagramPosts: igPosts.map(rowToInstagramPost),
    instagramReels: igReels.map(rowToInstagramReel),
    nav: navItems.map(rowToNav),
    company: setting("company", defaults.company),
    contact: setting("contact", defaults.contact),
    social: setting("social", defaults.social),
    seo: setting("seo", defaults.seo),
    updatedAt: lastRevision?.createdAt.toISOString() ?? defaults.updatedAt,
    revision: lastRevision?.revision,
  };
}

export class PostgresCmsRepository implements CmsRepository {
  readonly backend = "postgres" as const;

  getContent(): Promise<CMSContent> {
    noStore();
    return loadFullContent();
  }

  getContentFresh(): Promise<CMSContent> {
    noStore();
    return loadFullContent();
  }

  async listPortfolioProjects(options?: {
    categoryId?: string;
    publishedOnly?: boolean;
  }): Promise<CMSPortfolioProject[]> {
    noStore();
    const prisma = getPrisma();
    const rows = await prisma.portfolioProject.findMany({
      where: {
        ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
        ...(options?.publishedOnly ? { published: true } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });
    return rows.map((p) => rowToProject(p, p.media));
  }

  async getPortfolioProjectBySlug(slug: string): Promise<CMSPortfolioProject | null> {
    noStore();
    const prisma = getPrisma();
    const row = await prisma.portfolioProject.findFirst({
      where: { slug },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });
    return row ? rowToProject(row, row.media) : null;
  }

  async listReviews(publicOnly = false): Promise<CMSReview[]> {
    noStore();
    const prisma = getPrisma();
    const rows = await prisma.review.findMany({
      where: publicOnly ? { enabled: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(rowToReview).filter((r) => !publicOnly || r.image);
  }

  async listTestimonials(publicOnly = false): Promise<CMSTestimonial[]> {
    noStore();
    const prisma = getPrisma();
    const rows = await prisma.testimonial.findMany({
      where: publicOnly ? { enabled: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(rowToTestimonial);
  }

  async listInstagramPosts(publicOnly = false): Promise<CMSInstagramPost[]> {
    noStore();
    const prisma = getPrisma();
    const rows = await prisma.instagramPost.findMany({
      where: publicOnly ? { enabled: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(rowToInstagramPost).filter((p) => !publicOnly || p.image.trim());
  }

  async getSiteSettings() {
    noStore();
    const defaults = getDefaultCMSContent();
    const settings = await loadSettings();
    const setting = <T>(key: string, fallback: T): T => {
      const value = settings.get(key);
      return value === undefined || value === null ? fallback : (value as T);
    };
    return {
      hero: setting("hero", defaults.hero),
      sectionCopy: setting("sectionCopy", defaults.sectionCopy),
      instagram: setting("instagram", defaults.instagram),
      company: setting("company", defaults.company),
      contact: setting("contact", defaults.contact),
      social: setting("social", defaults.social),
      seo: setting("seo", defaults.seo),
    };
  }
}
