import type { ContactInfo, SocialLinks } from "@/lib/cms/types";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp/config";

export const DEFAULT_WHATSAPP_NUMBER = "+212702688416";
export const DEFAULT_INSTAGRAM_URL =
  "https://www.instagram.com/_neonbright_?igsh=NHQxN3MzcjJhdGZ0";
export const DEFAULT_FACEBOOK_URL =
  "https://www.facebook.com/share/1BrrbDuxoB/?mibextid=wwXIfr";
export const DEFAULT_CONTACT_EMAIL = "hello@neonbright.ma";
export const DEFAULT_CONTACT_ADDRESS = "Casablanca, Maroc";

export type SocialContactSettings = {
  contact: ContactInfo;
  social: SocialLinks;
  whatsAppUrl: string;
  instagramUrl: string;
  facebookUrl: string;
};

/** Build a wa.me URL from a phone number (digits only in path). */
export function buildWhatsAppBaseUrl(phone: string): string {
  const digits = normalizeWhatsAppNumber(phone);
  return digits ? `https://wa.me/${digits}` : "";
}

/** Build a wa.me URL with an optional pre-filled message. */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const base = buildWhatsAppBaseUrl(phone);
  if (!base) return "";
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function resolveInstagramUrl(
  social: SocialLinks,
  instagramSettingsUrl?: string
): string {
  return social.instagram?.trim() || instagramSettingsUrl?.trim() || "";
}

export function resolveFacebookUrl(social: SocialLinks): string {
  return social.facebook?.trim() || "";
}

/** Resolved public contact + social settings from CMS data. */
export function resolveSocialContactSettings(
  contact: ContactInfo,
  social: SocialLinks,
  instagramSettingsUrl?: string
): SocialContactSettings {
  const whatsappNumber = contact.whatsapp?.trim() || contact.phone?.trim() || "";
  return {
    contact,
    social,
    whatsAppUrl: buildWhatsAppBaseUrl(whatsappNumber),
    instagramUrl: resolveInstagramUrl(social, instagramSettingsUrl),
    facebookUrl: resolveFacebookUrl(social),
  };
}
