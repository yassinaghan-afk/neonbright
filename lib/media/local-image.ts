/** True for assets served from /public without going through the image optimizer. */
export function isLocalPublicAsset(src: string): boolean {
  return (
    src.startsWith("/media/") ||
    src.startsWith("/uploads/") ||
    src.startsWith("/brand/")
  );
}

/** Props to pass to next/image for local public files (avoids build-time lstat). */
export function localImageUnoptimized(src: string): { unoptimized?: true } {
  return isLocalPublicAsset(src) ? { unoptimized: true } : {};
}
