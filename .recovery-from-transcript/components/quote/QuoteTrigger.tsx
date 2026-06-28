"use client";

import { Button } from "@/components/ui/Button";
import { useQuote } from "@/components/quote/QuoteProvider";
import type { QuoteStep } from "@/lib/quote/types";

type QuoteTriggerProps = {
  children: React.ReactNode;
  step?: QuoteStep;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onTrigger?: () => void;
};

export function QuoteTrigger({
  children,
  step = 1,
  variant = "primary",
  size = "md",
  className,
  onTrigger,
}: QuoteTriggerProps) {
  const { openQuote } = useQuote();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        openQuote(step);
        onTrigger?.();
      }}
    >
      {children}
    </Button>
  );
}
