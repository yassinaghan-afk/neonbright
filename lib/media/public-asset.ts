/**
 * Public asset URL helpers — pure functions, no filesystem access.
 * Never call fs.stat/lstat/access on public/ paths (breaks Vercel builds).
 */

/** Return a normalized public URL or null when the value is not a valid path. */
export function resolvePublicAsset(
  urlPath: string | undefined | null
): string | null {
  if (!urlPath?.startsWith("/")) return null;
  return urlPath.split("?")[0];
}

/** Keep only valid public URL paths from a list. */
export function resolvePublicAssets(urls: string[]): string[] {
  return urls
    .map((u) => resolvePublicAsset(u))
    .filter((u): u is string => u !== null);
}
