"use client";

import { Container } from "@/components/ui/Container";
import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { QuoteForm } from "@/components/quote/QuoteForm";

const trustPoints = [
  "Free design mockup",
  "24-hour response",
  "Commercial warranty",
  "No commitment",
];

export function QuoteSection() {
  return (
    <>
      <SectionDivider />
      <section id="quote" className="section-glow-top py-28 sm:py-36">
        <Container>
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Left: intro */}
            <SectionReveal className="lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-pink">
                Instant Quote
              </span>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Get Your{" "}
                <span className="neon-text-gradient">Custom Quote</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Tell us about your project and receive a detailed commercial
                quote with a photorealistic mockup — typically within 24 hours.
              </p>

              <ul className="mt-8 space-y-4">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-pink/15">
                      <svg className="h-3.5 w-3.5 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-10 rounded-2xl border border-white/10 glass-premium p-5">
                <p className="text-xs uppercase tracking-wider text-muted">
                  Commercial Projects
                </p>
                <p className="mt-2 font-display text-2xl font-bold">€2M+</p>
                <p className="text-sm text-muted">
                  in delivered installations across 15+ countries
                </p>
              </div>
            </SectionReveal>

            {/* Right: form */}
            <SectionReveal className="lg:col-span-3" delay={0.1}>
              <div className="rounded-2xl border border-white/10 glass-premium p-6 sm:p-8 lg:p-10">
                <QuoteForm />
              </div>
            </SectionReveal>
          </div>
        </Container>
      </section>
    </>
  );
}
