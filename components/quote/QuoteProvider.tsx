"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import type { QuoteStep } from "@/lib/quote/types";
import type { DesignerQuotePayload } from "@/lib/designer/types";

type QuoteContextValue = {
  isOpen: boolean;
  initialStep: QuoteStep;
  openCount: number;
  designerPayload: DesignerQuotePayload | null;
  openQuote: (step?: QuoteStep) => void;
  openQuoteWithDesigner: (payload: DesignerQuotePayload) => void;
  closeQuote: () => void;
  clearDesignerPayload: () => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used within QuoteProvider");
  return ctx;
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialStep, setInitialStep] = useState<QuoteStep>(1);
  const [openCount, setOpenCount] = useState(0);
  const [designerPayload, setDesignerPayload] = useState<DesignerQuotePayload | null>(null);

  const openQuote = useCallback((step: QuoteStep = 1) => {
    setInitialStep(step);
    setOpenCount((c) => c + 1);
    setIsOpen(true);
  }, []);

  const openQuoteWithDesigner = useCallback((payload: DesignerQuotePayload) => {
    setDesignerPayload(payload);
    setInitialStep(4);
    setOpenCount((c) => c + 1);
    setIsOpen(true);
  }, []);

  const clearDesignerPayload = useCallback(() => {
    setDesignerPayload(null);
  }, []);

  const closeQuote = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQuote();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeQuote]);

  return (
    <QuoteContext.Provider
      value={{
        isOpen,
        initialStep,
        openCount,
        designerPayload,
        openQuote,
        openQuoteWithDesigner,
        closeQuote,
        clearDesignerPayload,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}
