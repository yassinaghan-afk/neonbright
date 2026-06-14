import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import type { HeroContent } from "@/lib/cms/types";

export async function PATCH(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.hero) return jsonError("Hero data is required");

  const updated = await updateCMSContent((c) => ({
    ...c,
    hero: body.hero as HeroContent,
  }));

  return jsonOk(updated.hero);
}
