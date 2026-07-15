import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { logCmsSync } from "@/lib/cms/sync-log";
import { deleteUploadFile } from "@/lib/cms/upload-storage";
import { safeUpdatePortfolioProject } from "@/lib/cms/safe-update";
import type { CMSPortfolioProject } from "@/lib/cms/types";

function normalizeBrandProjectUpdate(
  item: CMSPortfolioProject,
  body: Partial<CMSPortfolioProject>,
  categorySlug: string | undefined
): CMSPortfolioProject {
  // Use safe update to preserve unchanged fields.
  const next = safeUpdatePortfolioProject(item, body);

  if (categorySlug !== "marques-clients") {
    return next;
  }

  const galleryTouched =
    Object.prototype.hasOwnProperty.call(body, "gallery") ||
    Object.prototype.hasOwnProperty.call(body, "images");

  if (!galleryTouched) {
    return next;
  }

  const canonicalGallery = Array.isArray(body.gallery)
    ? body.gallery
    : Array.isArray(body.images)
      ? body.images
      : Array.isArray(item.gallery)
        ? item.gallery
        : [];

  next.gallery = canonicalGallery;
  next.images = canonicalGallery;

  const gallerySet = new Set(canonicalGallery);
  const clearIfOrphaned = (value: string | undefined) =>
    value && !gallerySet.has(value) ? "" : value;

  next.beforeImage = clearIfOrphaned(next.beforeImage);
  next.afterImage = clearIfOrphaned(next.afterImage);
  next.featuredImage = clearIfOrphaned(next.featuredImage) ?? "";
  next.coverImage = clearIfOrphaned(next.coverImage) ?? "";
  next.thumbnail = clearIfOrphaned(next.thumbnail) ?? "";

  return next;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  let oldLogoFile: string | undefined;

  const updated = await updateCMSContent((c) => {
    const existing = (c.portfolioProjects ?? []).find((p) => p.id === id);
    oldLogoFile = existing?.logoFile;
    return {
      ...c,
      portfolioProjects: (c.portfolioProjects ?? []).map((item) => {
        if (item.id !== id) return item;
        const categorySlug = c.portfolioCategories.find(
          (category) => category.id === item.categoryId
        )?.slug;
        return normalizeBrandProjectUpdate(item, body, categorySlug);
      }),
    };
  });

  const item = updated.portfolioProjects.find((p) => p.id === id);
  if (!item) return jsonError("Project not found.", 404);

  // Delete the old logo file when it was replaced or removed.
  const newLogoFile = item.logoFile ?? "";
  if (oldLogoFile && oldLogoFile !== newLogoFile) {
    void deleteUploadFile(oldLogoFile, "logos");
  }

  logCmsSync("save", {
    type: "portfolio-project",
    id,
    galleryCount: item.gallery?.length ?? 0,
    imagesCount: item.images?.length ?? 0,
  });

  return jsonOk(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  let found = false;
  let deletedLogoFile: string | undefined;

  const updated = await updateCMSContent((c) => {
    const before = c.portfolioProjects ?? [];
    const item = before.find((p) => p.id === id);
    found = Boolean(item);
    deletedLogoFile = item?.logoFile;
    const after = before.filter((item) => item.id !== id);
    return { ...c, portfolioProjects: after };
  });

  if (!found) return jsonError("Project not found.", 404);

  // Delete the logo file when the project is removed.
  if (deletedLogoFile) {
    void deleteUploadFile(deletedLogoFile, "logos");
  }

  logCmsSync("delete", {
    type: "portfolio-project",
    id,
    remaining: updated.portfolioProjects.length,
  });

  return jsonOk({ deleted: id, remaining: updated.portfolioProjects.length });
}
