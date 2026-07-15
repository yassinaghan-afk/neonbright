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
  profileUrl?: string;
};

export function InstagramShowcasePostModal({
  posts,
  activeIndex,
  onNavigate,
  onClose,
  profileUrl,
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

  const instagramUrl = currentPost?.instagramUrl?.trim() || profileUrl?.trim() || "";
  const imageAlt = currentPost?.altText || currentPost?.caption || "";

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && currentPost && (
        <motion.div
          key="instagram-gallery-modal"
          ref={dialogRef}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
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
            className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
            onClick={onClose}
            aria-label="Fermer"
            tabIndex={-1}
          />

          <div className="relative z-10 flex w-full max-w-5xl flex-col pointer-events-none">
            <div className="pointer-events-auto mb-3 flex justify-end sm:mb-4">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-md transition duration-300 hover:border-white/25 hover:bg-black/75 hover:shadow-[0_0_24px_rgba(236,72,153,0.2)]"
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
              className="relative flex items-center justify-center pointer-events-auto"
              onTouchStart={swipe.onTouchStart}
              onTouchEnd={swipe.onTouchEnd}
            >
              {canNavigate && (
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Publication précédente"
                  className={cn(
                    "absolute -left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full sm:-left-5 sm:h-14 sm:w-14",
                    "border border-white/12 bg-black/55 text-white backdrop-blur-md",
                    "transition duration-300 hover:border-neon-pink/45 hover:bg-black/75 hover:shadow-[0_0_28px_rgba(236,72,153,0.28)]"
                  )}
                >
                  <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
                    ‹
                  </span>
                </button>
              )}

              <motion.div
                key={currentPost.id}
                className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_60px_rgba(168,85,247,0.08)] backdrop-blur-sm sm:rounded-3xl"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative aspect-[4/5] w-full max-h-[min(72vh,720px)] sm:aspect-square sm:max-h-[min(68vh,680px)]">
                  {currentImage && !imageFailed ? (
                    <Image
                      src={currentImage}
                      alt={imageAlt}
                      fill
                      className="object-contain p-2 sm:p-3"
                      sizes="(max-width: 768px) 100vw, 900px"
                      unoptimized={unoptimized}
                      priority
                      draggable={false}
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.02]" aria-hidden />
                  )}
                </div>

                <div className="flex flex-col items-center gap-3 border-t border-white/8 bg-black/40 px-6 py-5 sm:gap-4 sm:py-6">
                  <p className="text-xs font-medium tracking-wide text-white/45 sm:text-sm">
                    {(activeIndex ?? 0) + 1} / {posts.length}
                  </p>
                  <p className="font-display text-sm font-semibold tracking-[0.22em] text-white/90 sm:text-base">
                    {HANDLE}
                  </p>
                  {instagramUrl ? (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-8 py-3.5",
                        "border border-neon-pink/40 bg-gradient-to-r from-neon-pink/15 via-neon-purple/10 to-neon-pink/15",
                        "text-sm font-semibold text-white shadow-[0_0_32px_rgba(236,72,153,0.15)]",
                        "transition duration-300 hover:border-neon-pink/60 hover:shadow-[0_0_40px_rgba(236,72,153,0.28)] hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neon-pink/20 via-transparent to-neon-purple/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <InstagramIcon className="relative h-4 w-4 text-neon-pink" />
                      <span className="relative">Voir sur Instagram</span>
                    </a>
                  ) : null}
                </div>
              </motion.div>

              {canNavigate && (
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Publication suivante"
                  className={cn(
                    "absolute -right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full sm:-right-5 sm:h-14 sm:w-14",
                    "border border-white/12 bg-black/55 text-white backdrop-blur-md",
                    "transition duration-300 hover:border-neon-pink/45 hover:bg-black/75 hover:shadow-[0_0_28px_rgba(236,72,153,0.28)]"
                  )}
                >
                  <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
                    ›
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
