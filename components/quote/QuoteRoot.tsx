"use client";

import { QuoteProvider } from "@/components/quote/QuoteProvider";
import { QuoteModal } from "@/components/quote/QuoteModal";
import { WhatsAppFloatingButton } from "@/components/whatsapp/WhatsAppFloatingButton";

export function QuoteRoot({ children }: { children: React.ReactNode }) {
  return (
    <QuoteProvider>
      {children}
      <QuoteModal />
      <WhatsAppFloatingButton />
    </QuoteProvider>
  );
}
