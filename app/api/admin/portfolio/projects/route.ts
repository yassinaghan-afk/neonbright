import { NextRequest } from "next/server";
import { jsonOk, jsonError, jsonErrorFromUnknown, requireOwner } from "@/lib/cms/api";
import { getPortfolioApiPayload } from "@/lib/cms/portfolio";
import { updateCMSContent } from "@/lib/cms/store";
import { logCmsSync } from "@/lib/cms/sync-log";
import { createId } from "@/lib/cms/id";
import type { CMSPortfolioProject } from "@/lib/cms/types";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireOwner();
    if (error) return error;

    const categoryId = req.nextUrl.searchParams.get("categoryId");
    const { projects } = await getPortfolioApiPayload({ includeHidden: true });
    const filtered = categoryId
      ? projects.filter((p) => p.categoryId === categoryId)
      : projects;
    return jsonOk(filtered);
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.title?.trim() || !body.categoryId) {
    return jsonError("Title and category are required.");
  }

  const slug =
    String(body.slug ?? body.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || createId("proj");

  const item: CMSPortfolioProject = {
    id: createId("proj"),
    categoryId: String(body.categoryId),
    slug,
    title: String(body.title).trim(),
    description: String(body.description ?? "").trim(),
    shortDescription: String(body.shortDescription ?? body.description ?? "").trim(),
    client: String(body.client ?? "").trim(),
    city: String(body.city ?? "").trim(),
    country: String(body.country ?? "").trim(),
    year: String(body.year ?? "").trim(),
    images: Array.isArray(body.images) ? body.images : [],
    videos: Array.isArray(body.videos) ? body.videos : [],
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    featuredImage: String(body.featuredImage ?? body.coverImage ?? ""),
    coverImage: String(body.coverImage ?? body.featuredImage ?? ""),
    thumbnail: String(body.thumbnail ?? ""),
    imageAlt: String(body.imageAlt ?? body.title).trim(),
    tags: Array.isArray(body.tags) ? body.tags : [],
    accent: body.accent ?? "neon-pink",
    published: body.published !== false,
    sortOrder:
      typeof body.sortOrder === "number"
        ? body.sortOrder
        : undefined,
    type: body.type,
    typeLabel: body.typeLabel,
    logoFile: body.logoFile,
    installationType: body.installationType,
    beforeImage: body.beforeImage,
    afterImage: body.afterImage,
    relatedProjectSlugs: body.relatedProjectSlugs,
    technologies: body.technologies,
    filters: body.filters,
  };

  const updated = await updateCMSContent((c) => {
    const inCategory = (c.portfolioProjects ?? []).filter(
      (project) => project.categoryId === item.categoryId
    ).length;
    const withOrder = {
      ...item,
      sortOrder: item.sortOrder ?? inCategory,
    };
    return {
      ...c,
      portfolioProjects: [...(c.portfolioProjects ?? []), withOrder],
    };
  });

  const created = updated.portfolioProjects.find((p) => p.id === item.id) ?? item;
  return jsonOk(created, 201);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  if (categoryId && Array.isArray(body)) {
    const incoming = body as CMSPortfolioProject[];
    const incomingIds = new Set(incoming.map((project) => project.id));

    const updated = await updateCMSContent((c) => {
      // Payload order is authoritative. Any category projects missing from the
      // payload are appended at the end so sortOrder stays contiguous.
      const missing = (c.portfolioProjects ?? []).filter(
        (project) => project.categoryId === categoryId && !incomingIds.has(project.id)
      );
      const finalOrder = [
        ...incoming.map((project) => project.id),
        ...missing.map((project) => project.id),
      ];
      const orderById = new Map(finalOrder.map((id, index) => [id, index]));

      return {
        ...c,
        portfolioProjects: (c.portfolioProjects ?? []).map((project) =>
          project.categoryId === categoryId && orderById.has(project.id)
            ? { ...project, sortOrder: orderById.get(project.id)! }
            : project
        ),
      };
    });

    logCmsSync("save", {
      type: "portfolio-reorder-scoped",
      categoryId,
      count: incoming.length,
      order: updated.portfolioProjects
        .filter((project) => project.categoryId === categoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((project) => `${project.id.slice(-6)}:${project.sortOrder}`)
        .join(","),
    });

    return jsonOk(
      updated.portfolioProjects
        .filter((project) => project.categoryId === categoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }

  if (!Array.isArray(body)) return jsonError("Expected array of projects.");

  const projects = (body as CMSPortfolioProject[]).map((p, i) => ({
    ...p,
    sortOrder: i,
  }));

  const updated = await updateCMSContent((c) => ({
    ...c,
    portfolioProjects: projects,
  }));

  logCmsSync("save", {
    type: "portfolio-reorder",
    count: projects.length,
    order: projects.map((p, i) => `${p.id.slice(-6)}:${i}`).join(","),
  });

  return jsonOk(updated.portfolioProjects);
}
