import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { readCMSContent } from "@/lib/cms/store";

type Params = { params: Promise<{ id: string }> };

/** @deprecated Use /api/admin/portfolio/projects/[id] */
export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;

  const content = await readCMSContent();
  const projects = content.portfolioProjects ?? content.projects ?? [];
  const project = projects.find((p) => p.id === id);
  if (!project) return jsonError("Project not found", 404);
  return jsonOk(project);
}

/** @deprecated Use /api/admin/portfolio/projects/[id] */
export async function PUT() {
  return jsonError("Use /api/admin/portfolio/projects/[id] instead.", 410);
}

/** @deprecated Use /api/admin/portfolio/projects/[id] */
export async function DELETE() {
  return jsonError("Use /api/admin/portfolio/projects/[id] instead.", 410);
}
