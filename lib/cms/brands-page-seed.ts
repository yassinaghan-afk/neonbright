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
 * Restore marques-clients portfolio entries when the live CMS blob has none.
 * Keeps admin CRUD intact once projects exist.
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

  const publishedMarques = content.portfolioProjects.filter(
    (project) => project.categoryId === marquesCategory.id && project.published
  );
  if (publishedMarques.length > 0) {
    return { content, changed: false };
  }

  const seed = getBrandsPageSeedProjects(marquesCategory.id);
  if (seed.length === 0) {
    return { content, changed: false };
  }

  console.log(
    `[cms-sync] brands-page-seed: restoring ${seed.length} marques-clients projects`
  );

  return {
    content: {
      ...content,
      portfolioProjects: [...content.portfolioProjects, ...seed],
    },
    changed: true,
  };
}
