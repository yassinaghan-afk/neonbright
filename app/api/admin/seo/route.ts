import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import type { SEOMetadata } from "@/lib/cms/types";

export async function PATCH(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.seo) return jsonError("SEO data is required");

  const updated = await updateCMSContent((c) => ({
    ...c,
    seo: body.seo as SEOMetadata,
  }));

  return jsonOk(updated.seo);
}
