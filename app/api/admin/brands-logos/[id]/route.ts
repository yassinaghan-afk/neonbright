import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import type { CMSBrandsPageLogo } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body");

  let found: CMSBrandsPageLogo | undefined;
  await updateCMSContent((c) => ({
    ...c,
    brandsPageLogos: c.brandsPageLogos.map((item) => {
      if (item.id !== id) return item;
      const updated: CMSBrandsPageLogo = { ...item, ...body, id: item.id };
      found = updated;
      return updated;
    }),
  }));

  if (!found) return jsonError("Not found", 404);
  revalidatePublicSite();
  return jsonOk(found);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await params;

  let existed = false;
  await updateCMSContent((c) => {
    existed = c.brandsPageLogos.some((item) => item.id === id);
    return { ...c, brandsPageLogos: c.brandsPageLogos.filter((item) => item.id !== id) };
  });

  if (!existed) return jsonError("Not found", 404);
  revalidatePublicSite();
  return jsonOk({ success: true });
}
