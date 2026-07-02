import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { normalizePartners } from "@/lib/cms/normalize";
import { readCMSContentFresh, updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import type { CMSPartner } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContentFresh();
  return jsonOk(content.partners);
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const items: CMSPartner[] | null = Array.isArray(body)
    ? body
    : Array.isArray(body?.partners)
      ? body.partners
      : null;

  if (!items) {
    return jsonError("partners array is required");
  }

  const persisted = await updateCMSContent((c) => ({
    ...c,
    partners: normalizePartners(items, c.partners),
  }));

  revalidatePublicSite();

  return jsonOk(persisted.partners);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.name) return jsonError("Name is required");

  const content = await readCMSContentFresh();
  const item: CMSPartner = {
    id: createId("partner"),
    name: body.name,
    logoUrl: body.logoUrl ?? "",
    enabled: body.enabled !== false,
    sortOrder: body.sortOrder ?? content.partners.length,
  };

  await updateCMSContent((c) => ({
    ...c,
    partners: [...c.partners, item],
  }));

  revalidatePublicSite();

  return jsonOk(item, 201);
}
