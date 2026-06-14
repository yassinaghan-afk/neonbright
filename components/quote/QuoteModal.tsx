"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuote } from "@/components/quote/QuoteProvider";
import { QuoteForm } from "@/components/quote/QuoteForm";

export function QuoteModal() {
  const { isOpen, initialStep, openCount, closeQuote } = useQuote();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={closeQuote}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_32px_80px_rgba(0,0,0,0.6)] sm:mx-4 sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
              <div>
                <p
                  id="quote-modal-title"
                  className="font-display text-lg font-semibold sm:text-xl"
                >
                  Get Your Instant Quote
                </p>
                <p className="text-xs text-muted">
                  Free mockup · Response within 24 hours
                </p>
              </div>
              <button
                type="button"
                onClick={closeQuote}
                aria-label="Close quote form"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted transition-colors hover:border-white/25 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8">
              <QuoteForm
                key={openCount}
                initialStep={initialStep}
                onSuccess={closeQuote}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
