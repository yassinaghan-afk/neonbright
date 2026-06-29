import { readCMSContent } from "@/lib/cms/store";
import { resolveInstagramUrl } from "@/lib/cms/contact-social";
import { sortByOrder } from "@/lib/cms/normalize";
import type { CMSInstagramMediaItem, CMSInstagramSettings } from "@/lib/cms/types";

export type InstagramShowcaseData = {
  settings: CMSInstagramSettings;
  posts: CMSInstagramMediaItem[];
  reels: CMSInstagramMediaItem[];
  profileUrl: string;
};

export async function getInstagramShowcase(): Promise<InstagramShowcaseData> {
  const content = await readCMSContent();
  const profileUrl = resolveInstagramUrl(content.social, content.instagram.url);

  return {
    settings: content.instagram,
    posts: sortByOrder(content.instagramPosts ?? []).filter((p) => p.enabled && p.thumbnail),
    reels: sortByOrder(content.instagramReels ?? []).filter((r) => r.enabled && r.thumbnail),
    profileUrl,
  };
}
