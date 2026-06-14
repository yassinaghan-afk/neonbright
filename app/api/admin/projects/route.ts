import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSProject } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.projects);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.title) return jsonError("Title is required");

  const project: CMSProject = {
    id: createId("proj"),
    title: body.title,
    industry: body.industry ?? "",
    city: body.city ?? "",
    country: body.country ?? "",
    description: body.description ?? "",
    installationSize: body.installationSize ?? "",
    completedDate: body.completedDate ?? "",
    image: body.image ?? "",
    imageAlt: body.imageAlt ?? "",
    accent: body.accent ?? "neon-pink",
    featured: Boolean(body.featured),
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    projects: [...c.projects, project],
  }));

  return jsonOk(project, 201);
}
