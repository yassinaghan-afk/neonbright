"use client";

import Image from "next/image";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { CMSInstagramPost } from "@/lib/cms/types";
import {
  buildMarqueeTrack,
  computeMarqueeCopies,
} from "@/lib/instagram/marquee";
import { localImageUnoptimized } from "@/lib/media/local-image";

const CARD_CLASS =
  "instagram-marquee-card relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out group-hover:border-neon-pink/45 group-hover:shadow-[0_0_36px_rgba(236,72,153,0.28),0_0_64px_rgba(168,85,247,0.12),0_12px_48px_rgba(0,0,0,0.5)] group-hover:scale-[1.03] group-focus-visible:ring-2 group-focus-visible:ring-neon-pink/50 aspect-square w-[180px] sm:w-[220px] md:w-[250px] lg:w-[290px]";

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
};

function PostCard({
  post,
  onSelect,
  imageFailed,
  onImageError,
}: PostCardProps) {
  const alt = post.altText || post.caption || "";

  return (
    <button
      type="button"
      onClick={() => onSelect(post)}
      className="instagram-marquee-item group relative z-10 shrink-0 cursor-pointer border-0 bg-transparent p-0"
      aria-label={alt || "Ouvrir"}
    >
      <div className={CARD_CLASS}>
        {imageFailed ? (
          <PostImagePlaceholder />
        ) : (
          <Image
            src={post.thumbnailUrl ?? post.image}
            alt={alt}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 180px, (max-width: 1024px) 250px, 290px"
            className="pointer-events-none object-cover"
            draggable={false}
            onError={() => onImageError(post.id)}
            {...localImageUnoptimized(post.thumbnailUrl ?? post.image)}
          />
        )}
      </div>
    </button>
  );
}

type PostsMarqueeRowProps = {
  posts: CMSInstagramPost[];
  onPostSelect: (post: CMSInstagramPost) => void;
  /** Pause continuous animation (e.g. while lightbox is open). */
  paused?: boolean;
};

export function InstagramPostsMarqueeRow({
  posts,
  onPostSelect,
  paused = false,
}: PostsMarqueeRowProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
  const maskRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(() =>
    computeMarqueeCopies(Math.max(posts.length, 1))
  );

  const visiblePosts = useMemo(
    () => posts.filter((post) => Boolean(post.image?.trim())),
    [posts]
  );

  useLayoutEffect(() => {
    const mask = maskRef.current;
    const measure = measureRef.current;
    if (!mask || !measure || visiblePosts.length === 0) return;

    const update = () => {
      const viewportWidth = mask.clientWidth;
      const setWidth = measure.scrollWidth;
      const next = computeMarqueeCopies(
        visiblePosts.length,
        viewportWidth,
        setWidth
      );
      setCopies((prev) => (prev === next ? prev : next));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(mask);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [visiblePosts]);

  const trackPosts = useMemo(
    () => buildMarqueeTrack(visiblePosts, copies),
    [visiblePosts, copies]
  );

  // Duration scales with set size so speed stays readable with many posts.
  const durationSec = Math.max(28, Math.min(90, visiblePosts.length * 6 * Math.max(copies / 2, 1)));

  const handleImageError = (id: string) => {
    setFailedIds((prev) => new Set(prev).add(id));
  };

  if (visiblePosts.length === 0) return null;

  return (
    <div
      className={`instagram-marquee-row relative w-full py-3 sm:py-4${
        paused ? " instagram-marquee-row--paused" : ""
      }`}
      aria-label="Galerie Instagram"
      style={
        {
          "--ig-marquee-copies": String(copies),
          "--ig-marquee-duration": `${durationSec}s`,
        } as CSSProperties
      }
    >
      {/* Hidden single-set measurer for accurate seamless-loop distance */}
      <div
        ref={measureRef}
        className="pointer-events-none absolute -left-[9999px] top-0 flex w-max items-stretch gap-4 opacity-0 sm:gap-5"
        aria-hidden
      >
        {visiblePosts.map((post) => (
          <div
            key={`measure-${post.id}`}
            className="aspect-square w-[180px] shrink-0 sm:w-[220px] md:w-[250px] lg:w-[290px]"
          />
        ))}
      </div>

      <div ref={maskRef} className="instagram-marquee-mask w-full overflow-hidden">
        <div className="instagram-marquee-track instagram-marquee-track--rtl flex w-max items-stretch gap-4 px-3 sm:gap-5 sm:px-4">
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
