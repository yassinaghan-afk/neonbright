import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { updateCMSContent } from "@/lib/cms/store";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import type { CompanyInfo, ContactInfo, SocialLinks } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid body");

  const updated = await updateCMSContent((c) => ({
    ...c,
    ...(body.company ? { company: body.company as CompanyInfo } : {}),
    ...(body.contact ? { contact: body.contact as ContactInfo } : {}),
    ...(body.social ? { social: body.social as SocialLinks } : {}),
  }));

  revalidatePublicSite();

  return jsonOk({
    company: updated.company,
    contact: updated.contact,
    social: updated.social,
  });
}
