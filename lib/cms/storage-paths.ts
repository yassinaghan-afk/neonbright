import path from "path";

/**
 * Canonical persistent storage root for EasyPanel / Docker.
 *
 * Production (Dockerfile ENV): STORAGE_ROOT=/app/storage
 * Local default: <cwd>/storage
 *
 * Layout:
 *   ${STORAGE_ROOT}/cms-content.json
 *   ${STORAGE_ROOT}/uploads/{hero,events,brands,reviews,testimonials,logos,cms}/
 */

const DEFAULT_LOCAL_STORAGE = path.join(process.cwd(), "storage");

export const UPLOAD_CATEGORIES = [
  "hero",
  "events",
  "brands",
  "reviews",
  "testimonials",
  "logos",
  "cms",
] as const;

export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];

export function getStorageRoot(): string {
  const fromEnv = process.env.STORAGE_ROOT?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(DEFAULT_LOCAL_STORAGE);
}

export function getCmsContentPath(): string {
  return path.join(getStorageRoot(), "cms-content.json");
}

export function getUploadsRoot(): string {
  return path.join(getStorageRoot(), "uploads");
}

export function getUploadsCategoryDir(category?: string): string {
  if (!category) return getUploadsRoot();
  return path.join(getUploadsRoot(), category);
}

/** Seed file shipped with the image — never write here at runtime. */
export function getBundledCmsSeedPath(): string {
  return path.join(process.cwd(), "data", "cms-content.json");
}

export function isUploadCategory(value: string): value is UploadCategory {
  return (UPLOAD_CATEGORIES as readonly string[]).includes(value);
}
