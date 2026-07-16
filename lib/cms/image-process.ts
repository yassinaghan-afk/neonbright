/**
 * Server-only Sharp image processor.
 * Never import this module from client components — it bundles native code.
 */
import sharp from "sharp";

export type ImageProcessPreset = "hero" | "logo" | "gallery" | "thumbnail";

type CategoryConfig = {
  /** Max width in px for the main output. 0 = keep original. */
  maxWidth: number;
  /** WebP quality 1–100. */
  quality: number;
  /** Use lossless WebP (logos with transparency). */
  lossless?: boolean;
  /** Thumbnail variant. Absent = no thumbnail generated. */
  thumbnail?: { maxWidth: number; quality: number };
  /** Mobile variant (hero only). Absent = not generated. */
  mobile?: { maxWidth: number; quality: number };
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  hero: {
    maxWidth: 1920,
    quality: 80,
    mobile: { maxWidth: 1080, quality: 80 },
  },
  events: {
    maxWidth: 1600,
    quality: 78,
    thumbnail: { maxWidth: 640, quality: 74 },
  },
  brands: {
    maxWidth: 1600,
    quality: 78,
    thumbnail: { maxWidth: 640, quality: 74 },
  },
  reviews: {
    maxWidth: 1200,
    quality: 88, // keep text legible
    thumbnail: { maxWidth: 560, quality: 80 },
  },
  instagram: {
    maxWidth: 1440,
    quality: 82,
    thumbnail: { maxWidth: 560, quality: 75 },
  },
  testimonials: { maxWidth: 400, quality: 82 },
  logos: { maxWidth: 800, quality: 90, lossless: true },
  partners: { maxWidth: 800, quality: 90, lossless: true },
  cms: { maxWidth: 1920, quality: 82 },
};

export type WebPVariant = { buffer: Buffer; ext: "webp"; mime: "image/webp" };
export type PassthroughVariant = { buffer: Buffer; ext: "svg" | "gif"; mime: string };

export type UploadProcessResult = {
  main: WebPVariant | PassthroughVariant;
  /** Thumbnail (reviews, instagram, events, brands). */
  thumbnail?: WebPVariant;
  /** Mobile-optimised variant (hero). */
  mobile?: WebPVariant;
};

/**
 * Process a raster image with Sharp.
 *
 * - SVG: returned unchanged.
 * - GIF: returned unchanged (animation is not preserved by Sharp).
 * - JPG / PNG / WebP / AVIF: converted to WebP with EXIF rotation applied.
 *   Thumbnail and mobile variants are generated per category config.
 *
 * Throws if the buffer cannot be decoded by Sharp.
 */
export async function optimizeUploadedImage(
  buffer: Buffer,
  mime: string,
  category: string
): Promise<UploadProcessResult> {
  if (mime === "image/svg+xml") {
    return { main: { buffer, ext: "svg", mime } };
  }
  if (mime === "image/gif") {
    return { main: { buffer, ext: "gif", mime } };
  }

  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.cms;

  // Verify the buffer is a real, decodable image before any conversion.
  const meta = await sharp(buffer).metadata();
  const origWidth = meta.width ?? 0;

  function buildPipeline(src: Buffer, maxW: number) {
    let p = sharp(src).rotate(); // EXIF orientation
    if (maxW > 0 && origWidth > maxW) {
      p = p.resize(maxW, undefined, { fit: "inside", withoutEnlargement: true });
    }
    return p;
  }

  const mainBuf = cfg.lossless
    ? await buildPipeline(buffer, cfg.maxWidth).webp({ lossless: true }).toBuffer()
    : await buildPipeline(buffer, cfg.maxWidth).webp({ quality: cfg.quality }).toBuffer();

  const result: UploadProcessResult = {
    main: { buffer: mainBuf, ext: "webp", mime: "image/webp" },
  };

  if (cfg.thumbnail) {
    const thumbBuf = await buildPipeline(buffer, cfg.thumbnail.maxWidth)
      .webp({ quality: cfg.thumbnail.quality })
      .toBuffer();
    result.thumbnail = { buffer: thumbBuf, ext: "webp", mime: "image/webp" };
  }

  if (cfg.mobile) {
    const mobileBuf = await buildPipeline(buffer, cfg.mobile.maxWidth)
      .webp({ quality: cfg.mobile.quality })
      .toBuffer();
    result.mobile = { buffer: mobileBuf, ext: "webp", mime: "image/webp" };
  }

  return result;
}
