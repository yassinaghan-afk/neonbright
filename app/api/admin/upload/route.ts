import { NextRequest } from "next/server";
import { createId } from "@/lib/cms/id";
import {
  jsonFailure,
  jsonFailureFromUnknown,
  jsonSuccess,
  requireOwner,
} from "@/lib/cms/api";
import { filenameToLabel } from "@/lib/cms/filename-utils";
import { optimizeUploadedImage } from "@/lib/cms/image-process";
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

/** Magic-byte signatures for raster formats. */
const IMAGE_MAGIC: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: "image/png" },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" }, // RIFF header
  { bytes: [0x47, 0x49, 0x46], mime: "image/gif" },
];

function detectMimeFromBuffer(buf: Buffer): string | null {
  for (const sig of IMAGE_MAGIC) {
    if (sig.bytes.every((b, i) => buf[i] === b)) return sig.mime;
  }
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
    case "hero":       return "hero";
    case "instagram":  return "instagram";
    case "reviews":    return "reviews";
    case "events":     return "events";
    case "brands":     return "brands";
    case "logos":      return "logos";
    case "testimonials": return "testimonials";
    default:           return "cms";
  }
}

type ProcessedFileResult = {
  url: string;
  filename: string;
  label: string;
  type: "image" | "video" | "audio";
  size: number;
  contentType: string;
  // Optional optimised variants — absent when not applicable.
  thumbnailUrl?: string;
  mobileImageUrl?: string;
  desktopImageUrl?: string;
};

async function processOneFile(
  file: File,
  category: UploadCategory
): Promise<ProcessedFileResult> {
  if (!isAllowedUploadExtension(file.name)) {
    throw new Error(
      "Type de fichier non autorisé. Utilisez PNG, JPG, WEBP, GIF, SVG, AVIF, MP4, WebM ou MOV."
    );
  }

  const ext = extOf(file.name);
  const declaredType = file.type || "";
  const isVideo = VIDEO_EXTS(ext);
  const isImage = IMAGE_EXTS(ext);

  if (!isVideo && !isImage) {
    throw new Error("Seules les images et vidéos sont autorisées");
  }

  if (declaredType && declaredType !== "application/octet-stream") {
    const allowed = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowed.has(declaredType)) {
      throw new Error("MIME type non autorisé");
    }
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) throw new Error("Vidéos max 200 Mo");
  if (isImage && file.size > MAX_IMAGE_SIZE) throw new Error("Images max 10 Mo");

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Validate magic bytes for raster images (not SVG, not video).
  if (isImage && ext !== "svg") {
    const detected = detectMimeFromBuffer(rawBuffer);
    if (detected) {
      const effectiveDeclared =
        declaredType && declaredType !== "application/octet-stream"
          ? declaredType
          : null;
      if (effectiveDeclared && detected !== effectiveDeclared) {
        // WebP has a secondary WEBP marker at bytes 8–12; verify it.
        const isWebP =
          detected === "image/webp" &&
          rawBuffer.slice(8, 12).toString("ascii") === "WEBP";
        if (!isWebP && detected !== effectiveDeclared) {
          throw new Error(
            "Le contenu du fichier ne correspond pas au type déclaré"
          );
        }
      }
    }
  }

  // Videos pass through unchanged.
  if (isVideo) {
    const filename = `${createId("vid")}.${ext}`;
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

  // SVG passes through unchanged.
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

  // Raster images → Sharp WebP pipeline.
  const effectiveMime = declaredType || "image/jpeg";
  const processed = await optimizeUploadedImage(rawBuffer, effectiveMime, category);

  const mainFilename = `${createId("img")}.${processed.main.ext}`;
  const mainUrl = await writeUploadFile(mainFilename, processed.main.buffer, category);

  const result: ProcessedFileResult = {
    url: mainUrl,
    filename: mainFilename,
    label: filenameToLabel(file.name),
    type: "image",
    size: processed.main.buffer.byteLength,
    contentType: processed.main.mime,
  };

  // Thumbnail (reviews, instagram, events, brands).
  if (processed.thumbnail) {
    const thumbFilename = `thumb_${mainFilename}`;
    result.thumbnailUrl = await writeUploadFile(
      thumbFilename,
      processed.thumbnail.buffer,
      category
    );
  }

  // Mobile variant (hero only).
  if (processed.mobile) {
    const mobileFilename = `mobile_${mainFilename}`;
    result.mobileImageUrl = await writeUploadFile(
      mobileFilename,
      processed.mobile.buffer,
      category
    );
    // The main image is the desktop variant for hero.
    result.desktopImageUrl = mainUrl;
  }

  return result;
}

function VIDEO_EXTS(ext: string): boolean {
  return ext === "mp4" || ext === "webm" || ext === "mov";
}

function IMAGE_EXTS(ext: string): boolean {
  return ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"].includes(ext);
}

/**
 * Multipart upload → STORAGE_ROOT/uploads/[category]/
 * POST /api/admin/upload
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireOwner();
    if (error) return jsonFailure("Unauthorized", 401);

    const formData = await request.formData();
    const category = resolveCategory(request, formData);

    const single = formData.get("file");
    const many = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File);

    if (many.length > 0) {
      const files: ProcessedFileResult[] = [];
      for (const file of many) {
        files.push(await processOneFile(file, category));
      }
      return jsonSuccess({ files });
    }

    if (!(single instanceof File)) {
      return jsonFailure("No file provided", 400);
    }

    return jsonSuccess(await processOneFile(single, category));
  } catch (err) {
    if (err instanceof Error) return jsonFailure(err.message, 400);
    return jsonFailureFromUnknown(err, 500);
  }
}
