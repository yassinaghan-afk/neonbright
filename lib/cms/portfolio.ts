import type { PortfolioCategory } from "@/lib/portfolio/types";
import type { EventProject } from "@/lib/events";
import type { BrandProfile, ResolvedBrand } from "@/lib/brands/types";
import { sortByOrder } from "@/lib/cms/normalize";
import { readCMSContent } from "@/lib/cms/store";
import { resolvePublicAsset, resolvePublicAssets } from "@/lib/media/public-asset";
import type {
  CMSPortfolioCategory,
  CMSPortfolioProject,
  HeroContent,
} from "@/lib/cms/types";

async function resolveOptionalAsset(url: string | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  return (await resolvePublicAsset(url)) ?? undefined;
}

async function resolveProjectImages(
  p: CMSPortfolioProject
): Promise<CMSPortfolioProject> {
  const rawGallery = p.gallery.length ? p.gallery : p.images;
  const gallery = await resolvePublicAssets(rawGallery);
  const coverImage = (await resolvePublicAsset(p.coverImage)) ?? "";
  const featuredImage =
    (await resolvePublicAsset(p.featuredImage)) ?? coverImage;
  const thumbnail =
    (await resolvePublicAsset(p.thumbnail)) ?? featuredImage;
  const beforeImage = await resolveOptionalAsset(p.beforeImage);
  const afterImage =
    (await resolveOptionalAsset(p.afterImage)) ?? featuredImage;

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

export async function toPortfolioCategory(
  cat: CMSPortfolioCategory
): Promise<PortfolioCategory> {
  const coverImage = (await resolvePublicAsset(cat.coverImage)) ?? cat.coverImage;
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
    gallery: p.gallery.length ? p.gallery : p.images,
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
    gallery: p.gallery.length ? p.gallery : p.images,
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
  const projects = sortByOrder(
    content.portfolioProjects.filter(
      (p) =>
        p.categoryId === category.id && (!publishedOnly || p.published)
    )
  );
  return Promise.all(projects.map(resolveProjectImages));
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
  return profiles
    .filter((profile) => profile.logoFile && logoMap.has(profile.logoFile))
    .map((profile) => ({
      ...profile,
      logoSrc: logoMap.get(profile.logoFile)!,
    }));
}

export async function getAllPortfolioCategoriesAdmin(): Promise<CMSPortfolioCategory[]> {
  const content = await readCMSContent();
  return sortByOrder(content.portfolioCategories);
}

export async function getAllPortfolioProjectsAdmin(): Promise<CMSPortfolioProject[]> {
  const content = await readCMSContent();
  return sortByOrder(content.portfolioProjects);
}
