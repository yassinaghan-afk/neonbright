import path from "path";
import type { CMSHeroSlide } from "@/lib/cms/types";

export type HeroMediaSyncResult = {
  slides: CMSHeroSlide[];
  removed: number;
  mediaVersion: string;
  sourceFiles: string[];
};

export function isUnsplashHeroUrl(src: string): boolean {
  return src.includes("images.unsplash.com");
}

export function isBrandHeroUrl(src: string): boolean {
  return src.startsWith("/media/hero-slider/");
}

export function heroSlideSrc(slide: CMSHeroSlide): string {
  return slide.src.split("?")[0];
}

/** Hero media sync from MEDIA/ → public/ runs only in local development. */
export function isHeroMediaSyncEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function shouldSeedBrandHeroSlides(
  slides: Partial<CMSHeroSlide>[] | undefined
): boolean {
  if (!slides?.length) return true;
  if (slides.every((s) => !s.src || isUnsplashHeroUrl(s.src))) return true;
  if (slides.some((s) => s.src && !isBrandHeroUrl(s.src))) return true;
  return false;
}

export function brandHeroSlidesStale(
  slides: Partial<CMSHeroSlide>[] | undefined,
  freshSlides: CMSHeroSlide[]
): boolean {
  if (!slides?.length || !freshSlides.length) return true;
  const current = slides
    .filter((s) => s.src && isBrandHeroUrl(s.src))
    .map((s) => path.basename(s.src!.split("?")[0]))
    .sort();
  const fresh = freshSlides.map((s) => path.basename(s.src)).sort();
  if (current.length !== fresh.length) return true;
  return current.some((name, i) => name !== fresh[i]);
}

async function heroSync() {
  return import("@/lib/cms/hero-media-sync");
}

export async function isHeroMediaOutOfSync(): Promise<boolean> {
  if (!isHeroMediaSyncEnabled()) return false;
  const sync = await heroSync();
  return sync.isHeroMediaOutOfSync();
}

export async function getExpectedHeroSlidesFromMedia(): Promise<CMSHeroSlide[]> {
  if (!isHeroMediaSyncEnabled()) return [];
  const sync = await heroSync();
  return sync.getExpectedHeroSlidesFromMedia();
}

export async function refreshBrandHeroSlides(
  force = false
): Promise<HeroMediaSyncResult> {
  if (!isHeroMediaSyncEnabled()) {
    return { slides: [], removed: 0, mediaVersion: "", sourceFiles: [] };
  }
  const sync = await heroSync();
  return sync.refreshBrandHeroSlides(force);
}

export async function getBrandHeroSlidesOrEmpty(): Promise<CMSHeroSlide[]> {
  if (!isHeroMediaSyncEnabled()) return [];
  const sync = await heroSync();
  return sync.getBrandHeroSlidesOrEmpty();
}
