import { access } from "fs/promises";
import path from "path";

const ALT_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png"];

/** Map a public URL path (e.g. /media/hero-slider/foo.webp) to a filesystem path. */
export function publicUrlToFilesystem(urlPath: string): string {
  const rel = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
  return path.join(process.cwd(), "public", rel);
}

/** Returns true when the asset exists on disk under public/. */
export async function publicAssetExists(urlPath: string): Promise<boolean> {
  if (!urlPath?.startsWith("/")) return false;
  try {
    await access(publicUrlToFilesystem(urlPath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a public URL to an existing file, trying alternate extensions
 * (webp ↔ jpg) when the exact path is missing.
 */
export async function resolvePublicAsset(urlPath: string): Promise<string | null> {
  if (!urlPath?.startsWith("/")) return null;
  if (await publicAssetExists(urlPath)) return urlPath;

  const ext = path.extname(urlPath).toLowerCase();
  const base = urlPath.slice(0, -ext.length);

  for (const alt of ALT_EXTENSIONS) {
    if (alt === ext) continue;
    const candidate = `${base}${alt}`;
    if (await publicAssetExists(candidate)) return candidate;
  }

  return null;
}

/** Filter a list of public URLs, resolving each to an existing file. */
export async function resolvePublicAssets(urls: string[]): Promise<string[]> {
  const resolved: string[] = [];
  for (const url of urls) {
    const found = await resolvePublicAsset(url);
    if (found) resolved.push(found);
  }
  return resolved;
}
