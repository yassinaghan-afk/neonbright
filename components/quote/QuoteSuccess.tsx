"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { WhatsAppLink, WhatsAppIcon } from "@/components/whatsapp/WhatsAppLink";

type QuoteSuccessProps = {
  reference?: string;
  whatsappUrl?: string;
  onReset: () => void;
  onClose?: () => void;
};

export function QuoteSuccess({ reference, whatsappUrl, onReset, onClose }: QuoteSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center px-6 py-16 text-center sm:py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-purple/30 ring-1 ring-neon-pink/30"
      >
        <svg className="h-10 w-10 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <h3 className="mt-8 font-display text-3xl font-bold sm:text-4xl">
        Quote Request Received
      </h3>
      <p className="mt-4 max-w-md text-muted">
        Thank you for your interest in Neon Bright. Our team will review your
        project and respond with a detailed quote and design mockup within{" "}
        <span className="text-white/80">24 hours</span>.
      </p>

      {whatsappUrl && (
        <div className="mt-6 w-full max-w-sm">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-6 py-3.5 text-sm font-semibold text-[#25D366] transition-all hover:bg-[#25D366]/20"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Send via WhatsApp
          </a>
          <p className="mt-2 text-[11px] text-white/35">
            Pre-filled with your project details and asset links
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onReset} variant="secondary">
          Submit Another Request
        </Button>
        {onClose ? (
          <Button type="button" onClick={onClose} variant="ghost">
            Close
          </Button>
        ) : (
          <Button href="#portfolio" variant="ghost">
            View Our Work
          </Button>
        )}
      </div>

      {reference && (
        <p className="mt-8 text-xs text-muted/60">
          Reference: <span className="font-mono text-white/70">{reference}</span>
        </p>
      )}

      {!whatsappUrl && (
        <div className="mt-6">
          <WhatsAppLink variant="button">
            <WhatsAppIcon className="h-5 w-5" />
            Chat on WhatsApp
          </WhatsAppLink>
        </div>
      )}
    </motion.div>
  );
}
