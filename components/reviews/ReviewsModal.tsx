"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { CMSReview } from "@/lib/cms/types";
import { useSwipeCarousel } from "@/lib/instagram/useSwipeCarousel";
import { isLocalPublicAsset, isRemoteCmsAsset } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const root = containerRef.current;
    const selector =
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
      );
    const previously = document.activeElement as HTMLElement | null;
    getFocusable()[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
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
      previously?.focus?.();
    };
  }, [active, containerRef]);
}

type Props = {
  reviews: CMSReview[];
  activeIndex: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
};

export function ReviewsModal({ reviews, activeIndex, onNavigate, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < reviews.length;
  const review = isOpen ? reviews[activeIndex] : null;
  const currentSrc = review?.image?.trim() ?? "";
  const canNavigate = reviews.length > 1;

  const goPrev = useCallback(() => {
    if (!isOpen || activeIndex === null) return;
    setImgFailed(false);
    onNavigate(activeIndex - 1);
  }, [isOpen, activeIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (!isOpen || activeIndex === null) return;
    setImgFailed(false);
    onNavigate(activeIndex + 1);
  }, [isOpen, activeIndex, onNavigate]);

  const swipe = useSwipeCarousel(goPrev, goNext, canNavigate && isOpen);

  useFocusTrap(dialogRef, isOpen);
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImgFailed(false);
  }, [activeIndex]);

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
    currentSrc && (isLocalPublicAsset(currentSrc) || isRemoteCmsAsset(currentSrc))
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && review && (
        <motion.div
          key="reviews-modal"
          ref={dialogRef}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Capture d'avis"
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
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-md transition duration-300 hover:border-white/25 hover:bg-black/75"
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
                  aria-label="Capture précédente"
                  className={cn(
                    "absolute -left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full sm:-left-5 sm:h-14 sm:w-14",
                    "border border-white/12 bg-black/55 text-white backdrop-blur-md",
                    "transition duration-300 hover:border-neon-pink/45 hover:bg-black/75"
                  )}
                >
                  <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
                    ‹
                  </span>
                </button>
              )}

              <motion.div
                key={review.id}
                className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-sm sm:rounded-3xl"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative aspect-[4/5] w-full max-h-[min(80vh,800px)] sm:aspect-square sm:max-h-[min(75vh,750px)]">
                  {currentSrc && !imgFailed ? (
                    <Image
                      src={currentSrc}
                      alt=""
                      fill
                      className="object-contain p-2 sm:p-3"
                      sizes="(max-width: 768px) 100vw, 900px"
                      unoptimized={unoptimized}
                      priority
                      draggable={false}
                      onError={() => setImgFailed(true)}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.02]"
                      aria-hidden
                    />
                  )}
                </div>
              </motion.div>

              {canNavigate && (
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Capture suivante"
                  className={cn(
                    "absolute -right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full sm:-right-5 sm:h-14 sm:w-14",
                    "border border-white/12 bg-black/55 text-white backdrop-blur-md",
                    "transition duration-300 hover:border-neon-pink/45 hover:bg-black/75"
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
