/** True for assets served from /public without going through the image optimizer. */
export function isLocalPublicAsset(src: string): boolean {
  return (
    src.startsWith("/media/") ||
    src.startsWith("/uploads/") ||
    src.startsWith("/brand/") ||
    src.startsWith("/api/media/")
  );
}

/** Vercel Blob and other remote CMS uploads. */
export function isRemoteCmsAsset(src: string): boolean {
  return (
    src.includes(".blob.vercel-storage.com/") ||
    src.includes(".public.blob.vercel-storage.com/")
  );
}

/**
 * Props to pass to next/image.
 *
 * - Local public files (/media, /uploads, …): unoptimized — the optimizer
 *   cannot fs-stat them on Vercel (excluded from the Lambda bundle).
 * - SVGs: unoptimized — the Next optimizer rejects SVG by default.
 * - Remote Vercel Blob uploads: OPTIMIZED — next.config.ts remotePatterns
 *   allows blob domains, so Next serves resized WebP/AVIF variants instead
 *   of shipping full-size originals to mobile.
 */
export function localImageUnoptimized(src: string): { unoptimized?: true } {
  const isSvg = /\.svg(\?|$)/i.test(src);
  return isLocalPublicAsset(src) || isSvg ? { unoptimized: true } : {};
}
