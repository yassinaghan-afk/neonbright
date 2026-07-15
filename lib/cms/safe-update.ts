/**
 * Safe partial update helpers that preserve unchanged fields.
 *
 * NEVER use `{ ...existing, ...body }` directly for partial updates!
 * That pattern cannot distinguish between "field omitted" and "field is undefined".
 */

import type {
  CMSPortfolioProject,
  CMSHeroSlide,
  CMSPartner,
  CMSTestimonial,
  CMSFeature,
  CMSIndustry,
  CMSProcessStep,
  CMSFAQItem,
  CMSService,
} from "@/lib/cms/types";

/**
 * Helper to safely get a value from body, falling back to existing value.
 * Only overwrites if the field exists in the body object.
 */
function safeGet<T>(
  body: Record<string, unknown>,
  key: string,
  existing: T
): T {
  return Object.prototype.hasOwnProperty.call(body, key)
    ? (body[key] as T)
    : existing;
}

/**
 * Safe array getter - ensures we always get an array, never undefined.
 */
function safeArray<T>(
  body: Record<string, unknown>,
  key: string,
  existing: T[]
): T[] {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return existing;
  }
  const value = body[key];
  return Array.isArray(value) ? (value as T[]) : existing;
}

/**
 * Safe string getter - ensures we always get a string.
 */
function safeString(
  body: Record<string, unknown>,
  key: string,
  existing: string
): string {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return existing;
  }
  const value = body[key];
  return value != null ? String(value) : existing;
}

/**
 * Safe number getter.
 */
function safeNumber(
  body: Record<string, unknown>,
  key: string,
  existing: number
): number {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return existing;
  }
  const value = body[key];
  return typeof value === "number" ? value : existing;
}

/**
 * Safe boolean getter.
 */
function safeBoolean(
  body: Record<string, unknown>,
  key: string,
  existing: boolean
): boolean {
  if (!Object.prototype.hasOwnProperty.call(body, key)) {
    return existing;
  }
  return body[key] !== false;
}

/**
 * Safely update a portfolio project, preserving unchanged fields.
 */
export function safeUpdatePortfolioProject(
  existing: CMSPortfolioProject,
  body: Partial<CMSPortfolioProject>
): CMSPortfolioProject {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id, // Never change ID
    categoryId: safeString(bodyRecord, "categoryId", existing.categoryId),
    slug: safeString(bodyRecord, "slug", existing.slug),
    title: safeString(bodyRecord, "title", existing.title),
    description: safeString(bodyRecord, "description", existing.description),
    shortDescription: safeString(
      bodyRecord,
      "shortDescription",
      existing.shortDescription
    ),
    client: safeString(bodyRecord, "client", existing.client),
    city: safeString(bodyRecord, "city", existing.city),
    country: safeString(bodyRecord, "country", existing.country),
    year: safeString(bodyRecord, "year", existing.year),
    images: safeArray(bodyRecord, "images", existing.images ?? []),
    videos: safeArray(bodyRecord, "videos", existing.videos ?? []),
    gallery: safeArray(bodyRecord, "gallery", existing.gallery ?? []),
    featuredImage: safeString(
      bodyRecord,
      "featuredImage",
      existing.featuredImage
    ),
    coverImage: safeString(bodyRecord, "coverImage", existing.coverImage),
    thumbnail: safeString(bodyRecord, "thumbnail", existing.thumbnail),
    imageAlt: safeString(bodyRecord, "imageAlt", existing.imageAlt),
    tags: safeArray(bodyRecord, "tags", existing.tags ?? []),
    accent: safeGet(bodyRecord, "accent", existing.accent),
    published: safeBoolean(bodyRecord, "published", existing.published),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
    type: safeGet(bodyRecord, "type", existing.type),
    typeLabel: safeGet(bodyRecord, "typeLabel", existing.typeLabel),
    logoFile: safeGet(bodyRecord, "logoFile", existing.logoFile),
    installationType: safeGet(
      bodyRecord,
      "installationType",
      existing.installationType
    ),
    beforeImage: safeGet(bodyRecord, "beforeImage", existing.beforeImage),
    afterImage: safeGet(bodyRecord, "afterImage", existing.afterImage),
    relatedProjectSlugs: safeGet(
      bodyRecord,
      "relatedProjectSlugs",
      existing.relatedProjectSlugs
    ),
    technologies: safeGet(bodyRecord, "technologies", existing.technologies),
    filters: safeGet(bodyRecord, "filters", existing.filters),
  };
}

/**
 * Safely update a hero slide, preserving unchanged fields.
 */
export function safeUpdateHeroSlide(
  existing: CMSHeroSlide,
  body: Partial<CMSHeroSlide>
): CMSHeroSlide {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id,
    src: safeString(bodyRecord, "src", existing.src),
    alt: safeString(bodyRecord, "alt", existing.alt),
    link: safeGet(bodyRecord, "link", existing.link),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
  };
}

/**
 * Safely update a partner, preserving unchanged fields.
 */
export function safeUpdatePartner(
  existing: CMSPartner,
  body: Partial<CMSPartner>
): CMSPartner {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id,
    name: safeString(bodyRecord, "name", existing.name),
    logo: safeString(bodyRecord, "logo", existing.logo),
    url: safeString(bodyRecord, "url", existing.url ?? ""),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
    category: safeGet(bodyRecord, "category", existing.category),
  };
}

/**
 * Safely update a feature, preserving unchanged fields.
 */
export function safeUpdateFeature(
  existing: CMSFeature,
  body: Partial<CMSFeature>
): CMSFeature {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id,
    icon: safeString(bodyRecord, "icon", existing.icon),
    title: safeString(bodyRecord, "title", existing.title),
    description: safeString(bodyRecord, "description", existing.description),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
  };
}

/**
 * Safely update an industry, preserving unchanged fields.
 */
export function safeUpdateIndustry(
  existing: CMSIndustry,
  body: Partial<CMSIndustry>
): CMSIndustry {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id,
    name: safeString(bodyRecord, "name", existing.name),
    icon: safeString(bodyRecord, "icon", existing.icon),
    description: safeString(bodyRecord, "description", existing.description),
    examples: safeArray(bodyRecord, "examples", existing.examples ?? []),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
  };
}

/**
 * Safely update a process step, preserving unchanged fields.
 */
export function safeUpdateProcessStep(
  existing: CMSProcessStep,
  body: Partial<CMSProcessStep>
): CMSProcessStep {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id,
    number: safeString(bodyRecord, "number", existing.number),
    title: safeString(bodyRecord, "title", existing.title),
    description: safeString(bodyRecord, "description", existing.description),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
  };
}

/**
 * Safely update an FAQ item, preserving unchanged fields.
 */
export function safeUpdateFAQ(
  existing: CMSFAQItem,
  body: Partial<CMSFAQItem>
): CMSFAQItem {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id,
    question: safeString(bodyRecord, "question", existing.question),
    answer: safeString(bodyRecord, "answer", existing.answer),
    category: safeString(bodyRecord, "category", existing.category ?? ""),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
  };
}

/**
 * Safely update a service, preserving unchanged fields.
 */
export function safeUpdateService(
  existing: CMSService,
  body: Partial<CMSService>
): CMSService {
  const bodyRecord = body as Record<string, unknown>;

  return {
    id: existing.id,
    icon: safeString(bodyRecord, "icon", existing.icon),
    title: safeString(bodyRecord, "title", existing.title),
    description: safeString(bodyRecord, "description", existing.description),
    features: safeArray(bodyRecord, "features", existing.features ?? []),
    sortOrder: safeNumber(bodyRecord, "sortOrder", existing.sortOrder),
  };
}
