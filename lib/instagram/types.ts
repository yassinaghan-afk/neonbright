export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;

export type InstagramMediaItem = {
  id: string;
  mediaType: InstagramMediaType;
  /** Gallery / poster — media_url for images, thumbnail_url for videos */
  imageUrl: string;
  videoUrl?: string;
  width?: number;
  height?: number;
};

export type InstagramPost = {
  id: string;
  permalink: string;
  imageUrl: string;
  alt: string;
  timestamp?: string;
  mediaType: InstagramMediaType;
  isReel?: boolean;
  width?: number;
  height?: number;
  videoUrl?: string;
  /** All slides for CAROUSEL_ALBUM posts */
  carouselItems?: InstagramMediaItem[];
  source: "graph";
};

export type InstagramFeedResult = {
  posts: InstagramPost[];
  source: "graph";
  configured: boolean;
  error?: string;
  profileUrl?: string;
};
