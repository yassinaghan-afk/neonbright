import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { deleteUploadFile } from "@/lib/cms/upload-storage";
import { logCmsSync } from "@/lib/cms/sync-log";
import type { CMSContent, CMSPortfolioProject } from "@/lib/cms/types";

function normalizeBrandProjectUpdate(
  item: CMSPortfolioProject,
  body: Partial<CMSPortfolioProject>,
  categorySlug: string | undefined
): CMSPortfolioProject {
  const next: CMSPortfolioProject = { ...item, ...body, id: item.id };

  if (categorySlug !== "marques-clients") {
    return next;
  }

  const galleryTouched =
    Object.prototype.hasOwnProperty.call(body, "gallery") ||
    Object.prototype.hasOwnProperty.call(body, "images");

  const canonicalGallery = Array.isArray(body.gallery)
    ? body.gallery
    : Array.isArray(body.images)
      ? body.images
      : galleryTouched
        ? []
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

/** Collect every image URL referenced by a project (deduped). */
function collectProjectImageUrls(project: CMSPortfolioProject): string[] {
  const urls = new Set<string>();
  const add = (url: string | undefined) => {
    if (url) urls.add(url);
  };
  (project.gallery ?? []).forEach(add);
  (project.images ?? []).forEach(add);
  add(project.featuredImage);
  add(project.coverImage);
  add(project.thumbnail);
  add(project.beforeImage);
  add(project.afterImage);
  return [...urls];
}

/** All Blob URLs referenced anywhere in the CMS. */
function allCMSBlobUrls(content: CMSContent): Set<string> {
  const refs = new Set<string>();
  for (const project of content.portfolioProjects ?? []) {
    collectProjectImageUrls(project).forEach((u) => refs.add(u));
  }
  return refs;
}

/** Delete Blob-hosted images that are no longer referenced anywhere in the CMS. */
async function deleteOrphanedBlobImages(
  candidates: string[],
  updatedContent: CMSContent
): Promise<void> {
  const stillReferenced = allCMSBlobUrls(updatedContent);

  const toDelete = candidates.filter(
    (url) =>
      url.includes(".blob.vercel-storage.com") && !stillReferenced.has(url)
  );

  for (const url of toDelete) {
    try {
      await deleteUploadFile(url);
      logCmsSync("delete", { type: "orphaned-blob-image", url });
    } catch (err) {
      console.warn(
        "[cms] failed to delete orphaned blob image:",
        url,
        err instanceof Error ? err.message : err
      );
    }
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Capture old image URLs before the update so we can clean up orphans
  // afterwards (synchronously inside the updater, async deletion outside).
  let oldImageUrls: string[] = [];

  const updated = await updateCMSContent((c) => {
    const old = (c.portfolioProjects ?? []).find((p) => p.id === id);
    if (old) {
      oldImageUrls = collectProjectImageUrls(old);
    }

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

  logCmsSync("save", {
    type: "portfolio-project",
    id,
    galleryCount: item.gallery?.length ?? 0,
    imagesCount: item.images?.length ?? 0,
  });

  // Clean up Blob files no longer referenced — fire-and-forget so the API
  // response is not delayed by storage operations.
  if (oldImageUrls.length > 0) {
    void deleteOrphanedBlobImages(oldImageUrls, updated);
  }

  return jsonOk(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  let found = false;
  let projectImageUrls: string[] = [];

  const updated = await updateCMSContent((c) => {
    const before = c.portfolioProjects ?? [];
    const target = before.find((item) => item.id === id);
    found = Boolean(target);
    if (target) {
      projectImageUrls = collectProjectImageUrls(target);
    }
    const after = before.filter((item) => item.id !== id);
    return { ...c, portfolioProjects: after };
  });

  if (!found) return jsonError("Project not found.", 404);

  logCmsSync("delete", {
    type: "portfolio-project",
    id,
    remaining: updated.portfolioProjects.length,
  });

  // Delete all Blob images that belonged to this project and are no longer
  // referenced anywhere else in the CMS.
  if (projectImageUrls.length > 0) {
    void deleteOrphanedBlobImages(projectImageUrls, updated);
  }

  return jsonOk({ deleted: id, remaining: updated.portfolioProjects.length });
}
