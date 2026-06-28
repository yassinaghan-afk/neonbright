import sharp from "sharp";

export type ImageProcessPreset = "hero" | "logo" | "gallery" | "thumbnail";

const PRESETS: Record<
  ImageProcessPreset,
  { maxWidth: number; quality: number; preserveAlpha: boolean }
> = {
  hero: { maxWidth: 2400, quality: 85, preserveAlpha: false },
  logo: { maxWidth: 512, quality: 90, preserveAlpha: true },
  gallery: { maxWidth: 1920, quality: 82, preserveAlpha: false },
  thumbnail: { maxWidth: 800, quality: 80, preserveAlpha: false },
};

export async function optimizeUploadedImage(
  buffer: Buffer,
  mime: string,
  preset: ImageProcessPreset
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  const cfg = PRESETS[preset];

  if (mime === "image/svg+xml") {
    return { buffer, ext: "svg", mime };
  }

  let pipeline = sharp(buffer).rotate();

  const meta = await pipeline.metadata();
  if (meta.width && meta.width > cfg.maxWidth) {
    pipeline = pipeline.resize({ width: cfg.maxWidth, withoutEnlargement: true });
  }

  const hasAlpha = cfg.preserveAlpha && (meta.hasAlpha || mime === "image/png");

  if (hasAlpha) {
    const out = await pipeline.webp({ quality: cfg.quality, alphaQuality: 90 }).toBuffer();
    return { buffer: out, ext: "webp", mime: "image/webp" };
  }

  const out = await pipeline.webp({ quality: cfg.quality }).toBuffer();
  return { buffer: out, ext: "webp", mime: "image/webp" };
}

export function filenameToLabel(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
