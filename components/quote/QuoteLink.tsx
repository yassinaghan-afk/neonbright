"use client";

import { useQuote } from "@/components/quote/QuoteProvider";

type QuoteLinkProps = {
  children: React.ReactNode;
  className?: string;
  step?: 1 | 2 | 3 | 4 | 5;
};

export function QuoteLink({ children, className, step = 1 }: QuoteLinkProps) {
  const { openQuote } = useQuote();

  return (
    <button
      type="button"
      onClick={() => openQuote(step)}
      className={className}
    >
      {children}
    </button>
  );
}
