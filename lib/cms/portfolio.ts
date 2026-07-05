import type { PortfolioCategory } from "@/lib/portfolio/types";
import type { EventProject } from "@/lib/events";
import type { BrandProfile, ResolvedBrand } from "@/lib/brands/types";
import { sortByOrder } from "@/lib/cms/normalize";
import { readCMSContent, readCMSContentFresh } from "@/lib/cms/store";
import { resolvePublicAsset, resolvePublicAssets } from "@/lib/media/public-asset";
import type {
  CMSPortfolioCategory,
  CMSPortfolioProject,
  HeroContent,
} from "@/lib/cms/types";

function projectGallerySource(project: CMSPortfolioProject): string[] {
  if (Array.isArray(project.gallery)) {
    return project.gallery;
  }
  return project.images ?? [];
}

/** Brands use gallery as the single source of truth — never resurrect stale images[]. */
function brandProjectGallerySource(project: CMSPortfolioProject): string[] {
  return Array.isArray(project.gallery) ? project.gallery : [];
}

function isBrandPortfolioProject(
  project: CMSPortfolioProject,
  categories: CMSPortfolioCategory[]
): boolean {
  const category = categories.find((item) => item.id === project.categoryId);
  return category?.slug === "marques-clients";
}

function resolveProjectImages(
  p: CMSPortfolioProject,
  options?: { brandGalleryOnly?: boolean }
): CMSPortfolioProject {
  const source = options?.brandGalleryOnly
    ? brandProjectGallerySource(p)
    : projectGallerySource(p);
  const gallery = resolvePublicAssets(source);
  const coverImage = resolvePublicAsset(p.coverImage) ?? "";
  const featuredImage = resolvePublicAsset(p.featuredImage) ?? coverImage;
  const thumbnail = resolvePublicAsset(p.thumbnail) ?? featuredImage;
  const beforeImage = resolvePublicAsset(p.beforeImage) ?? undefined;
  const afterImage = resolvePublicAsset(p.afterImage) ?? featuredImage;

  return {
    ...p,
    gallery,
    images: gallery,
    coverImage,
    featuredImage,
    thumbnail,
    beforeImage,
    afterImage,
  };
}

export function toPortfolioCategory(cat: CMSPortfolioCategory): PortfolioCategory {
  const coverImage = resolvePublicAsset(cat.coverImage) ?? cat.coverImage;
  return {
    id: cat.slug,
    title: cat.title,
    titleAccent: cat.titleAccent,
    description: cat.description,
    coverImage,
    coverAlt: cat.coverAlt,
    href: cat.href,
  };
}

export function toEventProject(p: CMSPortfolioProject): EventProject {
  return {
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription || p.description,
    fullDescription: p.description,
    city: p.city,
    country: p.country,
    year: p.year,
    client: p.client,
    technologies: p.technologies ?? [],
    filters: (p.filters ?? p.tags) as EventProject["filters"],
    image: p.featuredImage || p.coverImage,
    imageAlt: p.imageAlt || p.title,
    gallery: projectGallerySource(p),
    accent: p.accent,
    featured: p.sortOrder === 0,
  };
}

export function toBrandProfile(p: CMSPortfolioProject): BrandProfile {
  return {
    slug: p.slug,
    name: p.title,
    type: (p.type ?? "corporate") as BrandProfile["type"],
    typeLabel: p.typeLabel ?? "",
    logoFile: p.logoFile ?? "",
    city: p.city,
    country: p.country,
    year: p.year,
    description: p.description,
    installationType: p.installationType ?? "",
    projectCount: 1,
    gallery: brandProjectGallerySource(p),
    technologies: p.technologies ?? [],
    beforeImage: p.beforeImage ?? p.thumbnail ?? p.featuredImage,
    afterImage: p.afterImage ?? p.featuredImage,
    relatedEventSlugs: p.relatedProjectSlugs ?? [],
  };
}

export async function getHeroContent(): Promise<HeroContent> {
  const content = await readCMSContent();
  return content.hero;
}

export async function getEnabledPortfolioCategories(): Promise<CMSPortfolioCategory[]> {
  const content = await readCMSContent();
  return sortByOrder(content.portfolioCategories).filter((c) => c.enabled);
}

export async function getPortfolioCategoryBySlug(
  slug: string
): Promise<CMSPortfolioCategory | undefined> {
  const content = await readCMSContent();
  return content.portfolioCategories.find((c) => c.slug === slug);
}

export async function getPortfolioProjectsByCategorySlug(
  categorySlug: string,
  publishedOnly = true
): Promise<CMSPortfolioProject[]> {
  const content = await readCMSContent();
  const category = content.portfolioCategories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  const brandGalleryOnly = categorySlug === "marques-clients";
  const projects = sortByOrder(
    content.portfolioProjects.filter(
      (p) =>
        p.categoryId === category.id && (!publishedOnly || p.published)
    )
  );
  return projects.map((project) =>
    resolveProjectImages(project, { brandGalleryOnly })
  );
}

export async function getPortfolioProjectBySlug(
  categorySlug: string,
  projectSlug: string
): Promise<CMSPortfolioProject | undefined> {
  const projects = await getPortfolioProjectsByCategorySlug(categorySlug, false);
  return projects.find((p) => p.slug === projectSlug && p.published);
}

export async function getEventProjectsFromCMS(): Promise<EventProject[]> {
  const projects = await getPortfolioProjectsByCategorySlug("evenements");
  return projects.map(toEventProject);
}

export async function getEventProjectFromCMS(
  slug: string
): Promise<EventProject | undefined> {
  const p = await getPortfolioProjectBySlug("evenements", slug);
  return p ? toEventProject(p) : undefined;
}

export async function getEventProjectSlugsFromCMS(): Promise<string[]> {
  const projects = await getPortfolioProjectsByCategorySlug("evenements", false);
  return projects.filter((p) => p.published).map((p) => p.slug);
}

export async function getBrandProfilesFromCMS(): Promise<BrandProfile[]> {
  const projects = await getPortfolioProjectsByCategorySlug("marques-clients");
  return projects.map(toBrandProfile);
}

export async function getBrandProfileFromCMS(
  slug: string
): Promise<BrandProfile | undefined> {
  const p = await getPortfolioProjectBySlug("marques-clients", slug);
  return p ? toBrandProfile(p) : undefined;
}

export async function getBrandSlugsFromCMS(): Promise<string[]> {
  const projects = await getPortfolioProjectsByCategorySlug("marques-clients", false);
  return projects.filter((p) => p.published).map((p) => p.slug);
}

export async function resolveBrandsFromCMS(
  logoMap: Map<string, string>
): Promise<ResolvedBrand[]> {
  const profiles = await getBrandProfilesFromCMS();
  return profiles.map((profile) => {
    // Primary: dedicated logo file in /media/logo/
    if (profile.logoFile && logoMap.has(profile.logoFile)) {
      return { ...profile, logoSrc: logoMap.get(profile.logoFile)! };
    }
    // Fallback: use the project's cover/featured image so published projects
    // always appear on the website even when no logo has been uploaded yet.
    const fallbackSrc = resolvePublicAsset(profile.beforeImage) ??
      resolvePublicAsset(profile.afterImage) ??
      resolvePublicAsset(profile.gallery?.[0]) ??
      "";
    return { ...profile, logoSrc: fallbackSrc };
  }).filter((b) => b.logoSrc);
}

export async function getAllPortfolioCategoriesAdmin(): Promise<CMSPortfolioCategory[]> {
  const content = await readCMSContentFresh();
  return sortByOrder(content.portfolioCategories);
}

export async function getAllPortfolioProjectsAdmin(): Promise<CMSPortfolioProject[]> {
  const content = await readCMSContentFresh();
  return sortByOrder(content.portfolioProjects);
}

export type PortfolioApiPayload = {
  categories: CMSPortfolioCategory[];
  projects: CMSPortfolioProject[];
};

/** Shared read model for GET /api/portfolio (public + admin). */
export async function getPortfolioApiPayload(options?: {
  includeHidden?: boolean;
}): Promise<PortfolioApiPayload> {
  const content = await readCMSContentFresh();
  const includeHidden = options?.includeHidden ?? false;

  // allCategories is used for brand-vs-event determination regardless of
  // enabled state — otherwise disabling the marques-clients category would
  // silently fall back to the events-style images[] gallery and resurrect
  // previously deleted brand images.
  const allCategories = sortByOrder(content.portfolioCategories ?? []);
  let categories = allCategories;
  let projects = sortByOrder(content.portfolioProjects ?? []);

  if (!includeHidden) {
    categories = allCategories.filter((c) => c.enabled);
    projects = projects.filter((p) => p.published);
  }

  return {
    categories,
    projects: projects.map((project) =>
      resolveProjectImages(project, {
        brandGalleryOnly: isBrandPortfolioProject(project, allCategories),
      })
    ),
  };
}
