import { promises as fs } from "fs";
import path from "path";
import {
  getUploadsCategoryDir,
  getUploadsRoot,
  isUploadCategory,
  type UploadCategory,
} from "@/lib/cms/storage-paths";

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "svg", "gif", "avif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov"]);

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/** Extensions that are never allowed as uploads (executables / scripts). */
const BLOCKED_EXTS = new Set([
  "exe",
  "sh",
  "bash",
  "bat",
  "cmd",
  "com",
  "msi",
  "dll",
  "so",
  "dylib",
  "jar",
  "php",
  "py",
  "rb",
  "pl",
  "cgi",
  "asp",
  "aspx",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "html",
  "htm",
  "svgz",
  "wasm",
]);

type StoredUpload = {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
};

export function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function mediaTypeOf(filename: string): "image" | "video" | "other" {
  const ext = extOf(filename);
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  return "other";
}

export function contentTypeForFilename(filename: string): string {
  return MIME_BY_EXT[extOf(filename)] ?? "application/octet-stream";
}

export function isAllowedUploadExtension(filename: string): boolean {
  const ext = extOf(filename);
  if (!ext || BLOCKED_EXTS.has(ext)) return false;
  return IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext);
}

/**
 * Sanitize a filename or URL path segment.
 * Rejects path traversal and directory separators.
 */
export function resolveUploadFilename(urlOrName: string): string | null {
  if (!urlOrName || typeof urlOrName !== "string") return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(urlOrName.split("?")[0] ?? "");
  } catch {
    return null;
  }

  if (
    !decoded ||
    decoded.includes("\0") ||
    decoded.includes("..") ||
    /[:*?"<>|]/.test(decoded)
  ) {
    return null;
  }

  // Use only the final segment (supports /uploads/cat/file.jpg inputs).
  const segments = decoded.split(/[/\\]/).filter(Boolean);
  const raw = segments[segments.length - 1] ?? "";
  if (!raw || raw === "." || raw === "..") {
    return null;
  }

  // Only allow safe characters in stored filenames.
  if (!/^[A-Za-z0-9._-]+$/.test(raw)) {
    return null;
  }

  return raw;
}

function isBlobUrl(url: string): boolean {
  return (
    url.includes(".blob.vercel-storage.com/") ||
    url.includes(".public.blob.vercel-storage.com/")
  );
}

/**
 * Resolve a file path under uploads and ensure it stays inside STORAGE_ROOT/uploads.
 */
export function resolveSafeUploadPath(
  filename: string,
  category?: string
): string | null {
  const safe = resolveUploadFilename(filename);
  if (!safe) return null;

  if (category !== undefined && category !== "") {
    if (!isUploadCategory(category)) return null;
  }

  const root = path.resolve(getUploadsRoot());
  const candidate = path.resolve(
    category ? path.join(getUploadsCategoryDir(category), safe) : path.join(root, safe)
  );

  if (candidate !== root && !candidate.startsWith(root + path.sep)) {
    return null;
  }

  return candidate;
}

async function ensureUploadDir(category?: string): Promise<string> {
  if (category && !isUploadCategory(category)) {
    throw new Error(`Invalid upload category: ${category}`);
  }
  const dir = getUploadsCategoryDir(category);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Write file under STORAGE_ROOT/uploads/[category]/ and return public URL
 * `/uploads/[category]/filename`.
 */
export async function writeUploadFile(
  filename: string,
  buffer: Buffer,
  category: UploadCategory = "cms"
): Promise<string> {
  if (!isUploadCategory(category)) {
    throw new Error(`Invalid upload category: ${category}`);
  }
  if (!isAllowedUploadExtension(filename)) {
    throw new Error("File type not allowed");
  }

  const filePath = resolveSafeUploadPath(filename, category);
  if (!filePath) throw new Error("Invalid filename");

  await ensureUploadDir(category);
  await fs.writeFile(filePath, buffer);

  return getUploadPublicUrl(path.basename(filePath), category);
}

/**
 * Public URL format: /uploads/[category]/filename
 * Served via Next.js rewrite → /api/uploads/:path*
 */
export function getUploadPublicUrl(
  filename: string,
  category: UploadCategory = "cms"
): string {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");
  return `/uploads/${category}/${encodeURIComponent(safe)}`;
}

export async function readUploadFileForServe(
  filename: string,
  category?: string
): Promise<Buffer> {
  const filePath = resolveSafeUploadPath(filename, category);
  if (!filePath) throw new Error("Invalid filename");

  try {
    return await fs.readFile(filePath);
  } catch {
    throw new Error(`File not found: ${filename}`);
  }
}

/**
 * Delete an uploaded file. Legacy Blob URLs are ignored (no-op success).
 * Never deletes paths outside STORAGE_ROOT/uploads.
 */
export async function deleteUploadFile(
  filenameOrUrl: string,
  category?: string
): Promise<boolean> {
  if (isBlobUrl(filenameOrUrl)) {
    console.log(
      "[upload-storage] skipping delete of legacy Blob URL:",
      filenameOrUrl
    );
    return true;
  }

  // Prefer explicit /uploads/category/file URL parsing
  const fromUrl = parseUploadsPublicUrl(filenameOrUrl);
  if (fromUrl) {
    const filePath = resolveSafeUploadPath(fromUrl.filename, fromUrl.category);
    if (!filePath) return false;
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  const safe = resolveUploadFilename(filenameOrUrl);
  if (!safe) return false;

  const categories: Array<string | undefined> = category
    ? [category]
    : [undefined, ...(["hero", "events", "brands", "reviews", "testimonials", "logos", "cms"] as const)];

  for (const cat of categories) {
    const filePath = resolveSafeUploadPath(safe, cat);
    if (!filePath) continue;
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      // try next
    }
  }

  return false;
}

function parseUploadsPublicUrl(
  url: string
): { category: UploadCategory; filename: string } | null {
  if (!url.startsWith("/uploads/")) return null;
  const parts = url.slice("/uploads/".length).split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [category, filenameRaw] = parts;
  if (!isUploadCategory(category)) return null;
  const filename = resolveUploadFilename(filenameRaw);
  if (!filename) return null;
  return { category, filename };
}

async function listLocalUploads(category?: string): Promise<StoredUpload[]> {
  const results: StoredUpload[] = [];
  const categories: UploadCategory[] = category
    ? isUploadCategory(category)
      ? [category]
      : []
    : ["hero", "events", "brands", "reviews", "testimonials", "logos", "cms"];

  for (const cat of categories) {
    const dir = getUploadsCategoryDir(cat);
    try {
      await fs.mkdir(dir, { recursive: true });
      const files = await fs.readdir(dir);
      for (const filename of files) {
        if (filename.startsWith(".")) continue;
        const filePath = resolveSafeUploadPath(filename, cat);
        if (!filePath) continue;
        try {
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            results.push({
              filename,
              url: getUploadPublicUrl(filename, cat),
              size: Number(stat.size),
              createdAt: stat.birthtime.toISOString(),
            });
          }
        } catch (err) {
          console.error("[upload-storage] skip file:", filename, err);
        }
      }
    } catch {
      // missing category dir
    }
  }

  return results;
}

export async function listUploadFiles(category?: string): Promise<StoredUpload[]> {
  return listLocalUploads(category);
}

export async function statUploadFile(filename: string, category?: string) {
  const filePath = resolveSafeUploadPath(filename, category);
  if (!filePath) throw new Error("Invalid filename");
  try {
    return await fs.stat(filePath);
  } catch {
    throw new Error(`File not found: ${filename}`);
  }
}

/** Ensure STORAGE_ROOT/uploads and category folders exist. */
export async function ensureUploadDirectories(): Promise<void> {
  const root = getUploadsRoot();
  await fs.mkdir(root, { recursive: true });
  for (const cat of [
    "hero",
    "events",
    "brands",
    "reviews",
    "testimonials",
    "logos",
    "cms",
  ] as const) {
    await fs.mkdir(getUploadsCategoryDir(cat), { recursive: true });
  }
}
