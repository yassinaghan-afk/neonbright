import source from "../../data/cms-content.json";
import type { CMSContent, CMSPortfolioProject } from "./types";

const REFERENCE_MARQUES_CATEGORY_ID = "cat_marques";

/** Canonical brand cards for /realisations/brands — sourced from data/cms-content.json. */
export function getBrandsPageSeedProjects(categoryId: string): CMSPortfolioProject[] {
  const projects = (source as unknown as CMSContent).portfolioProjects.filter(
    (project) => project.categoryId === REFERENCE_MARQUES_CATEGORY_ID
  );

  return projects.map((project) => ({
    ...project,
    categoryId,
    published: true,
  }));
}

/**
 * Restore missing marques-clients portfolio entries from the canonical seed.
 * Adds any seed brand whose slug is not already present in the Brands collection.
 */
export function ensureBrandsPageProjects(
  content: CMSContent
): { content: CMSContent; changed: boolean } {
  const marquesCategory = content.portfolioCategories.find(
    (category) => category.slug === "marques-clients"
  );
  if (!marquesCategory) {
    return { content, changed: false };
  }

  const seed = getBrandsPageSeedProjects(marquesCategory.id);
  if (seed.length === 0) {
    return { content, changed: false };
  }

  const existingMarquesSlugs = new Set(
    content.portfolioProjects
      .filter((project) => project.categoryId === marquesCategory.id)
      .map((project) => project.slug)
  );

  const missing = seed.filter((project) => !existingMarquesSlugs.has(project.slug));
  if (missing.length === 0) {
    return { content, changed: false };
  }

  console.log(
    `[cms-sync] brands-page-seed: adding ${missing.length} missing marques-clients projects (${missing.map((p) => p.slug).join(", ")})`
  );

  return {
    content: {
      ...content,
      portfolioProjects: [...content.portfolioProjects, ...missing],
    },
    changed: true,
  };
}
