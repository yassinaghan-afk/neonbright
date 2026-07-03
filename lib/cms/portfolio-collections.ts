import type { CMSPortfolioCategory, CMSPortfolioProject } from "./types";

export type PortfolioCollectionKey = "events" | "brands";

export const PORTFOLIO_COLLECTIONS: Record<
  PortfolioCollectionKey,
  {
    slug: string;
    label: string;
    adminTitle: string;
    adminDescription: string;
    defaultHref: string;
    pageTitleDefault: string;
  }
> = {
  events: {
    slug: "evenements",
    label: "Événements",
    adminTitle: "Events",
    adminDescription: "Catégories et projets événementiels — page /realisations/events",
    defaultHref: "/realisations/events",
    pageTitleDefault: "ÉVÉNEMENTS",
  },
  brands: {
    slug: "marques-clients",
    label: "Marques & Clients",
    adminTitle: "Brands",
    adminDescription: "Catégories et projets marques — page /realisations/brands",
    defaultHref: "/realisations/brands",
    pageTitleDefault: "MARQUES & CLIENTS",
  },
};

export function getCollectionConfig(key: PortfolioCollectionKey) {
  return PORTFOLIO_COLLECTIONS[key];
}

export function filterCategoriesForCollection(
  categories: CMSPortfolioCategory[],
  key: PortfolioCollectionKey
): CMSPortfolioCategory[] {
  const slug = PORTFOLIO_COLLECTIONS[key].slug;
  return categories.filter((category) => category.slug === slug);
}

export function filterProjectsForCollection(
  projects: CMSPortfolioProject[],
  categories: CMSPortfolioCategory[],
  key: PortfolioCollectionKey
): CMSPortfolioProject[] {
  const collectionCategories = filterCategoriesForCollection(categories, key);
  const categoryIds = new Set(collectionCategories.map((category) => category.id));
  return projects.filter((project) => categoryIds.has(project.categoryId));
}

export function mergeCategoryOrder(
  allCategories: CMSPortfolioCategory[],
  reorderedSubset: CMSPortfolioCategory[]
): CMSPortfolioCategory[] {
  const byId = new Map(reorderedSubset.map((category) => [category.id, category]));
  return allCategories.map((category) => byId.get(category.id) ?? category);
}

export function reorderProjectsInCategory(
  projects: CMSPortfolioProject[],
  categoryId: string,
  orderedIds: string[]
): CMSPortfolioProject[] {
  const inCategory = projects
    .filter((project) => project.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const byId = new Map(inCategory.map((project) => [project.id, project]));
  const reordered = orderedIds
    .map((id) => byId.get(id))
    .filter((project): project is CMSPortfolioProject => Boolean(project));

  const orderById = new Map(reordered.map((project, index) => [project.id, index]));
  return projects.map((project) =>
    project.categoryId === categoryId && orderById.has(project.id)
      ? { ...project, sortOrder: orderById.get(project.id)! }
      : project
  );
}
