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

function StarsFull({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} sur 5`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={cn("h-5 w-5", n <= rating ? "text-amber-400" : "text-white/15")}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
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
  const [slideIndex, setSlideIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const isOpen =
    activeIndex !== null && activeIndex >= 0 && activeIndex < reviews.length;
  const review = isOpen ? reviews[activeIndex] : null;
  const screenshots = review?.screenshots ?? [];
  const currentSrc = screenshots[slideIndex]?.trim() ?? "";

  const canNavigateReviews = reviews.length > 1;
  const canNavigateSlides = screenshots.length > 1;

  const goPrevReview = useCallback(() => {
    if (!isOpen || !canNavigateReviews || activeIndex === null) return;
    setSlideIndex(0);
    setImgFailed(false);
    onNavigate(activeIndex - 1);
  }, [isOpen, canNavigateReviews, activeIndex, onNavigate]);

  const goNextReview = useCallback(() => {
    if (!isOpen || !canNavigateReviews || activeIndex === null) return;
    setSlideIndex(0);
    setImgFailed(false);
    onNavigate(activeIndex + 1);
  }, [isOpen, canNavigateReviews, activeIndex, onNavigate]);

  const goPrevSlide = useCallback(() => {
    setImgFailed(false);
    setSlideIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
  }, [screenshots.length]);

  const goNextSlide = useCallback(() => {
    setImgFailed(false);
    setSlideIndex((i) => (i + 1) % screenshots.length);
  }, [screenshots.length]);

  const swipe = useSwipeCarousel(
    canNavigateSlides ? goPrevSlide : goPrevReview,
    canNavigateSlides ? goNextSlide : goNextReview,
    isOpen
  );

  useFocusTrap(dialogRef, isOpen);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Reset slide index when the active review changes.
  useEffect(() => {
    setSlideIndex(0);
    setImgFailed(false);
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        if (canNavigateSlides) goPrevSlide();
        else goPrevReview();
      }
      if (e.key === "ArrowRight") {
        if (canNavigateSlides) goNextSlide();
        else goNextReview();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [
    isOpen,
    onClose,
    canNavigateSlides,
    goPrevSlide,
    goNextSlide,
    goPrevReview,
    goNextReview,
  ]);

  const unoptimized = Boolean(
    currentSrc &&
      (isLocalPublicAsset(currentSrc) || isRemoteCmsAsset(currentSrc))
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
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={`Avis de ${review.company}`}
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
            onClick={onClose}
            aria-label="Fermer"
            tabIndex={-1}
          />

          <div className="relative z-10 flex w-full max-w-2xl flex-col pointer-events-none">
            {/* Close button */}
            <div className="pointer-events-auto mb-3 flex items-center justify-between sm:mb-4">
              {/* Review navigation (previous review) */}
              <button
                type="button"
                onClick={goPrevReview}
                aria-label="Avis précédent"
                disabled={!canNavigateReviews}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-md transition duration-300",
                  canNavigateReviews
                    ? "hover:border-neon-pink/45 hover:bg-black/75"
                    : "opacity-0 pointer-events-none"
                )}
              >
                <span className="text-xl leading-none" aria-hidden>‹</span>
              </button>

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

              {/* Review navigation (next review) */}
              <button
                type="button"
                onClick={goNextReview}
                aria-label="Avis suivant"
                disabled={!canNavigateReviews}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-md transition duration-300",
                  canNavigateReviews
                    ? "hover:border-neon-pink/45 hover:bg-black/75"
                    : "opacity-0 pointer-events-none"
                )}
              >
                <span className="text-xl leading-none" aria-hidden>›</span>
              </button>
            </div>

            {/* Card */}
            <motion.div
              key={`${review.id}-${slideIndex}`}
              className="pointer-events-auto relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/90 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_60px_rgba(168,85,247,0.08)] backdrop-blur-sm sm:rounded-3xl"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Screenshot area */}
              <div
                className="relative"
                onTouchStart={swipe.onTouchStart}
                onTouchEnd={swipe.onTouchEnd}
              >
                <div className="relative max-h-[60vh] min-h-[240px] w-full overflow-hidden sm:max-h-[70vh]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${review.id}-img-${slideIndex}`}
                      className="relative h-full w-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {currentSrc && !imgFailed ? (
                        <Image
                          src={currentSrc}
                          alt=""
                          width={800}
                          height={600}
                          className="h-full max-h-[60vh] w-full object-contain p-3 sm:max-h-[70vh]"
                          unoptimized={unoptimized}
                          priority
                          draggable={false}
                          onError={() => setImgFailed(true)}
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center text-white/25 sm:h-64">
                          <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Prev / next slide arrows (inside image) */}
                  {canNavigateSlides && (
                    <>
                      <button
                        type="button"
                        onClick={goPrevSlide}
                        aria-label="Capture précédente"
                        className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-md transition duration-300 hover:border-neon-pink/45 hover:bg-black/75 sm:left-3 sm:h-11 sm:w-11"
                      >
                        <span className="text-xl leading-none sm:text-2xl" aria-hidden>‹</span>
                      </button>
                      <button
                        type="button"
                        onClick={goNextSlide}
                        aria-label="Capture suivante"
                        className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-md transition duration-300 hover:border-neon-pink/45 hover:bg-black/75 sm:right-3 sm:h-11 sm:w-11"
                      >
                        <span className="text-xl leading-none sm:text-2xl" aria-hidden>›</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                {canNavigateSlides && (
                  <div className="flex items-center justify-center gap-1.5 border-t border-white/8 bg-black/30 px-4 py-2">
                    {screenshots.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSlideIndex(i); setImgFailed(false); }}
                        aria-label={`Capture ${i + 1}`}
                        className={cn(
                          "relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border transition-all duration-200",
                          i === slideIndex
                            ? "border-neon-pink/60 opacity-100 scale-110"
                            : "border-white/10 opacity-50 hover:opacity-80"
                        )}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info panel */}
              <div className="border-t border-white/8 bg-black/40 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-white sm:text-lg">
                      {review.company}
                    </p>
                    {review.reviewer && (
                      <p className="mt-0.5 text-sm text-white/55">{review.reviewer}</p>
                    )}
                  </div>
                  <StarsFull rating={review.rating} />
                </div>
                {review.title && (
                  <p className="mt-3 font-semibold text-white/90">{review.title}</p>
                )}
                {review.description && (
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {review.description}
                  </p>
                )}
                {/* Slide counter */}
                {canNavigateSlides && (
                  <p className="mt-3 text-right text-xs text-white/30">
                    {slideIndex + 1} / {screenshots.length}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
