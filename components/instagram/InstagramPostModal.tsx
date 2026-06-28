"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { InstagramMediaItem, InstagramPost } from "@/lib/instagram/types";
import { formatInstagramCaption, formatInstagramDate } from "@/lib/instagram/format";
import { InstagramVideoPlayer } from "./InstagramVideoPlayer";
import { cn } from "@/lib/utils";

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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  );
}

function NavButton({
  direction,
  onClick,
  label,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:border-neon-pink/40 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50",
        className
      )}
    >
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

function SlideContent({
  item,
  alt,
  isReel,
}: {
  item: InstagramMediaItem;
  alt: string;
  isReel?: boolean;
}) {
  if (item.videoUrl) {
    return (
      <InstagramVideoPlayer
        key={item.id}
        src={item.videoUrl}
        poster={item.imageUrl}
        className="rounded-xl"
      />
    );
  }

  return (
    <div className="relative flex w-full items-center justify-center">
      {isReel && (
        <span className="pointer-events-none absolute left-1 top-1 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          <PlayIcon className="h-3 w-3" />
          Reel
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.imageUrl}
        alt={alt}
        width={item.width}
        height={item.height}
        draggable={false}
        className="max-h-[min(78vh,900px)] max-w-full object-contain"
        style={{ objectFit: "contain", width: "auto", height: "auto" }}
      />
    </div>
  );
}

function MediaFrame({ post }: { post: InstagramPost }) {
  const slides: InstagramMediaItem[] =
    post.carouselItems && post.carouselItems.length > 0
      ? post.carouselItems
      : [
          {
            id: post.id,
            mediaType: post.mediaType,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            width: post.width,
            height: post.height,
          },
        ];

  const [slideIndex, setSlideIndex] = useState(0);
  const isCarousel = slides.length > 1;

  useEffect(() => {
    setSlideIndex(0);
  }, [post.id]);

  const goSlidePrev = () => {
    setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  const goSlideNext = () => {
    setSlideIndex((i) => (i + 1) % slides.length);
  };

  const current = slides[slideIndex];
  if (!current?.imageUrl) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
        <InstagramIcon className="h-12 w-12 text-neon-pink" />
        <p className="text-sm text-white/60">Publication Instagram</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isCarousel && (
        <>
          <button
            type="button"
            onClick={goSlidePrev}
            aria-label="Diapositive précédente"
            className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:border-neon-pink/40"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goSlideNext}
            aria-label="Diapositive suivante"
            className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:border-neon-pink/40"
          >
            ›
          </button>
          <p className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
            {slideIndex + 1} / {slides.length}
          </p>
        </>
      )}
      <SlideContent
        item={current}
        alt={post.alt}
        isReel={post.isReel && current.mediaType === "VIDEO"}
      />
    </div>
  );
}

type Props = {
  posts: InstagramPost[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function InstagramPostModal({
  posts,
  activeIndex,
  onClose,
  onNavigate,
}: Props) {
  const post = activeIndex !== null ? posts[activeIndex] : null;
  const isOpen = post !== null;

  const goPrev = useCallback(() => {
    if (activeIndex === null) return;
    onNavigate((activeIndex - 1 + posts.length) % posts.length);
  }, [activeIndex, onNavigate, posts.length]);

  const goNext = useCallback(() => {
    if (activeIndex === null) return;
    onNavigate((activeIndex + 1) % posts.length);
  }, [activeIndex, onNavigate, posts.length]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, goPrev, goNext]);

  return (
    <AnimatePresence>
      {isOpen && post && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label={post.alt}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
            aria-label="Fermer"
          />

          <motion.div
            className="relative z-10 flex w-full max-w-5xl flex-col gap-4"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <NavButton
                direction="prev"
                onClick={goPrev}
                label="Publication précédente"
                className="hidden sm:flex"
              />

              <div
                className={cn(
                  "relative flex w-full flex-1 items-center justify-center rounded-2xl border border-white/10 p-2 sm:p-3",
                  "bg-[#0a0a0a] shadow-[0_0_60px_rgba(255,45,149,0.08)]"
                )}
              >
                <MediaFrame post={post} />
              </div>

              <NavButton
                direction="next"
                onClick={goNext}
                label="Publication suivante"
                className="hidden sm:flex"
              />
            </div>

            <div className="flex justify-center gap-3 sm:hidden">
              <NavButton direction="prev" onClick={goPrev} label="Publication précédente" />
              <NavButton direction="next" onClick={goNext} label="Publication suivante" />
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl space-y-2 text-center sm:text-left">
                <p className="text-sm leading-relaxed text-white/70">
                  {formatInstagramCaption(post.alt)}
                </p>
                {formatInstagramDate(post.timestamp) && (
                  <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                    {formatInstagramDate(post.timestamp)}
                  </p>
                )}
              </div>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neon-pink/30 bg-neon-pink/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-neon-pink/50 hover:bg-neon-pink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50"
              >
                <InstagramIcon className="h-4 w-4" />
                Voir sur Instagram
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
