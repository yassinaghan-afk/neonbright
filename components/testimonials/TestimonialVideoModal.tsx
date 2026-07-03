"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  videoUrl: string | null;
  onClose: () => void;
};

export function TestimonialVideoModal({ videoUrl, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const isOpen = Boolean(videoUrl);

  useLayoutEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && videoUrl && (
        <motion.div
          key="testimonial-video-modal"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            onClick={onClose}
            aria-label="Fermer"
            tabIndex={-1}
          />
          <div className="relative z-10 w-full max-w-5xl">
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
            <video
              src={videoUrl}
              controls
              playsInline
              autoPlay
              className="max-h-[80vh] w-full rounded-2xl border border-white/10 bg-black shadow-2xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
