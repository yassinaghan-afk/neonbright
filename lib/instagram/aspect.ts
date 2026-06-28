import type { InstagramPost } from "./types";

/** Card height from Graph API width/height metadata. */
export function cardHeightForPost(post: InstagramPost, cardWidth: number): number {
  if (post.width && post.height && post.width > 0 && post.height > 0) {
    return Math.round(cardWidth * (post.height / post.width));
  }
  if (post.isReel) return Math.round(cardWidth * (16 / 9));
  return cardWidth;
}
