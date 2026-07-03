import { requireOwner, jsonOk, jsonErrorFromUnknown } from "@/lib/cms/api";
import { readCMSContentFresh } from "@/lib/cms/store";
import { sortByOrder } from "@/lib/cms/normalize";

export const dynamic = "force-dynamic";

/**
 * Debug endpoint — admin only.
 * Returns the LIVE portfolio state directly from Blob storage:
 *   GET /api/admin/debug/portfolio
 *
 * Shows category IDs, project IDs, published flags, sortOrders, and logoFiles
 * to help diagnose admin ↔ public sync issues.
 */
export async function GET() {
  try {
    const { error } = await requireOwner();
    if (error) return error;

    const content = await readCMSContentFresh();

    const categories = sortByOrder(content.portfolioCategories ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      title: `${c.title} ${c.titleAccent}`.trim(),
      enabled: c.enabled,
      sortOrder: c.sortOrder,
    }));

    const projects = sortByOrder(content.portfolioProjects ?? []).map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      slug: p.slug,
      title: p.title,
      published: p.published,
      sortOrder: p.sortOrder,
      hasLogoFile: Boolean(p.logoFile),
      logoFile: p.logoFile ?? "",
      hasFeaturedImage: Boolean(p.featuredImage),
      hasCoverImage: Boolean(p.coverImage),
    }));

    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.slug]));

    const projectsByCategory = categories.map((cat) => ({
      categoryId: cat.id,
      categorySlug: cat.slug,
      enabled: cat.enabled,
      projects: projects.filter((p) => p.categoryId === cat.id),
    }));

    const orphanProjects = projects.filter((p) => !categoryMap[p.categoryId]);

    return jsonOk({
      updatedAt: content.updatedAt,
      storage: process.env.VERCEL ? "blob" : "local",
      categories,
      projectsByCategory,
      orphanProjects,
      summary: {
        totalCategories: categories.length,
        enabledCategories: categories.filter((c) => c.enabled).length,
        totalProjects: projects.length,
        publishedProjects: projects.filter((p) => p.published).length,
        hiddenProjects: projects.filter((p) => !p.published).length,
        projectsWithLogo: projects.filter((p) => p.hasLogoFile).length,
        orphanCount: orphanProjects.length,
      },
    });
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}
