"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { CMSInstagramPost } from "@/lib/cms/types";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

const CARD_CLASS =
  "instagram-marquee-card relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out group-hover:border-neon-pink/45 group-hover:shadow-[0_0_36px_rgba(236,72,153,0.28),0_0_64px_rgba(168,85,247,0.12),0_12px_48px_rgba(0,0,0,0.5)] group-hover:scale-[1.05] group-focus-visible:ring-2 group-focus-visible:ring-neon-pink/50 aspect-square w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px]";

function PostImagePlaceholder() {
  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.02]"
      aria-hidden
    >
      <svg
        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}

type PostCardProps = {
  post: CMSInstagramPost;
  onSelect: (post: CMSInstagramPost) => void;
  imageFailed: boolean;
  onImageError: (id: string) => void;
  className?: string;
};

function PostCard({
  post,
  onSelect,
  imageFailed,
  onImageError,
  className,
}: PostCardProps) {
  const openPost = () => onSelect(post);
  const alt = post.altText || post.caption || "";

  return (
    <button
      type="button"
      onClick={() => openPost()}
      className={cn(
        "instagram-marquee-item group relative z-10 shrink-0 cursor-pointer border-0 bg-transparent p-0",
        className
      )}
      aria-label={alt || "Ouvrir"}
    >
      <div className={CARD_CLASS}>
        {imageFailed ? (
          <PostImagePlaceholder />
        ) : (
          <Image
            src={post.image}
            alt={alt}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 260px"
            className="pointer-events-none object-cover"
            draggable={false}
            onError={() => onImageError(post.id)}
            {...localImageUnoptimized(post.image)}
          />
        )}
      </div>
    </button>
  );
}

type PostsMarqueeRowProps = {
  posts: CMSInstagramPost[];
  onPostSelect: (post: CMSInstagramPost) => void;
};

export function InstagramPostsMarqueeRow({
  posts,
  onPostSelect,
}: PostsMarqueeRowProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());

  const visiblePosts = useMemo(
    () => posts.filter((post) => Boolean(post.image?.trim())),
    [posts]
  );

  const handleImageError = (id: string) => {
    setFailedIds((prev) => new Set(prev).add(id));
  };

  const trackPosts = useMemo(
    () => [...visiblePosts, ...visiblePosts],
    [visiblePosts]
  );

  if (visiblePosts.length === 0) return null;

  return (
    <div
      className="instagram-marquee-row relative py-3 sm:py-4"
      aria-label="Galerie Instagram"
    >
      <div className="instagram-marquee-mask overflow-hidden">
        <div className="instagram-marquee-track instagram-marquee-track--rtl flex w-max items-stretch gap-4 px-4 sm:gap-6 sm:px-6">
          {trackPosts.map((post, index) => (
            <PostCard
              key={`${post.id}-${index}`}
              post={post}
              onSelect={onPostSelect}
              imageFailed={failedIds.has(post.id)}
              onImageError={handleImageError}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
