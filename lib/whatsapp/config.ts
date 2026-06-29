/** Client-safe WhatsApp utilities — numbers come from CMS, not env defaults. */
export function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return "http://localhost:3000";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getSiteUrl(fallbackOrigin?: string): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined) ??
    fallbackOrigin ??
    "http://localhost:3000";
  return normalizeSiteUrl(raw);
}

export function normalizeWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizeWhatsAppNumber(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_WHATSAPP_GREETING =
  "Hi Neon Bright! I'm interested in a custom LED neon sign. Can you help me with a quote?";
