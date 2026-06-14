"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { QUOTE_STEPS } from "@/lib/quote/constants";
import type { QuoteStep } from "@/lib/quote/types";

type QuoteProgressProps = {
  currentStep: QuoteStep;
};

export function QuoteProgress({ currentStep }: QuoteProgressProps) {
  return (
    <div className="mb-10">
      {/* Mobile: compact bar */}
      <div className="mb-4 sm:hidden">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            Step {currentStep} of {QUOTE_STEPS.length}
          </span>
          <span>{QUOTE_STEPS[currentStep - 1].label}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue"
            animate={{ width: `${(currentStep / QUOTE_STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Desktop: step indicators */}
      <div className="hidden sm:flex items-center gap-1">
        {QUOTE_STEPS.map((step, i) => {
          const stepNum = step.id as QuoteStep;
          const isComplete = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                    isComplete &&
                      "border-neon-pink bg-neon-pink/20 text-neon-pink",
                    isActive &&
                      "border-neon-purple bg-neon-purple/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]",
                    !isComplete &&
                      !isActive &&
                      "border-white/15 bg-white/5 text-muted"
                  )}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      isActive ? "text-white" : "text-muted"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted/60 hidden md:block">{step.description}</p>
                </div>
              </div>
              {i < QUOTE_STEPS.length - 1 && (
                <div className="mx-2 mb-5 h-px flex-1 bg-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neon-pink to-neon-purple"
                    initial={{ width: "0%" }}
                    animate={{
                      width: currentStep > stepNum ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
