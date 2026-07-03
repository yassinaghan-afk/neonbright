import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { normalizePartners } from "@/lib/cms/normalize";
import { readCMSContentFresh, updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import type { CMSBrandsPageLogo } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContentFresh();
  return jsonOk(content.brandsPageLogos);
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const items: CMSBrandsPageLogo[] | null = Array.isArray(body)
    ? body
    : Array.isArray(body?.brandsPageLogos)
      ? body.brandsPageLogos
      : null;

  if (!items) {
    return jsonError("brandsPageLogos array is required");
  }

  const persisted = await updateCMSContent((c) => ({
    ...c,
    brandsPageLogos: normalizePartners(items, c.brandsPageLogos),
  }));

  revalidatePublicSite();

  return jsonOk(persisted.brandsPageLogos);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.name) return jsonError("Name is required");

  const content = await readCMSContentFresh();
  const item: CMSBrandsPageLogo = {
    id: createId("bpl"),
    name: body.name,
    logoUrl: body.logoUrl ?? "",
    enabled: body.enabled !== false,
    sortOrder: body.sortOrder ?? content.brandsPageLogos.length,
  };

  await updateCMSContent((c) => ({
    ...c,
    brandsPageLogos: [...c.brandsPageLogos, item],
  }));

  revalidatePublicSite();

  return jsonOk(item, 201);
}
