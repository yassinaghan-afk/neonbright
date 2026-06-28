export function decodeHtmlEntities(value: string): string {
  const named = value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  return named
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)));
}

export function formatInstagramCaption(alt: string): string {
  const decoded = decodeHtmlEntities(alt);
  const withoutSuffix = decoded.replace(/\s+on Instagram:.*$/i, "").trim();
  return withoutSuffix.replace(/^["']|["']$/g, "").trim() || alt;
}

export function formatInstagramDate(timestamp?: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
