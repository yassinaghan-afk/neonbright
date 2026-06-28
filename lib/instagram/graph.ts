import {
  getInstagramGraphVersion,
  resolveInstagramUserId,
  getInstagramAccessToken,
  isInstagramApiConfigured,
} from "./config";
import type { InstagramMediaItem, InstagramPost } from "./types";
import { INSTAGRAM_POST_LIMIT } from "./constants";
import { isReelPermalink } from "./fallback";

export const GRAPH_MEDIA_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,width,height,children{id,media_type,media_url,thumbnail_url,width,height}";

export type GraphMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  width?: number;
  height?: number;
  children?: { data?: GraphMediaItem[] };
};

type GraphMediaResponse = {
  data?: GraphMediaItem[];
  error?: { message: string };
};

function captionAlt(caption?: string): string {
  const trimmed = caption?.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Publication Instagram Neon Bright";
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
}

async function graphGet<T>(path: string, token: string): Promise<T> {
  const version = getInstagramGraphVersion();
  const url = new URL(`https://graph.facebook.com/${version}/${path}`);
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(
      json.error?.message ?? `Instagram Graph API error (${res.status})`
    );
  }
  return json;
}

/** Single media node — IMAGE uses media_url, VIDEO uses thumbnail_url + media_url */
export function resolveGraphMediaItem(
  item: GraphMediaItem
): InstagramMediaItem | null {
  if (item.media_type === "VIDEO") {
    const imageUrl = item.thumbnail_url;
    if (!imageUrl) return null;
    return {
      id: item.id,
      mediaType: "VIDEO",
      imageUrl,
      videoUrl: item.media_url ?? undefined,
      width: item.width,
      height: item.height,
    };
  }

  const imageUrl = item.media_url;
  if (!imageUrl) return null;

  return {
    id: item.id,
    mediaType: item.media_type ?? "IMAGE",
    imageUrl,
    width: item.width,
    height: item.height,
  };
}

function graphItemToPost(item: GraphMediaItem): InstagramPost | null {
  if (!item.permalink) return null;

  const mediaType = item.media_type ?? "IMAGE";
  let carouselItems: InstagramMediaItem[] | undefined;

  if (mediaType === "CAROUSEL_ALBUM") {
    carouselItems = (item.children?.data ?? [])
      .map(resolveGraphMediaItem)
      .filter((m): m is InstagramMediaItem => m !== null);
    if (carouselItems.length === 0) return null;
  }

  const primary =
    carouselItems?.[0] ?? resolveGraphMediaItem(item);
  if (!primary) return null;

  const isReel =
    mediaType === "VIDEO" || isReelPermalink(item.permalink);

  return {
    id: item.id,
    permalink: item.permalink,
    imageUrl: primary.imageUrl,
    alt: captionAlt(item.caption),
    timestamp: item.timestamp,
    mediaType,
    isReel,
    width: primary.width,
    height: primary.height,
    videoUrl: primary.videoUrl,
    carouselItems:
      carouselItems && carouselItems.length > 1 ? carouselItems : undefined,
    source: "graph",
  };
}

export async function fetchInstagramPostsFromGraph(
  userId: string,
  accessToken: string,
  limit: number
): Promise<InstagramPost[]> {
  const response = await graphGet<GraphMediaResponse>(
    `${userId}/media?fields=${GRAPH_MEDIA_FIELDS}&limit=${limit}`,
    accessToken
  );

  const posts: InstagramPost[] = [];
  for (const item of response.data ?? []) {
    const post = graphItemToPost(item);
    if (post) posts.push(post);
  }
  return posts;
}

export async function fetchLatestInstagramPosts(): Promise<InstagramPost[]> {
  const accessToken = getInstagramAccessToken();
  if (!accessToken) {
    throw new Error(
      "INSTAGRAM_ACCESS_TOKEN is not set. Add it to .env.local — see .env.example."
    );
  }

  const userId = await resolveInstagramUserId(accessToken);
  if (!userId) {
    throw new Error(
      "Instagram user ID not found. Set INSTAGRAM_USER_ID or FACEBOOK_PAGE_ID in .env.local."
    );
  }

  return fetchInstagramPostsFromGraph(
    userId,
    accessToken,
    INSTAGRAM_POST_LIMIT
  );
}

export { isInstagramApiConfigured };
