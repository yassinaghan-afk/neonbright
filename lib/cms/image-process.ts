import sharp from "sharp";

export type ImageProcessPreset = "hero" | "logo" | "gallery" | "thumbnail";

type CategoryConfig = {
  /** Max long-edge width in px. 0 = keep original size. */
  maxWidth: number;
  /** WebP quality 1-100. */
  quality: number;
  /** Use lossless WebP (good for logos with transparency). */
  lossless?: boolean;
  /** Thumbnail config. If absent, no thumbnail is generated. */
  thumbnail?: { maxWidth: number; quality: number };
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  hero: { maxWidth: 1920, quality: 82 },
  events: { maxWidth: 1600, quality: 80, thumbnail: { maxWidth: 640, quality: 75 } },
  brands: { maxWidth: 1600, quality: 80, thumbnail: { maxWidth: 640, quality: 75 } },
  reviews: {
    maxWidth: 1200,
    quality: 88, // high quality to keep text readable
    thumbnail: { maxWidth: 400, quality: 80 },
  },
  instagram: { maxWidth: 1200, quality: 82, thumbnail: { maxWidth: 400, quality: 75 } },
  testimonials: { maxWidth: 400, quality: 82 },
  logos: { maxWidth: 800, quality: 90, lossless: true },
  cms: { maxWidth: 1920, quality: 82 },
};

export type UploadProcessResult = {
  main: { buffer: Buffer; ext: "webp" | "svg" | "gif"; mime: string };
  thumbnail?: { buffer: Buffer; ext: "webp"; mime: "image/webp" };
};

/**
 * Convert a raster image buffer to optimised WebP.
 * SVG and GIF pass through unchanged.
 * EXIF orientation is applied before resizing.
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
    // GIF animation preservation would require sharp with libvips gif support;
    // pass through as-is to avoid breaking animated GIFs.
    return { main: { buffer, ext: "gif", mime } };
  }

  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.cms;

  // Metadata needed to decide whether to resize.
  const meta = await sharp(buffer).metadata();
  const origWidth = meta.width ?? 0;

  function buildPipeline(srcBuffer: Buffer, maxW: number) {
    let p = sharp(srcBuffer).rotate(); // apply EXIF orientation
    if (maxW > 0 && origWidth > maxW) {
      p = p.resize(maxW, undefined, { fit: "inside", withoutEnlargement: true });
    }
    return p;
  }

  const mainWebP = cfg.lossless
    ? await buildPipeline(buffer, cfg.maxWidth).webp({ lossless: true }).toBuffer()
    : await buildPipeline(buffer, cfg.maxWidth).webp({ quality: cfg.quality }).toBuffer();

  const result: UploadProcessResult = {
    main: { buffer: mainWebP, ext: "webp", mime: "image/webp" },
  };

  if (cfg.thumbnail) {
    const thumbWebP = await buildPipeline(buffer, cfg.thumbnail.maxWidth)
      .webp({ quality: cfg.thumbnail.quality })
      .toBuffer();
    result.thumbnail = { buffer: thumbWebP, ext: "webp", mime: "image/webp" };
  }

  return result;
}

