/** Runtime-safe logo helpers — no fs imports (avoids Vercel NFT over-tracing). */

export type PartnerLogo = {
  id: string;
  src: string;
  alt: string;
};

/** Logo sync from MEDIA/ → public/ runs only in local development. */
export function isLogoMediaSyncEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Vercel Lambda excludes public/media from the server bundle — no fs access at runtime. */
export function isPublicMediaFsAvailable(): boolean {
  return !process.env.VERCEL;
}

export function logoFilenameFromSrc(src: string): string {
  return decodeURIComponent(src.split("?")[0].split("/").pop() ?? "");
}

export async function getPartnerLogosFromMedia(): Promise<PartnerLogo[]> {
  if (!isLogoMediaSyncEnabled() || !isPublicMediaFsAvailable()) {
    return [];
  }

  try {
    const { syncLogosFromMedia } = await import("@/lib/cms/logo-media-sync");
    return await syncLogosFromMedia();
  } catch {
    return [];
  }
}
