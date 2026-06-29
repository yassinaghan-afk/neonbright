import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { buildWhatsAppBaseUrl } from "@/lib/cms/contact-social";
import { updateCMSContent } from "@/lib/cms/store";
import type { ContactInfo, SocialLinks } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

function normalizeContact(body: Partial<ContactInfo>): ContactInfo {
  const whatsapp = String(body.whatsapp ?? "").trim();
  const phone = String(body.phone ?? whatsapp).trim();
  return {
    address: String(body.address ?? "").trim(),
    email: String(body.email ?? "").trim(),
    phone,
    whatsapp: whatsapp || phone,
    googleMapsUrl: String(body.googleMapsUrl ?? "").trim(),
    openingHours: body.openingHours,
  };
}

function normalizeSocial(body: Partial<SocialLinks>): SocialLinks {
  return {
    instagram: String(body.instagram ?? "").trim(),
    facebook: String(body.facebook ?? "").trim(),
    linkedin: String(body.linkedin ?? "").trim(),
    pinterest: String(body.pinterest ?? "").trim(),
    twitter: String(body.twitter ?? "").trim(),
  };
}

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const { readCMSContent } = await import("@/lib/cms/store");
  const content = await readCMSContent();
  const whatsappNumber =
    content.contact.whatsapp?.trim() || content.contact.phone?.trim() || "";

  return jsonOk({
    contact: content.contact,
    social: content.social,
    whatsAppLink: buildWhatsAppBaseUrl(whatsappNumber),
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.contact && !body?.social) {
    return jsonError("contact or social data is required");
  }

  const updated = await updateCMSContent((c) => {
    const contact = body.contact
      ? normalizeContact(body.contact as Partial<ContactInfo>)
      : c.contact;
    const social = body.social
      ? normalizeSocial(body.social as Partial<SocialLinks>)
      : c.social;

    // Keep Instagram feed settings URL in sync with social profile URL.
    const instagram = body.social?.instagram
      ? { ...c.instagram, url: social.instagram }
      : c.instagram;

    return { ...c, contact, social, instagram };
  });

  const whatsappNumber =
    updated.contact.whatsapp?.trim() || updated.contact.phone?.trim() || "";

  return jsonOk({
    contact: updated.contact,
    social: updated.social,
    whatsAppLink: buildWhatsAppBaseUrl(whatsappNumber),
  });
}
