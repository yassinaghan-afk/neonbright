"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSwipeCarousel } from "@/lib/instagram/useSwipeCarousel";
import { isLocalPublicAsset, isRemoteCmsAsset } from "@/lib/media/local-image";

type Props = {
  images: string[];
  activeIndex: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
};

export function TestimonialGalleryModal({
  images,
  activeIndex,
  onNavigate,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isOpen = activeIndex !== null && images.length > 0;
  const currentIndex = activeIndex ?? 0;
  const currentSrc = images[currentIndex] ?? "";

  const goPrev = useCallback(() => {
    if (!images.length) return;
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const goNext = useCallback(() => {
    if (!images.length) return;
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  useLayoutEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, goPrev, goNext]);

  const swipe = useSwipeCarousel(goPrev, goNext, isOpen);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && (
        <motion.div
          key="testimonial-gallery-modal"
          ref={dialogRef}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
            onClick={onClose}
            aria-label="Fermer"
            tabIndex={-1}
          />
          <div
            className="relative z-10 flex w-full max-w-5xl flex-col items-center"
            onTouchStart={swipe.onTouchStart}
            onTouchEnd={swipe.onTouchEnd}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-2 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white sm:-right-2 sm:-top-4"
              aria-label="Fermer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white sm:-left-4"
                  aria-label="Image précédente"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white sm:-right-4"
                  aria-label="Image suivante"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            <div className="relative aspect-[4/3] w-full max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl sm:rounded-3xl">
              <Image
                src={currentSrc}
                alt={`Galerie ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
                unoptimized={isLocalPublicAsset(currentSrc) || isRemoteCmsAsset(currentSrc)}
                priority
              />
            </div>

            {images.length > 1 && (
              <p className="mt-4 text-sm text-white/50">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
