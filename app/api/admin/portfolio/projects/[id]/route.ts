import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { logCmsSync } from "@/lib/cms/sync-log";
import type { CMSPortfolioProject } from "@/lib/cms/types";

function normalizeBrandProjectUpdate(
  item: CMSPortfolioProject,
  body: Partial<CMSPortfolioProject>,
  categorySlug: string | undefined
): CMSPortfolioProject {
  const next: CMSPortfolioProject = { ...item, ...body, id: item.id };

  if (categorySlug !== "marques-clients") {
    return next;
  }

  if (Array.isArray(body.gallery)) {
    next.gallery = body.gallery;
    next.images = body.gallery;
  }

  return next;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const updated = await updateCMSContent((c) => ({
    ...c,
    portfolioProjects: (c.portfolioProjects ?? []).map((item) => {
      if (item.id !== id) return item;
      const categorySlug = c.portfolioCategories.find(
        (category) => category.id === item.categoryId
      )?.slug;
      return normalizeBrandProjectUpdate(item, body, categorySlug);
    }),
  }));

  const item = updated.portfolioProjects.find((p) => p.id === id);
  if (!item) return jsonError("Project not found.", 404);

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

  const updated = await updateCMSContent((c) => {
    const before = c.portfolioProjects ?? [];
    found = before.some((item) => item.id === id);
    const after = before.filter((item) => item.id !== id);
    return { ...c, portfolioProjects: after };
  });

  if (!found) return jsonError("Project not found.", 404);

  logCmsSync("delete", {
    type: "portfolio-project",
    id,
    remaining: updated.portfolioProjects.length,
  });

  return jsonOk({ deleted: id, remaining: updated.portfolioProjects.length });
}
