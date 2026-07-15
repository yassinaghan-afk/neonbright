/**
 * JSON CMS ⇄ PostgreSQL mapping.
 *
 * One place defines how every CMSContent collection maps to Prisma models so
 * the import script, verify script, and the Postgres repository always agree.
 *
 * Known fields become columns; anything else on a record is preserved in the
 * `custom` JSONB column so unknown/custom fields survive round-trips.
 */

import type {
  CMSContent,
  CMSFAQItem,
  CMSFeature,
  CMSHeroSlide,
  CMSIndustry,
  CMSInstagramPost,
  CMSInstagramReel,
  CMSNavLink,
  CMSPartner,
  CMSPortfolioCategory,
  CMSPortfolioProject,
  CMSProcessStep,
  CMSReview,
  CMSService,
  CMSTestimonial,
} from "@/lib/cms/types";

// ── helpers ──────────────────────────────────────────────────────────────────

type Rec = Record<string, unknown>;

/** Prisma-compatible JSON input value for `custom` JSONB columns. */
import type { Prisma } from "@/lib/generated/prisma/client";
type CustomJson = Prisma.InputJsonValue;

/** Extract unrecognized keys into a `custom` JSON object (or null). */
function extractCustom(source: Rec, knownKeys: readonly string[]): CustomJson | null {
  const custom: Rec = {};
  let found = false;
  for (const key of Object.keys(source)) {
    if (!knownKeys.includes(key)) {
      custom[key] = source[key];
      found = true;
    }
  }
  return found ? (custom as CustomJson) : null;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

// ── Setting keys (singleton JSONB blocks) ────────────────────────────────────

export const SETTING_KEYS = [
  "hero",
  "sectionCopy",
  "instagram",
  "company",
  "contact",
  "social",
  "seo",
  "heroMediaVersion",
  "legacyProjects",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export function settingsFromContent(
  content: CMSContent
): Array<{ key: SettingKey; value: unknown }> {
  return [
    { key: "hero", value: content.hero },
    { key: "sectionCopy", value: content.sectionCopy },
    { key: "instagram", value: content.instagram },
    { key: "company", value: content.company },
    { key: "contact", value: content.contact },
    { key: "social", value: content.social },
    { key: "seo", value: content.seo },
    { key: "heroMediaVersion", value: content.heroMediaVersion ?? null },
    { key: "legacyProjects", value: content.projects ?? [] },
  ];
}

// ── Row mappers: JSON record → Prisma create/update data ────────────────────

const CATEGORY_KEYS = [
  "id", "slug", "title", "titleAccent", "description", "coverImage",
  "coverAlt", "heroImage", "href", "pageTitle", "pageSubtitle",
  "enabled", "sortOrder",
] as const;

export function categoryToRow(c: CMSPortfolioCategory) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    titleAccent: c.titleAccent ?? "",
    description: c.description ?? "",
    coverImage: c.coverImage ?? "",
    coverAlt: c.coverAlt ?? "",
    heroImage: c.heroImage ?? "",
    href: c.href ?? "",
    pageTitle: c.pageTitle ?? "",
    pageSubtitle: c.pageSubtitle ?? "",
    enabled: c.enabled !== false,
    sortOrder: c.sortOrder ?? 0,
    custom: extractCustom(c as Rec, CATEGORY_KEYS) ?? undefined,
  };
}

const PROJECT_KEYS = [
  "id", "categoryId", "slug", "title", "description", "shortDescription",
  "client", "city", "country", "year", "images", "videos", "gallery",
  "featuredImage", "coverImage", "thumbnail", "imageAlt", "tags", "accent",
  "published", "sortOrder", "type", "typeLabel", "logoFile",
  "installationType", "beforeImage", "afterImage", "relatedProjectSlugs",
  "technologies", "filters", "seoTitle", "seoDescription", "subtitle",
] as const;

export function projectToRow(p: CMSPortfolioProject) {
  return {
    id: p.id,
    categoryId: p.categoryId,
    slug: p.slug,
    title: p.title,
    description: p.description ?? "",
    shortDescription: p.shortDescription ?? "",
    client: p.client ?? "",
    city: p.city ?? "",
    country: p.country ?? "",
    year: p.year ?? "",
    featuredImage: p.featuredImage ?? "",
    coverImage: p.coverImage ?? "",
    thumbnail: p.thumbnail ?? "",
    imageAlt: p.imageAlt ?? "",
    tags: strArray(p.tags),
    accent: p.accent ?? "neon-pink",
    published: p.published === true,
    sortOrder: p.sortOrder ?? 0,
    type: p.type ?? null,
    typeLabel: p.typeLabel ?? null,
    logoFile: p.logoFile ?? null,
    installationType: p.installationType ?? null,
    beforeImage: p.beforeImage ?? null,
    afterImage: p.afterImage ?? null,
    relatedProjectSlugs: strArray(p.relatedProjectSlugs),
    technologies: strArray(p.technologies),
    filters: strArray(p.filters),
    seoTitle: p.seoTitle ?? null,
    seoDescription: p.seoDescription ?? null,
    subtitle: p.subtitle ?? null,
    custom: extractCustom(p as Rec, PROJECT_KEYS) ?? undefined,
  };
}

/** Ordered media rows for one project (images / gallery / videos). */
export function projectMediaRows(p: CMSPortfolioProject) {
  const rows: Array<{ projectId: string; role: string; url: string; sortOrder: number }> = [];
  strArray(p.images).forEach((url, i) =>
    rows.push({ projectId: p.id, role: "image", url, sortOrder: i })
  );
  strArray(p.gallery).forEach((url, i) =>
    rows.push({ projectId: p.id, role: "gallery", url, sortOrder: i })
  );
  strArray(p.videos).forEach((url, i) =>
    rows.push({ projectId: p.id, role: "video", url, sortOrder: i })
  );
  return rows;
}

const HERO_SLIDE_KEYS = ["id", "src", "alt", "enabled", "sortOrder"] as const;

export function heroSlideToRow(s: CMSHeroSlide) {
  return {
    id: s.id,
    src: s.src,
    alt: s.alt ?? "",
    enabled: s.enabled !== false,
    sortOrder: s.sortOrder ?? 0,
    custom: extractCustom(s as Rec, HERO_SLIDE_KEYS) ?? undefined,
  };
}

const PARTNER_KEYS = ["id", "name", "logoUrl", "enabled", "sortOrder"] as const;

export function partnerToRow(p: CMSPartner, kind: "partner" | "brandsLogo") {
  return {
    id: p.id,
    kind,
    name: p.name,
    logoUrl: p.logoUrl ?? "",
    enabled: p.enabled !== false,
    sortOrder: p.sortOrder ?? 0,
    custom: extractCustom(p as Rec, PARTNER_KEYS) ?? undefined,
  };
}

const REVIEW_KEYS = ["id", "image", "enabled", "sortOrder"] as const;

export function reviewToRow(r: CMSReview) {
  return {
    id: r.id,
    image: r.image,
    enabled: r.enabled !== false,
    sortOrder: r.sortOrder ?? 0,
    custom: extractCustom(r as Rec, REVIEW_KEYS) ?? undefined,
  };
}

const TESTIMONIAL_KEYS = [
  "id", "quote", "author", "role", "location", "company", "photo", "rating",
  "galleryImages", "videos", "audioFiles", "instagramUrl", "linkedinUrl",
  "websiteUrl", "sortOrder", "enabled",
] as const;

export function testimonialToRow(t: CMSTestimonial) {
  return {
    id: t.id,
    quote: t.quote,
    author: t.author,
    role: t.role ?? "",
    location: t.location ?? "",
    company: t.company ?? null,
    photo: t.photo ?? null,
    rating: typeof t.rating === "number" ? Math.round(t.rating) : null,
    galleryImages: strArray(t.galleryImages),
    videos: strArray(t.videos),
    audioFiles: strArray(t.audioFiles),
    instagramUrl: t.instagramUrl ?? null,
    linkedinUrl: t.linkedinUrl ?? null,
    websiteUrl: t.websiteUrl ?? null,
    enabled: t.enabled !== false,
    sortOrder: t.sortOrder ?? 0,
    custom: extractCustom(t as Rec, TESTIMONIAL_KEYS) ?? undefined,
  };
}

const IG_POST_KEYS = [
  "id", "image", "carouselImages", "altText", "caption", "instagramUrl",
  "enabled", "sortOrder", "createdAt", "updatedAt",
] as const;

export function instagramPostToRow(p: CMSInstagramPost) {
  return {
    id: p.id,
    image: p.image,
    carouselImages: strArray(p.carouselImages),
    altText: p.altText ?? null,
    caption: p.caption ?? "",
    instagramUrl: p.instagramUrl ?? "",
    enabled: p.enabled !== false,
    sortOrder: p.sortOrder ?? 0,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    custom: extractCustom(p as Rec, IG_POST_KEYS) ?? undefined,
  };
}

const IG_REEL_KEYS = [
  "id", "videoUrl", "thumbnail", "caption", "instagramUrl", "enabled", "sortOrder",
] as const;

export function instagramReelToRow(r: CMSInstagramReel) {
  return {
    id: r.id,
    videoUrl: r.videoUrl,
    thumbnail: r.thumbnail ?? "",
    caption: r.caption ?? "",
    instagramUrl: r.instagramUrl ?? "",
    enabled: r.enabled !== false,
    sortOrder: r.sortOrder ?? 0,
    custom: extractCustom(r as Rec, IG_REEL_KEYS) ?? undefined,
  };
}

const FEATURE_KEYS = ["id", "title", "description", "icon", "enabled", "sortOrder"] as const;

export function featureToRow(f: CMSFeature) {
  return {
    id: f.id,
    title: f.title,
    description: f.description ?? "",
    icon: f.icon ?? "",
    enabled: f.enabled !== false,
    sortOrder: f.sortOrder ?? 0,
    custom: extractCustom(f as Rec, FEATURE_KEYS) ?? undefined,
  };
}

const INDUSTRY_KEYS = ["id", "name", "icon", "enabled", "sortOrder"] as const;

export function industryToRow(i: CMSIndustry) {
  return {
    id: i.id,
    name: i.name,
    icon: i.icon ?? "",
    enabled: i.enabled !== false,
    sortOrder: i.sortOrder ?? 0,
    custom: extractCustom(i as Rec, INDUSTRY_KEYS) ?? undefined,
  };
}

const PROCESS_KEYS = ["id", "step", "title", "description", "sortOrder"] as const;

export function processStepToRow(s: CMSProcessStep) {
  return {
    id: s.id,
    step: s.step ?? "",
    title: s.title,
    description: s.description ?? "",
    sortOrder: s.sortOrder ?? 0,
    custom: extractCustom(s as Rec, PROCESS_KEYS) ?? undefined,
  };
}

const FAQ_KEYS = ["id", "question", "answer", "enabled", "sortOrder"] as const;

export function faqToRow(f: CMSFAQItem) {
  return {
    id: f.id,
    question: f.question,
    answer: f.answer ?? "",
    enabled: f.enabled !== false,
    sortOrder: f.sortOrder ?? 0,
    custom: extractCustom(f as Rec, FAQ_KEYS) ?? undefined,
  };
}

const SERVICE_KEYS = ["id", "title", "description", "icon", "enabled", "sortOrder"] as const;

export function serviceToRow(s: CMSService) {
  return {
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    icon: s.icon ?? "",
    enabled: s.enabled !== false,
    sortOrder: s.sortOrder ?? 0,
    custom: extractCustom(s as Rec, SERVICE_KEYS) ?? undefined,
  };
}

const NAV_KEYS = ["id", "label", "href", "enabled", "sortOrder"] as const;

export function navToRow(n: CMSNavLink) {
  return {
    id: n.id,
    label: n.label,
    href: n.href,
    enabled: n.enabled !== false,
    sortOrder: n.sortOrder ?? 0,
    custom: extractCustom(n as Rec, NAV_KEYS) ?? undefined,
  };
}

// ── Row → JSON mappers (Postgres repository / verify) ───────────────────────

type DbRow = Rec & { custom?: unknown };

function withCustom<T extends Rec>(base: T, row: DbRow): T {
  const custom = row.custom;
  if (custom && typeof custom === "object") {
    return { ...(custom as Rec), ...base } as T;
  }
  return base;
}

export function rowToCategory(row: DbRow): CMSPortfolioCategory {
  return withCustom(
    {
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      titleAccent: String(row.titleAccent ?? ""),
      description: String(row.description ?? ""),
      coverImage: String(row.coverImage ?? ""),
      coverAlt: String(row.coverAlt ?? ""),
      heroImage: String(row.heroImage ?? ""),
      href: String(row.href ?? ""),
      pageTitle: String(row.pageTitle ?? ""),
      pageSubtitle: String(row.pageSubtitle ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToProject(
  row: DbRow,
  media: Array<{ role: string; url: string; sortOrder: number }>
): CMSPortfolioProject {
  const byRole = (role: string) =>
    media
      .filter((m) => m.role === role)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => m.url);

  const base: CMSPortfolioProject = {
    id: String(row.id),
    categoryId: String(row.categoryId),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    shortDescription: String(row.shortDescription ?? ""),
    client: String(row.client ?? ""),
    city: String(row.city ?? ""),
    country: String(row.country ?? ""),
    year: String(row.year ?? ""),
    images: byRole("image"),
    videos: byRole("video"),
    gallery: byRole("gallery"),
    featuredImage: String(row.featuredImage ?? ""),
    coverImage: String(row.coverImage ?? ""),
    thumbnail: String(row.thumbnail ?? ""),
    imageAlt: String(row.imageAlt ?? ""),
    tags: strArray(row.tags),
    accent: (row.accent as CMSPortfolioProject["accent"]) ?? "neon-pink",
    published: row.published === true,
    sortOrder: Number(row.sortOrder ?? 0),
  };

  // Optional fields only when present (byte-parity with JSON records).
  if (row.type != null) base.type = String(row.type);
  if (row.typeLabel != null) base.typeLabel = String(row.typeLabel);
  if (row.logoFile != null) base.logoFile = String(row.logoFile);
  if (row.installationType != null) base.installationType = String(row.installationType);
  if (row.beforeImage != null) base.beforeImage = String(row.beforeImage);
  if (row.afterImage != null) base.afterImage = String(row.afterImage);
  if (strArray(row.relatedProjectSlugs).length)
    base.relatedProjectSlugs = strArray(row.relatedProjectSlugs);
  if (strArray(row.technologies).length) base.technologies = strArray(row.technologies);
  if (strArray(row.filters).length) base.filters = strArray(row.filters);
  if (row.seoTitle != null) base.seoTitle = String(row.seoTitle);
  if (row.seoDescription != null) base.seoDescription = String(row.seoDescription);
  if (row.subtitle != null) base.subtitle = String(row.subtitle);

  return withCustom(base, row);
}

export function rowToHeroSlide(row: DbRow): CMSHeroSlide {
  return withCustom(
    {
      id: String(row.id),
      src: String(row.src),
      alt: String(row.alt ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToPartner(row: DbRow): CMSPartner {
  return withCustom(
    {
      id: String(row.id),
      name: String(row.name),
      logoUrl: String(row.logoUrl ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToReview(row: DbRow): CMSReview {
  return withCustom(
    {
      id: String(row.id),
      image: String(row.image),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToTestimonial(row: DbRow): CMSTestimonial {
  const base: CMSTestimonial = {
    id: String(row.id),
    quote: String(row.quote),
    author: String(row.author),
    role: String(row.role ?? ""),
    location: String(row.location ?? ""),
    enabled: row.enabled !== false,
    sortOrder: Number(row.sortOrder ?? 0),
  };
  if (row.company != null) base.company = String(row.company);
  if (row.photo != null) base.photo = String(row.photo);
  if (row.rating != null) base.rating = Number(row.rating);
  if (strArray(row.galleryImages).length) base.galleryImages = strArray(row.galleryImages);
  if (strArray(row.videos).length) base.videos = strArray(row.videos);
  if (strArray(row.audioFiles).length) base.audioFiles = strArray(row.audioFiles);
  if (row.instagramUrl != null) base.instagramUrl = String(row.instagramUrl);
  if (row.linkedinUrl != null) base.linkedinUrl = String(row.linkedinUrl);
  if (row.websiteUrl != null) base.websiteUrl = String(row.websiteUrl);
  return withCustom(base, row);
}

export function rowToInstagramPost(row: DbRow): CMSInstagramPost {
  const base: CMSInstagramPost = {
    id: String(row.id),
    image: String(row.image),
    caption: String(row.caption ?? ""),
    instagramUrl: String(row.instagramUrl ?? ""),
    enabled: row.enabled !== false,
    sortOrder: Number(row.sortOrder ?? 0),
  };
  const carousel = strArray(row.carouselImages);
  if (carousel.length) base.carouselImages = carousel;
  if (row.altText != null) base.altText = String(row.altText);
  if (row.createdAt instanceof Date) base.createdAt = row.createdAt.toISOString();
  if (row.updatedAt instanceof Date) base.updatedAt = row.updatedAt.toISOString();
  return withCustom(base, row);
}

export function rowToInstagramReel(row: DbRow): CMSInstagramReel {
  return withCustom(
    {
      id: String(row.id),
      videoUrl: String(row.videoUrl),
      thumbnail: String(row.thumbnail ?? ""),
      caption: String(row.caption ?? ""),
      instagramUrl: String(row.instagramUrl ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToFeature(row: DbRow): CMSFeature {
  return withCustom(
    {
      id: String(row.id),
      title: String(row.title),
      description: String(row.description ?? ""),
      icon: String(row.icon ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToIndustry(row: DbRow): CMSIndustry {
  return withCustom(
    {
      id: String(row.id),
      name: String(row.name),
      icon: String(row.icon ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToProcessStep(row: DbRow): CMSProcessStep {
  return withCustom(
    {
      id: String(row.id),
      step: String(row.step ?? ""),
      title: String(row.title),
      description: String(row.description ?? ""),
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToFAQ(row: DbRow): CMSFAQItem {
  return withCustom(
    {
      id: String(row.id),
      question: String(row.question),
      answer: String(row.answer ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToService(row: DbRow): CMSService {
  return withCustom(
    {
      id: String(row.id),
      title: String(row.title),
      description: String(row.description ?? ""),
      icon: String(row.icon ?? ""),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

export function rowToNav(row: DbRow): CMSNavLink {
  return withCustom(
    {
      id: String(row.id),
      label: String(row.label),
      href: String(row.href),
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? 0),
    },
    row
  );
}

// ── Collection counts (dry-run / verify reporting) ──────────────────────────

export function contentCounts(content: CMSContent): Record<string, number> {
  return {
    portfolioCategories: content.portfolioCategories?.length ?? 0,
    portfolioProjects: content.portfolioProjects?.length ?? 0,
    projectMedia: (content.portfolioProjects ?? []).reduce(
      (sum, p) => sum + projectMediaRows(p).length,
      0
    ),
    heroSlides: content.heroSlides?.length ?? 0,
    partners: content.partners?.length ?? 0,
    brandsPageLogos: content.brandsPageLogos?.length ?? 0,
    reviews: content.reviews?.length ?? 0,
    testimonials: content.testimonials?.length ?? 0,
    instagramPosts: content.instagramPosts?.length ?? 0,
    instagramReels: content.instagramReels?.length ?? 0,
    features: content.features?.length ?? 0,
    industries: content.industries?.length ?? 0,
    processSteps: content.processSteps?.length ?? 0,
    faq: content.faq?.length ?? 0,
    services: content.services?.length ?? 0,
    nav: content.nav?.length ?? 0,
    settings: SETTING_KEYS.length,
  };
}
