import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { readCMSContent } from "@/lib/cms/store";

/** @deprecated Use /api/admin/portfolio/projects */
export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.portfolioProjects ?? content.projects ?? []);
}

/** @deprecated Use /api/admin/portfolio/projects */
export async function POST() {
  return jsonError("Use /api/admin/portfolio/projects instead.", 410);
}
