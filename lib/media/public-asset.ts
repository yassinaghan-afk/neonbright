/**
 * Public asset URL helpers — pure functions, no filesystem access.
 * Never call fs.stat/lstat/access on public/ paths (breaks Vercel builds).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

/** Rewrite legacy .webp paths that were seeded but only .jpg files were committed. */
function rewriteLegacyWebpPath(pathname: string): string {
  if (!/\.webp$/i.test(pathname)) return pathname;
  if (pathname.startsWith("/media/hero-slider/")) {
    return pathname.replace(/\.webp$/i, ".jpg");
  }
  return pathname;
}

/** Return a normalized public URL or null when the value is not a valid path. */
export function resolvePublicAsset(
  urlPath: string | undefined | null
): string | null {
  if (!urlPath?.trim()) return null;

  const trimmed = urlPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.split("?")[0];
  }

  if (!trimmed.startsWith("/")) return null;

  const base = trimmed.split("?")[0];
  return rewriteLegacyWebpPath(base);
}

/** Keep only valid public URL paths from a list. */
export function resolvePublicAssets(urls: string[]): string[] {
  return urls
    .map((u) => resolvePublicAsset(u))
    .filter((u): u is string => u !== null);
}

/** Build an absolute URL for metadata, OG tags, or external consumers. */
export function absoluteAssetUrl(urlPath: string | undefined | null): string | null {
  const resolved = resolvePublicAsset(urlPath);
  if (!resolved) return null;
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }
  if (!SITE_URL) return resolved;
  return `${SITE_URL}${resolved}`;
}
