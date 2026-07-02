import { createId } from "@/lib/cms/id";
import type { CMSInstagramPost, CMSInstagramReel } from "@/lib/cms/types";

type LegacyPost = Partial<CMSInstagramPost> & {
  thumbnail?: string;
  imageUrl?: string;
  url?: string;
  alt?: string;
};

type LegacyReel = Partial<CMSInstagramReel> & {
  url?: string;
  alt?: string;
};

export function normalizeInstagramPost(
  item: LegacyPost,
  sortOrder: number
): CMSInstagramPost {
  const image = String(
    item.image ?? item.thumbnail ?? item.imageUrl ?? ""
  ).trim();
  const carouselImages = (item.carouselImages ?? [])
    .map((url) => String(url).trim())
    .filter(Boolean);

  return {
    id: item.id ?? createId("igp"),
    image,
    carouselImages: carouselImages.length ? carouselImages : undefined,
    caption: String(item.caption ?? item.alt ?? "").trim(),
    instagramUrl: String(item.instagramUrl ?? item.url ?? "").trim(),
    enabled: item.enabled !== false,
    sortOrder,
  };
}

export function normalizeInstagramReel(
  item: LegacyReel,
  sortOrder: number
): CMSInstagramReel {
  return {
    id: item.id ?? createId("igr"),
    videoUrl: String(item.videoUrl ?? "").trim(),
    thumbnail: String(item.thumbnail ?? "").trim(),
    caption: String(item.caption ?? item.alt ?? "").trim(),
    instagramUrl: String(item.instagramUrl ?? item.url ?? "").trim(),
    enabled: item.enabled !== false,
    sortOrder,
  };
}

export function normalizeInstagramPosts(
  items: LegacyPost[]
): CMSInstagramPost[] {
  return items.map((item, i) => normalizeInstagramPost(item, i));
}

export function normalizeInstagramReels(
  items: LegacyReel[]
): CMSInstagramReel[] {
  return items.map((item, i) => normalizeInstagramReel(item, i));
}

/** Posts visible on the public site. */
export function filterPublicPosts(posts: CMSInstagramPost[]): CMSInstagramPost[] {
  return posts.filter((post) => post.enabled && Boolean(post.image?.trim()));
}

/** Reels visible on the public site — requires thumbnail and video. */
export function filterPublicReels(reels: CMSInstagramReel[]): CMSInstagramReel[] {
  return reels.filter(
    (reel) =>
      reel.enabled &&
      Boolean(reel.thumbnail?.trim()) &&
      Boolean(reel.videoUrl?.trim())
  );
}

export function postSlideUrls(post: CMSInstagramPost): string[] {
  const primary = post.image?.trim();
  const extra = (post.carouselImages ?? [])
    .map((url) => url.trim())
    .filter(Boolean);
  if (!primary) return extra;
  if (extra.length === 0) return [primary];
  return [primary, ...extra.filter((url) => url !== primary)];
}
