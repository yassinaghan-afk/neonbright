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

/** Props to pass to next/image for local public files (avoids build-time lstat). */
export function localImageUnoptimized(src: string): { unoptimized?: true } {
  return isLocalPublicAsset(src) || isRemoteCmsAsset(src)
    ? { unoptimized: true }
    : {};
}
