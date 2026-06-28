import { unstable_cache } from "next/cache";
import {
  fetchLatestInstagramPosts,
  isInstagramApiConfigured,
} from "./graph";
import {
  INSTAGRAM_CACHE_SECONDS,
  INSTAGRAM_CACHE_TAG,
} from "./constants";
import type { InstagramFeedResult } from "./types";

async function loadInstagramFeed(): Promise<InstagramFeedResult> {
  const configured = isInstagramApiConfigured();

  if (!configured) {
    return {
      posts: [],
      source: "graph",
      configured: false,
    };
  }

  try {
    const posts = await fetchLatestInstagramPosts();
    return {
      posts,
      source: "graph",
      configured: true,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Instagram Graph API failed";
    console.error("[instagram] Graph API:", message);
    return {
      posts: [],
      source: "graph",
      configured: true,
      error: message,
    };
  }
}

export const getInstagramFeed = unstable_cache(
  loadInstagramFeed,
  [INSTAGRAM_CACHE_TAG],
  {
    revalidate: INSTAGRAM_CACHE_SECONDS,
    tags: [INSTAGRAM_CACHE_TAG],
  }
);

/** @deprecated Use getInstagramFeed */
export async function getInstagramPosts() {
  const feed = await getInstagramFeed();
  return feed.posts;
}

export type { InstagramPost, InstagramFeedResult } from "./types";
