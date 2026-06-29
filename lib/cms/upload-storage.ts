import { promises as fs } from "fs";
import path from "path";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cms");
const RUNTIME_UPLOAD_DIR = path.join("/tmp", "neonbright-uploads/cms");
const BLOB_PREFIX = "cms/";

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

type StoredUpload = {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
};

/** Local dev: write to public/uploads/cms. Vercel: Vercel Blob (durable) with /tmp fallback. */
export function usesRuntimeUploadStorage(): boolean {
  return Boolean(process.env.VERCEL);
}

function getLocalUploadDir(): string {
  return usesRuntimeUploadStorage() ? RUNTIME_UPLOAD_DIR : PUBLIC_UPLOAD_DIR;
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

function blobPathname(filename: string): string {
  return `${BLOB_PREFIX}${filename}`;
}

async function ensureLocalUploadDir(): Promise<string> {
  const dir = getLocalUploadDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeLocalFile(filename: string, buffer: Buffer): Promise<void> {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");
  const dir = await ensureLocalUploadDir();
  await fs.writeFile(path.join(dir, safe), buffer);

  if (!usesRuntimeUploadStorage()) {
    await fs.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
    if (dir !== PUBLIC_UPLOAD_DIR) {
      await fs.writeFile(path.join(PUBLIC_UPLOAD_DIR, safe), buffer);
    }
  }
}

async function writeBlobFile(
  filename: string,
  buffer: Buffer
): Promise<{ url: string; size: number }> {
  const { put } = await import("@vercel/blob");
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  const blob = await put(blobPathname(safe), buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: contentTypeForFilename(safe),
  });

  return { url: blob.url, size: buffer.length };
}

/** Write file and return its public URL. */
export async function writeUploadFile(
  filename: string,
  buffer: Buffer
): Promise<string> {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  if (usesRuntimeUploadStorage()) {
    const blob = await writeBlobFile(safe, buffer);
    return blob.url;
  }

  await writeLocalFile(safe, buffer);
  return getUploadPublicUrl(safe);
}

export function getUploadPublicUrl(filename: string): string {
  const safe = path.basename(filename);
  if (usesRuntimeUploadStorage()) {
    return `/api/media/cms/${encodeURIComponent(safe)}`;
  }
  return `/uploads/cms/${encodeURIComponent(safe)}`;
}

export async function readUploadFileForServe(filename: string): Promise<Buffer> {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  const candidates = [
    path.join(getLocalUploadDir(), safe),
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

  if (usesRuntimeUploadStorage()) {
    try {
      const { del, list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: blobPathname(safe) });
      const match = blobs.find((b) => b.pathname === blobPathname(safe));
      if (match) {
        await del(match.url);
        deleted = true;
      }
    } catch (err) {
      console.error("[upload-storage] blob delete failed:", err);
    }
  }

  for (const dir of [getLocalUploadDir(), PUBLIC_UPLOAD_DIR]) {
    try {
      await fs.unlink(path.join(dir, safe));
      deleted = true;
    } catch {
      /* may only exist in one location */
    }
  }

  return deleted;
}

async function listBlobUploads(): Promise<StoredUpload[]> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  return blobs.map((blob) => {
    const filename = blob.pathname.replace(BLOB_PREFIX, "");
    return {
      filename,
      url: blob.url,
      size: blob.size,
      createdAt: blob.uploadedAt.toISOString(),
    };
  });
}

async function listLocalUploads(): Promise<StoredUpload[]> {
  const names = new Set<string>();
  for (const dir of [getLocalUploadDir(), PUBLIC_UPLOAD_DIR]) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (!f.startsWith(".")) names.add(f);
      }
    } catch {
      continue;
    }
  }

  const results: StoredUpload[] = [];
  for (const filename of names) {
    try {
      const stat = await statUploadFile(filename);
      results.push({
        filename,
        url: getUploadPublicUrl(filename),
        size: Number(stat.size),
        createdAt: stat.birthtime.toISOString(),
      });
    } catch (err) {
      console.error("[upload-storage] skip local file:", filename, err);
    }
  }
  return results;
}

export async function listUploadFiles(): Promise<StoredUpload[]> {
  if (usesRuntimeUploadStorage()) {
    try {
      const blobFiles = await listBlobUploads();
      if (blobFiles.length > 0) return blobFiles;
    } catch (err) {
      console.error("[upload-storage] blob list failed:", err);
    }
  }
  return listLocalUploads();
}

export async function statUploadFile(filename: string) {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  for (const dir of [getLocalUploadDir(), PUBLIC_UPLOAD_DIR]) {
    try {
      return await fs.stat(path.join(dir, safe));
    } catch {
      continue;
    }
  }

  if (usesRuntimeUploadStorage()) {
    const files = await listBlobUploads();
    const match = files.find((f) => f.filename === safe);
    if (match) {
      return {
        size: match.size,
        birthtime: new Date(match.createdAt),
      } as Awaited<ReturnType<typeof fs.stat>>;
    }
  }

  throw new Error(`File not found: ${safe}`);
}
