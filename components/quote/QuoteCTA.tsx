"use client";

import { Container } from "@/components/ui/Container";
import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { QuoteTrigger } from "@/components/quote/QuoteTrigger";
import { WhatsAppLink, WhatsAppIcon } from "@/components/whatsapp/WhatsAppLink";

export function QuoteCTA() {
  return (
    <>
      <SectionDivider />
      <section className="py-20 sm:py-28">
        <Container>
          <SectionReveal>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 glass-premium px-6 py-14 text-center sm:px-12 sm:py-16">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/8 via-transparent to-neon-blue/8" />
              <div className="relative">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready for Your{" "}
                  <span className="neon-text-gradient">Custom Quote?</span>
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-muted">
                  Get a free photorealistic mockup and commercial quote within
                  24 hours. No page redirects — start right here.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
                  <QuoteTrigger size="lg" className="min-w-[220px]">
                    Get Instant Quote
                  </QuoteTrigger>
                  <QuoteTrigger step={2} variant="secondary" size="lg" className="min-w-[220px]">
                    Upload Your Logo
                  </QuoteTrigger>
                  <WhatsAppLink variant="button" className="min-w-[220px]">
                    <WhatsAppIcon className="h-5 w-5" />
                    WhatsApp Us
                  </WhatsAppLink>
                </div>
              </div>
            </div>
          </SectionReveal>
        </Container>
      </section>
    </>
  );
}
