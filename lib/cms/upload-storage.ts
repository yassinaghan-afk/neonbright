import { promises as fs } from "fs";
import path from "path";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cms");
const RUNTIME_UPLOAD_DIR = path.join("/tmp", "neonbright-uploads/cms");

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "svg", "gif", "avif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "avi", "mpeg", "mkv"]);

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
  avi: "video/x-msvideo",
  mpeg: "video/mpeg",
  mkv: "video/x-matroska",
};

/** Vercel Lambda: public/ is read-only — use /tmp and serve via /api/media/cms/[filename]. */
export function usesRuntimeUploadStorage(): boolean {
  return Boolean(process.env.VERCEL);
}

export function getUploadDir(): string {
  return usesRuntimeUploadStorage() ? RUNTIME_UPLOAD_DIR : PUBLIC_UPLOAD_DIR;
}

export function getUploadPublicUrl(filename: string): string {
  const safe = path.basename(filename);
  if (usesRuntimeUploadStorage()) {
    return `/api/media/cms/${encodeURIComponent(safe)}`;
  }
  return `/uploads/cms/${encodeURIComponent(safe)}`;
}

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

export function resolveUploadFilename(urlOrName: string): string | null {
  const raw = decodeURIComponent(urlOrName.split("/").pop() ?? "");
  if (!raw || raw.includes("..") || raw.includes("/") || raw.includes("\\")) {
    return null;
  }
  return raw;
}

export async function ensureUploadDir(): Promise<string> {
  const dir = getUploadDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function writeUploadFile(filename: string, buffer: Buffer): Promise<void> {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");
  const dir = await ensureUploadDir();
  await fs.writeFile(path.join(dir, safe), buffer);
}

export async function readUploadFileForServe(filename: string): Promise<Buffer> {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  const candidates = [
    path.join(getUploadDir(), safe),
    path.join(PUBLIC_UPLOAD_DIR, safe),
  ];

  for (const filePath of candidates) {
    try {
      return await fs.readFile(filePath);
    } catch {
      continue;
    }
  }

  throw new Error(`File not found: ${safe}`);
}

export async function deleteUploadFile(filename: string): Promise<boolean> {
  const safe = resolveUploadFilename(filename);
  if (!safe) return false;

  let deleted = false;
  for (const dir of [getUploadDir(), PUBLIC_UPLOAD_DIR]) {
    try {
      await fs.unlink(path.join(dir, safe));
      deleted = true;
    } catch {
      /* file may only exist in one location */
    }
  }
  return deleted;
}

export async function listUploadFiles(): Promise<string[]> {
  await ensureUploadDir();
  const names = new Set<string>();

  for (const dir of [getUploadDir(), PUBLIC_UPLOAD_DIR]) {
    try {
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (!f.startsWith(".")) names.add(f);
      }
    } catch {
      continue;
    }
  }

  return Array.from(names);
}

export async function statUploadFile(filename: string) {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  for (const dir of [getUploadDir(), PUBLIC_UPLOAD_DIR]) {
    try {
      return await fs.stat(path.join(dir, safe));
    } catch {
      continue;
    }
  }

  throw new Error(`File not found: ${safe}`);
}
