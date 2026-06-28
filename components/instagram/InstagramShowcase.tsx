"use client";

import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { InstagramPost } from "@/lib/instagram/types";
import { formatInstagramCaption } from "@/lib/instagram/format";
import { cardHeightForPost } from "@/lib/instagram/aspect";
import { cn } from "@/lib/utils";

const GAP_PX = 16;

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function CarouselArrow({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12",
        "border border-white/15 bg-black/60 text-white backdrop-blur-md",
        "transition duration-300 hover:border-neon-pink/40 hover:bg-black/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
      )}
    >
      <span className="sr-only">{label}</span>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        {direction === "prev" ? (
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

function useCardWidth() {
  const [width, setWidth] = useState(200);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setWidth(260);
      else if (window.matchMedia("(min-width: 640px)").matches) setWidth(220);
      else setWidth(180);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}

type FeedCardProps = {
  post: InstagramPost;
  width: number;
  index: number;
  onSelect: () => void;
};

function FeedCard({ post, width, index, onSelect }: FeedCardProps) {
  const label = formatInstagramCaption(post.alt);
  const cardHeight = cardHeightForPost(post, width);
  const isVideo = post.isReel || post.mediaType === "VIDEO";

  if (!post.imageUrl) {
    return (
      <button
        type="button"
        onClick={onSelect}
        style={{ width, height: cardHeight }}
        className={cn(
          "group relative flex shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10",
          "bg-gradient-to-br from-neon-pink/10 via-[#0a0a0a] to-neon-purple/10 px-4",
          "transition duration-300 hover:border-neon-pink/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
        )}
        aria-label={label}
      >
        <InstagramIcon className="h-8 w-8 text-neon-pink" />
        <p className="mt-2 text-center text-xs font-medium text-white/70">
          {isVideo ? "Voir le reel" : "Voir la publication"}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ width, height: cardHeight }}
      className={cn(
        "group relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]",
        "transition duration-300 hover:border-white/25 hover:shadow-[0_0_32px_rgba(255,45,149,0.12)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
      )}
      aria-label={label}
    >
      <div className="flex h-full w-full items-center justify-center p-0.5 transition-transform duration-500 group-hover:scale-[1.02]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={label}
          width={post.width}
          height={post.height}
          loading={index < 3 ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          className="max-h-full max-w-full object-contain"
          style={{ objectFit: "contain" }}
        />
      </div>

      {isVideo && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-black/55 sm:h-12 sm:w-12">
            <PlayIcon className="ml-0.5 h-5 w-5 sm:h-6 sm:w-6" />
          </span>
        </div>
      )}

      {post.carouselItems && post.carouselItems.length > 1 && (
        <span className="pointer-events-none absolute right-2.5 top-2.5 z-10 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          +{post.carouselItems.length}
        </span>
      )}

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}

type Props = {
  posts: InstagramPost[];
  onPostClick: (index: number) => void;
};

export function InstagramShowcase({ posts, onPostClick }: Props) {
  const cardWidth = useCardWidth();
  const [reduceMotion, setReduceMotion] = useState(false);

  const maxCardHeight = useMemo(
    () => Math.max(...posts.map((p) => cardHeightForPost(p, cardWidth)), cardWidth),
    [posts, cardWidth]
  );

  const plugins = useMemo(() => {
    if (reduceMotion) return [];
    return [
      AutoScroll({
        speed: 0.9,
        startDelay: 0,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ];
  }, [reduceMotion]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      dragFree: true,
      containScroll: false,
    },
    plugins
  );

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, posts, cardWidth, plugins]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const userDraggedRef = useRef(false);
  const pointerActiveRef = useRef(false);

  useEffect(() => {
    if (!emblaApi) return;
    const root = emblaApi.rootNode();

    const onDown = () => {
      pointerActiveRef.current = true;
      userDraggedRef.current = false;
    };
    const onMove = () => {
      if (pointerActiveRef.current) userDraggedRef.current = true;
    };
    const onUp = () => {
      pointerActiveRef.current = false;
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);

    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
    };
  }, [emblaApi]);

  const handleSelect = useCallback(
    (index: number) => {
      if (userDraggedRef.current) {
        userDraggedRef.current = false;
        return;
      }
      onPostClick(index);
    },
    [onPostClick]
  );

  if (posts.length === 0) return null;

  return (
    <div className="relative mt-14 w-full px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <CarouselArrow
          direction="prev"
          onClick={scrollPrev}
          label="Publication précédente"
        />

        <div
          className="instagram-showcase-mask embla min-w-0 flex-1"
          style={{ minHeight: maxCardHeight + 8 }}
        >
          <div className="embla__viewport overflow-hidden py-1" ref={emblaRef}>
            <div
              className="embla__container flex touch-pan-y"
              style={{ gap: GAP_PX, minHeight: maxCardHeight }}
            >
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="embla__slide shrink-0"
                  style={{ flex: `0 0 ${cardWidth}px` }}
                >
                  <FeedCard
                    post={post}
                    width={cardWidth}
                    index={index}
                    onSelect={() => handleSelect(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <CarouselArrow
          direction="next"
          onClick={scrollNext}
          label="Publication suivante"
        />
      </div>
    </div>
  );
}

export function ShowcaseSkeleton() {
  const cardWidth = 200;
  const cardHeight = Math.round(cardWidth / (9 / 16));
  return (
    <div className="mt-14 flex items-center gap-3 px-3 sm:gap-4 sm:px-6">
      <div className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/[0.04] sm:h-12 sm:w-12" />
      <div className="flex flex-1 gap-3 overflow-hidden sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{ width: cardWidth, height: cardHeight }}
            className="shrink-0 animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]"
          />
        ))}
      </div>
      <div className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/[0.04] sm:h-12 sm:w-12" />
    </div>
  );
}
