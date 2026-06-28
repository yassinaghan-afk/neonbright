export type ImageProcessPreset = "hero" | "logo" | "gallery" | "thumbnail";

const MIME_TO_EXT: Record<string, { ext: string; mime: string }> = {
  "image/jpeg": { ext: "jpg", mime: "image/jpeg" },
  "image/png": { ext: "png", mime: "image/png" },
  "image/webp": { ext: "webp", mime: "image/webp" },
  "image/gif": { ext: "gif", mime: "image/gif" },
};

/** Stores uploads as-is; Next.js Image optimizes at serve time on Vercel. */
export async function optimizeUploadedImage(
  buffer: Buffer,
  mime: string,
  _preset: ImageProcessPreset
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  if (mime === "image/svg+xml") {
    return { buffer, ext: "svg", mime };
  }

  const mapped = MIME_TO_EXT[mime];
  if (mapped) {
    return { buffer, ext: mapped.ext, mime: mapped.mime };
  }

  return { buffer, ext: "webp", mime: "image/webp" };
}

export function filenameToLabel(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
