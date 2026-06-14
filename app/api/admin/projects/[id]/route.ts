import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import type { CMSProject } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;

  const { readCMSContent } = await import("@/lib/cms/store");
  const content = await readCMSContent();
  const project = content.projects.find((p) => p.id === id);
  if (!project) return jsonError("Project not found", 404);
  return jsonOk(project);
}

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body");

  let found: CMSProject | undefined;
  await updateCMSContent((c) => ({
    ...c,
    projects: c.projects.map((p) => {
      if (p.id !== id) return p;
      const updated: CMSProject = { ...p, ...body, id: p.id };
      found = updated;
      return updated;
    }),
  }));

  if (!found) return jsonError("Project not found", 404);
  return jsonOk(found);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;

  let existed = false;
  await updateCMSContent((c) => {
    existed = c.projects.some((p) => p.id === id);
    return { ...c, projects: c.projects.filter((p) => p.id !== id) };
  });

  if (!existed) return jsonError("Project not found", 404);
  return jsonOk({ success: true });
}
