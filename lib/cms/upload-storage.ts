import { promises as fs } from "fs";
import path from "path";
import {
  BlobNotConfiguredError,
  getBlobCommandOptions,
  shouldUseBlobStorage,
} from "@/lib/cms/blob-client";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cms");
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

/** Local dev: public/uploads/cms. Vercel: Blob when store is linked. */
export function usesRuntimeUploadStorage(): boolean {
  return shouldUseBlobStorage();
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

function isBlobUrl(url: string): boolean {
  return url.includes(".blob.vercel-storage.com/");
}

async function ensureLocalUploadDir(): Promise<string> {
  await fs.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  return PUBLIC_UPLOAD_DIR;
}

async function writeLocalFile(filename: string, buffer: Buffer): Promise<void> {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");
  const dir = await ensureLocalUploadDir();
  await fs.writeFile(path.join(dir, safe), buffer);
}

async function writeBlobFile(
  filename: string,
  buffer: Buffer
): Promise<{ url: string; size: number }> {
  const { put } = await import("@vercel/blob");
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  const auth = await getBlobCommandOptions();
  const blob = await put(blobPathname(safe), buffer, {
    ...auth,
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

  if (shouldUseBlobStorage()) {
    const blob = await writeBlobFile(safe, buffer);
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new BlobNotConfiguredError();
  }

  await writeLocalFile(safe, buffer);
  return getUploadPublicUrl(safe);
}

export function getUploadPublicUrl(filename: string): string {
  const safe = path.basename(filename);
  return `/uploads/cms/${encodeURIComponent(safe)}`;
}

export async function readUploadFileForServe(filename: string): Promise<Buffer> {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  try {
    return await fs.readFile(path.join(PUBLIC_UPLOAD_DIR, safe));
  } catch {
    throw new Error(`File not found: ${safe}`);
  }
}

export async function deleteUploadFile(
  filenameOrUrl: string
): Promise<boolean> {
  let deleted = false;

  if (isBlobUrl(filenameOrUrl)) {
    if (!shouldUseBlobStorage()) return false;
    try {
      const { del } = await import("@vercel/blob");
      const auth = await getBlobCommandOptions();
      await del(filenameOrUrl, auth);
      return true;
    } catch (err) {
      console.error("[upload-storage] blob delete by URL failed:", err);
      return false;
    }
  }

  const safe = resolveUploadFilename(filenameOrUrl);
  if (!safe) return false;

  if (shouldUseBlobStorage()) {
    try {
      const { del } = await import("@vercel/blob");
      const auth = await getBlobCommandOptions();
      await del(blobPathname(safe), auth);
      deleted = true;
    } catch (err) {
      console.error("[upload-storage] blob delete failed:", err);
    }
  }

  try {
    await fs.unlink(path.join(PUBLIC_UPLOAD_DIR, safe));
    deleted = true;
  } catch {
    /* file may only exist in blob */
  }

  return deleted;
}

async function listBlobUploads(): Promise<StoredUpload[]> {
  const { list } = await import("@vercel/blob");
  const auth = await getBlobCommandOptions();
  const { blobs } = await list({ ...auth, prefix: BLOB_PREFIX });
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
  try {
    await fs.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
    const files = await fs.readdir(PUBLIC_UPLOAD_DIR);
    for (const f of files) {
      if (!f.startsWith(".")) names.add(f);
    }
  } catch {
    return [];
  }

  const results: StoredUpload[] = [];
  for (const filename of names) {
    try {
      const stat = await fs.stat(path.join(PUBLIC_UPLOAD_DIR, filename));
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
  if (shouldUseBlobStorage()) {
    return listBlobUploads();
  }
  return listLocalUploads();
}

export async function statUploadFile(filename: string) {
  const safe = resolveUploadFilename(filename);
  if (!safe) throw new Error("Invalid filename");

  if (shouldUseBlobStorage()) {
    const files = await listBlobUploads();
    const match = files.find((f) => f.filename === safe);
    if (match) {
      return {
        size: match.size,
        birthtime: new Date(match.createdAt),
      } as Awaited<ReturnType<typeof fs.stat>>;
    }
  }

  try {
    return await fs.stat(path.join(PUBLIC_UPLOAD_DIR, safe));
  } catch {
    throw new Error(`File not found: ${safe}`);
  }
}
