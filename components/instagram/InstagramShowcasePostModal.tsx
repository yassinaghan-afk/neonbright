"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CMSInstagramPost } from "@/lib/cms/types";
import { useSwipeCarousel } from "@/lib/instagram/useSwipeCarousel";
import { isLocalPublicAsset, isRemoteCmsAsset } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

const HANDLE = "@_neonbright_";

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

function preloadImage(src: string) {
  if (!src || typeof window === "undefined") return;
  const img = new window.Image();
  img.decoding = "async";
  img.src = src;
}

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const root = containerRef.current;
    const selector =
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
      );

    const previouslyFocused = document.activeElement as HTMLElement | null;
    getFocusable()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef]);
}

type Props = {
  posts: CMSInstagramPost[];
  activeIndex: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
};

export function InstagramShowcasePostModal({
  posts,
  activeIndex,
  onNavigate,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const isOpen =
    activeIndex !== null && activeIndex >= 0 && activeIndex < posts.length;
  const currentPost = isOpen ? posts[activeIndex] : null;
  const currentImage = currentPost?.image?.trim() ?? "";
  const canNavigate = posts.length > 1;

  const goPrev = useCallback(() => {
    if (!isOpen || posts.length <= 1 || activeIndex === null) return;
    setImageFailed(false);
    onNavigate(activeIndex - 1);
  }, [isOpen, posts.length, activeIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (!isOpen || posts.length <= 1 || activeIndex === null) return;
    setImageFailed(false);
    onNavigate(activeIndex + 1);
  }, [isOpen, posts.length, activeIndex, onNavigate]);

  const swipe = useSwipeCarousel(goPrev, goNext, canNavigate && isOpen);

  useFocusTrap(dialogRef, isOpen);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setImageFailed(false);
  }, [isOpen, activeIndex, currentImage]);

  useEffect(() => {
    if (!isOpen || posts.length <= 1 || activeIndex === null) return;
    const prev = posts[(activeIndex - 1 + posts.length) % posts.length];
    const next = posts[(activeIndex + 1) % posts.length];
    if (prev?.image) preloadImage(prev.image);
    if (next?.image) preloadImage(next.image);
    if (currentImage) preloadImage(currentImage);
  }, [isOpen, activeIndex, posts, currentImage]);

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

  const unoptimized = Boolean(
    currentImage &&
      (isLocalPublicAsset(currentImage) || isRemoteCmsAsset(currentImage))
  );

  const instagramUrl = currentPost?.instagramUrl?.trim();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && currentPost && (
        <motion.div
          key="instagram-gallery-modal"
          ref={dialogRef}
          className="fixed inset-0 z-[200] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie Instagram"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/88 backdrop-blur-2xl"
            onClick={onClose}
            aria-label="Fermer"
            tabIndex={-1}
          />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
            <div className="flex shrink-0 justify-end p-4 sm:p-6 pointer-events-auto">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/50 text-white backdrop-blur-md transition duration-300 hover:border-white/25 hover:bg-black/70"
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

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center px-14 sm:px-20 pointer-events-auto"
              onTouchStart={swipe.onTouchStart}
              onTouchEnd={swipe.onTouchEnd}
            >
              {canNavigate && (
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Publication précédente"
                  className={cn(
                    "absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full sm:left-6 sm:h-14 sm:w-14",
                    "border border-white/12 bg-black/45 text-white backdrop-blur-md",
                    "transition duration-300 hover:border-neon-pink/40 hover:bg-black/65 hover:shadow-[0_0_28px_rgba(236,72,153,0.25)]"
                  )}
                >
                  <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
                    ‹
                  </span>
                </button>
              )}

              <motion.div
                key={currentPost.id}
                className="relative flex h-full max-h-[calc(100vh-220px)] w-full max-w-6xl items-center justify-center"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative h-full w-full max-h-[calc(100vh-220px)] min-h-[200px]">
                  {currentImage && !imageFailed ? (
                    <Image
                      src={currentImage}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="100vw"
                      unoptimized={unoptimized}
                      priority
                      draggable={false}
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 rounded-lg bg-white/[0.03]" aria-hidden />
                  )}
                </div>
              </motion.div>

              {canNavigate && (
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Publication suivante"
                  className={cn(
                    "absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full sm:right-6 sm:h-14 sm:w-14",
                    "border border-white/12 bg-black/45 text-white backdrop-blur-md",
                    "transition duration-300 hover:border-neon-pink/40 hover:bg-black/65 hover:shadow-[0_0_28px_rgba(236,72,153,0.25)]"
                  )}
                >
                  <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
                    ›
                  </span>
                </button>
              )}
            </div>

            <div className="relative z-10 flex shrink-0 flex-col items-center gap-4 px-6 pb-8 pt-4 sm:gap-5 sm:pb-10 pointer-events-auto">
              <p className="font-display text-sm font-semibold tracking-[0.2em] text-white/90 sm:text-base">
                {HANDLE}
              </p>
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2.5 rounded-full border border-neon-pink/35 bg-neon-pink/10 px-8 py-3.5",
                    "text-sm font-semibold text-white transition duration-300",
                    "hover:border-neon-pink/55 hover:bg-neon-pink/18 hover:shadow-[0_0_32px_rgba(236,72,153,0.22)]"
                  )}
                >
                  <InstagramIcon className="h-4 w-4" />
                  Voir sur Instagram
                </a>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
