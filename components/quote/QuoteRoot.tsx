"use client";

import dynamic from "next/dynamic";
import { QuoteProvider } from "@/components/quote/QuoteProvider";
import { WhatsAppFloatingButton } from "@/components/whatsapp/WhatsAppFloatingButton";

const QuoteModal = dynamic(
  () => import("@/components/quote/QuoteModal").then((m) => m.QuoteModal),
  { ssr: false }
);

export function QuoteRoot({ children }: { children: React.ReactNode }) {
  return (
    <QuoteProvider>
      {children}
      <QuoteModal />
      <WhatsAppFloatingButton />
    </QuoteProvider>
  );
}
