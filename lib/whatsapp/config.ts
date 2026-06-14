/** Client-safe WhatsApp business number (digits only, country code included). */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "212600000000";

export function getWhatsAppNumber(): string {
  return process.env.WHATSAPP_NUMBER ?? WHATSAPP_NUMBER;
}

export function getSiteUrl(fallbackOrigin?: string): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    fallbackOrigin ??
    "http://localhost:3000"
  );
}

export function normalizeWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${normalizeWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_WHATSAPP_GREETING =
  "Hi Neon Bright! I'm interested in a custom LED neon sign. Can you help me with a quote?";
