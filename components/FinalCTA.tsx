"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionReveal } from "@/components/ui/SectionReveal";

const trustPoints = [
  "Free design mockup",
  "24-hour response",
  "Commercial warranty",
  "Global shipping",
];

export function FinalCTA() {
  return (
    <section id="contact" className="py-28 sm:py-36">
      <Container>
        <SectionReveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 glass-premium">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/12 via-neon-purple/6 to-neon-blue/12" />
            <motion.div
              className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-neon-pink/25 blur-[120px]"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 7, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-neon-blue/25 blur-[120px]"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 7, repeat: Infinity, delay: 3.5 }}
            />

            <div className="relative px-6 py-20 text-center sm:px-16 sm:py-28">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-pink">
                Start Your Project
              </span>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Ready To Illuminate{" "}
                <span className="neon-text-gradient">Your Brand?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
                Join 500+ businesses worldwide. Get a free photorealistic
                mockup and commercial quote within 24 hours.
              </p>

              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button href="#contact" size="lg" className="min-w-[220px]">
                  Get Instant Quote
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
                <Button href="#contact" variant="secondary" size="lg" className="min-w-[220px]">
                  Upload Your Logo
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {trustPoints.map((point) => (
                  <span
                    key={point}
                    className="flex items-center gap-2 text-xs text-muted/70"
                  >
                    <svg className="h-3.5 w-3.5 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
