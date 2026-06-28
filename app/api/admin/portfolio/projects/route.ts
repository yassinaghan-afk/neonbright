import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import { createId } from "@/lib/cms/id";
import type { CMSPortfolioProject } from "@/lib/cms/types";

export async function GET(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const content = await readCMSContent();
  let projects = content.portfolioProjects ?? [];
  if (categoryId) {
    projects = projects.filter((p) => p.categoryId === categoryId);
  }
  return jsonOk(projects);
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
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Date.now(),
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

  const updated = await updateCMSContent((c) => ({
    ...c,
    portfolioProjects: [...(c.portfolioProjects ?? []), item],
  }));

  return jsonOk(item, 201);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body)) return jsonError("Expected array of projects.");

  const updated = await updateCMSContent((c) => ({
    ...c,
    portfolioProjects: body as CMSPortfolioProject[],
  }));

  return jsonOk(updated.portfolioProjects);
}
