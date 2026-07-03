import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireOwner } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { logCmsSync } from "@/lib/cms/sync-log";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const updated = await updateCMSContent((c) => ({
    ...c,
    portfolioCategories: (c.portfolioCategories ?? []).map((item) =>
      item.id === id ? { ...item, ...body, id } : item
    ),
  }));

  const item = updated.portfolioCategories.find((c) => c.id === id);
  if (!item) return jsonError("Category not found.", 404);
  return jsonOk(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  let found = false;
  let removedProjects = 0;

  const updated = await updateCMSContent((c) => {
    const categories = c.portfolioCategories ?? [];
    const projects = c.portfolioProjects ?? [];
    found = categories.some((item) => item.id === id);
    const remainingProjects = projects.filter((p) => p.categoryId !== id);
    removedProjects = projects.length - remainingProjects.length;
    return {
      ...c,
      portfolioCategories: categories.filter((item) => item.id !== id),
      portfolioProjects: remainingProjects,
    };
  });

  if (!found) return jsonError("Category not found.", 404);

  logCmsSync("delete", {
    type: "portfolio-category",
    id,
    removedProjects,
    remainingCategories: updated.portfolioCategories.length,
    remainingProjects: updated.portfolioProjects.length,
  });

  return jsonOk({
    deleted: id,
    removedProjects,
    remainingCategories: updated.portfolioCategories.length,
    remainingProjects: updated.portfolioProjects.length,
  });
}
