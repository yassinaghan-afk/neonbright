import { resolveInstagramUrl } from "@/lib/cms/contact-social";
import {
  filterPublicPosts,
  normalizeInstagramPosts,
} from "@/lib/cms/instagram-normalize";
import { sortByOrder } from "@/lib/cms/normalize";
import { readCMSContent } from "@/lib/cms/store";
import type { CMSInstagramPost, CMSInstagramSettings } from "@/lib/cms/types";

export type InstagramShowcaseData = {
  settings: CMSInstagramSettings;
  posts: CMSInstagramPost[];
  profileUrl: string;
  isEmpty: boolean;
};

/** Homepage entry point — posts only, always fresh from CMS storage. */
export async function getInstagramShowcase(): Promise<InstagramShowcaseData> {
  const content = await readCMSContent();
  const profileUrl = resolveInstagramUrl(content.social, content.instagram.url);
  const posts = filterPublicPosts(
    normalizeInstagramPosts(sortByOrder(content.instagramPosts ?? []))
  );

  return {
    settings: content.instagram,
    posts,
    profileUrl,
    isEmpty: posts.length === 0,
  };
}
