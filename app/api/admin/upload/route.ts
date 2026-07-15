import { NextRequest } from "next/server";
import { createId } from "@/lib/cms/id";
import {
  jsonFailure,
  jsonFailureFromUnknown,
  jsonSuccess,
  requireOwner,
} from "@/lib/cms/api";
import { optimizeUploadedImage } from "@/lib/cms/image-process";
import { filenameToLabel } from "@/lib/cms/filename-utils";
import {
  writeUploadFile,
  extOf,
  isAllowedUploadExtension,
  mediaTypeOf,
} from "@/lib/cms/upload-storage";
import {
  isUploadCategory,
  type UploadCategory,
} from "@/lib/cms/storage-paths";

export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

/** MIME types that carry their own validated magic bytes from the server.  */
const IMAGE_MAGIC: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: "image/png" },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" }, // RIFF….WEBP
  { bytes: [0x47, 0x49, 0x46], mime: "image/gif" },
];

function detectMimeFromBuffer(buf: Buffer): string | null {
  for (const sig of IMAGE_MAGIC) {
    if (sig.bytes.every((b, i) => buf[i] === b)) return sig.mime;
  }
  // SVG heuristic: starts with <? or <svg
  const head = buf.slice(0, 64).toString("utf8");
  if (head.includes("<svg") || head.startsWith("<?xml")) return "image/svg+xml";
  return null;
}

function resolveCategory(
  request: NextRequest,
  formData: FormData
): UploadCategory {
  const fromQuery = request.nextUrl.searchParams.get("category");
  const fromForm = formData.get("category");
  const fromPreset = formData.get("preset");

  const candidate =
    (typeof fromQuery === "string" && fromQuery) ||
    (typeof fromForm === "string" && fromForm) ||
    (typeof fromPreset === "string" && mapPresetToCategory(fromPreset)) ||
    "cms";

  return isUploadCategory(candidate) ? candidate : "cms";
}

function mapPresetToCategory(preset: string): UploadCategory {
  switch (preset) {
    case "hero":
      return "hero";
    case "instagram":
      return "instagram";
    case "gallery":
    case "thumbnail":
    case "video":
      return "cms";
    default:
      return "cms";
  }
}

async function processOneFile(
  file: File,
  category: UploadCategory
): Promise<{
  url: string;
  thumbnailUrl?: string;
  filename: string;
  label: string;
  type: "image" | "video" | "audio";
  size: number;
  contentType: string;
}> {
  if (!isAllowedUploadExtension(file.name)) {
    throw new Error(
      "Type de fichier non autorisé. Utilisez PNG, JPG, WEBP, GIF, SVG, AVIF, MP4, WebM ou MOV."
    );
  }

  const ext = extOf(file.name);
  const declaredType = file.type || "";
  const isVideo = VIDEO_EXTS_BY_NAME(ext);
  const isImage = IMAGE_EXTS_BY_NAME(ext);

  if (!isVideo && !isImage) {
    throw new Error("Seules les images et vidéos sont autorisées");
  }

  if (declaredType && declaredType !== "application/octet-stream") {
    const allowed = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowed.has(declaredType)) {
      throw new Error("MIME type non autorisé");
    }
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error("Vidéos max 200 Mo");
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error("Images max 10 Mo");
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // For images, validate magic bytes against declared MIME.
  if (isImage && ext !== "svg") {
    const detectedMime = detectMimeFromBuffer(rawBuffer);
    if (detectedMime && declaredType && declaredType !== "application/octet-stream") {
      // WEBP magic: RIFF header, verify WEBP marker at offset 8
      const effectiveDetected =
        detectedMime === "image/webp"
          ? rawBuffer.slice(8, 12).toString("ascii") === "WEBP"
            ? "image/webp"
            : null
          : detectedMime;
      if (effectiveDetected && effectiveDetected !== declaredType) {
        throw new Error("Le contenu du fichier ne correspond pas au type déclaré");
      }
    }
  }

  // Videos: store as-is.
  if (isVideo) {
    const prefix = "vid";
    const filename = `${createId(prefix)}.${ext}`;
    const url = await writeUploadFile(filename, rawBuffer, category);
    const kind = mediaTypeOf(filename);
    return {
      url,
      filename,
      label: filenameToLabel(file.name),
      type: kind === "other" ? "image" : kind,
      size: file.size,
      contentType: file.type || "video/mp4",
    };
  }

  // SVG: store as-is.
  if (ext === "svg" || declaredType === "image/svg+xml") {
    const filename = `${createId("img")}.svg`;
    const url = await writeUploadFile(filename, rawBuffer, category);
    return {
      url,
      filename,
      label: filenameToLabel(file.name),
      type: "image",
      size: rawBuffer.byteLength,
      contentType: "image/svg+xml",
    };
  }

  // Raster images: convert to WebP via Sharp.
  const effectiveMime = declaredType || "image/jpeg";
  const processed = await optimizeUploadedImage(rawBuffer, effectiveMime, category);

  const mainFilename = `${createId("img")}.${processed.main.ext}`;
  const mainUrl = await writeUploadFile(mainFilename, processed.main.buffer, category);

  let thumbnailUrl: string | undefined;
  if (processed.thumbnail) {
    const thumbFilename = `thumb_${mainFilename}`;
    thumbnailUrl = await writeUploadFile(thumbFilename, processed.thumbnail.buffer, category);
  }

  return {
    url: mainUrl,
    thumbnailUrl,
    filename: mainFilename,
    label: filenameToLabel(file.name),
    type: "image",
    size: processed.main.buffer.byteLength,
    contentType: processed.main.mime,
  };
}

function VIDEO_EXTS_BY_NAME(ext: string): boolean {
  return ext === "mp4" || ext === "webm" || ext === "mov";
}

function IMAGE_EXTS_BY_NAME(ext: string): boolean {
  return ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"].includes(ext);
}

/**
 * Direct multipart upload → STORAGE_ROOT/uploads/[category]/
 * POST /api/admin/upload
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireOwner();
    if (error) {
      return jsonFailure("Unauthorized", 401);
    }

    const formData = await request.formData();
    const category = resolveCategory(request, formData);

    const single = formData.get("file");
    const many = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (many.length > 0) {
      const files = [];
      for (const file of many) {
        files.push(await processOneFile(file, category));
      }
      return jsonSuccess({ files });
    }

    if (!(single instanceof File)) {
      return jsonFailure("No file provided", 400);
    }

    const result = await processOneFile(single, category);
    return jsonSuccess(result);
  } catch (err) {
    if (err instanceof Error) {
      return jsonFailure(err.message, 400);
    }
    return jsonFailureFromUnknown(err, 500);
  }
}
