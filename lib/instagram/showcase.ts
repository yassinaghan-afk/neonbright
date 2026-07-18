import { resolveInstagramUrl } from "@/lib/cms/contact-social";
import {
  filterPublicPosts,
  normalizeInstagramPosts,
} from "@/lib/cms/instagram-normalize";
import { sortByOrder } from "@/lib/cms/normalize";
import { readCMSContent } from "@/lib/cms/store";
import type { CMSContent, CMSInstagramPost, CMSInstagramSettings } from "@/lib/cms/types";

export type InstagramShowcaseData = {
  settings: CMSInstagramSettings;
  posts: CMSInstagramPost[];
  profileUrl: string;
  isEmpty: boolean;
};

/**
 * Pure derivation from already-loaded CMS content — no additional disk read.
 * Callers that already hold a `CMSContent` (e.g. the homepage Server
 * Component) should use this instead of `getInstagramShowcase()` to avoid a
 * second independent CMS read on the same request.
 */
export function buildInstagramShowcase(content: CMSContent): InstagramShowcaseData {
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

/** Standalone entry point (API routes, etc.) — reads CMS storage itself. */
export async function getInstagramShowcase(): Promise<InstagramShowcaseData> {
  const content = await readCMSContent();
  return buildInstagramShowcase(content);
}
