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
 * Bootstrap the marques-clients collection from the canonical seed.
 *
 * Runs ONLY when the category has zero projects (fresh install / empty blob).
 * It must never merge individual "missing" brands back in: the admin is the
 * source of truth, so a deliberately deleted brand must stay deleted.
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

  const existingCount = content.portfolioProjects.filter(
    (project) => project.categoryId === marquesCategory.id
  ).length;
  if (existingCount > 0) {
    return { content, changed: false };
  }

  const seed = getBrandsPageSeedProjects(marquesCategory.id);
  if (seed.length === 0) {
    return { content, changed: false };
  }

  console.log(
    `[cms-sync] brands-page-seed: bootstrapping ${seed.length} marques-clients projects (category was empty)`
  );

  return {
    content: {
      ...content,
      portfolioProjects: [...content.portfolioProjects, ...seed],
    },
    changed: true,
  };
}
