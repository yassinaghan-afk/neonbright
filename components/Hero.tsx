"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { heroContent as staticHero } from "@/lib/data";
import type { CMSHeroSlide, HeroContent } from "@/lib/cms/types";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const headlineWords = ["Leader", "du", "néon", "sur", "mesure"];

type HeroProps = {
  slides?: CMSHeroSlide[];
  hero?: HeroContent;
};

export function Hero({ slides = [], hero }: HeroProps) {
  const content = hero ?? {
    badge: staticHero.badge,
    headline: staticHero.headline,
    headlineAccent: staticHero.headlineAccent,
    subheadline: staticHero.subheadline,
    primaryCta: staticHero.primaryCta,
    secondaryCta: staticHero.secondaryCta,
    backgroundImage: "",
    trustStripLabel: staticHero.trustLabel,
    trustBlock: {
      enabled: true,
      value: "200+",
      label: "Clients satisfaits",
      sublabel: "Au Maroc et à l'international",
    },
  };

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Scroll-based parallax only — starts at opacity 1 (no entrance hide).
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="noise-overlay relative flex min-h-[600px] sm:min-h-[700px] md:min-h-screen items-center overflow-hidden pt-28 pb-20"
    >
      <HeroSlideshow slides={slides} />

      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-neon-pink/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-neon-purple/8 blur-[100px]" />
      </div>

      <Container className="relative z-10">
        <motion.div className="max-w-3xl" style={{ y, opacity }}>
          <h1 className="display-headline">
            <span className="block">
              {headlineWords.map((word) => (
                <span
                  key={word}
                  className="mr-[0.2em] inline-block text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]"
                >
                  {word}
                </span>
              ))}
            </span>
            <span className="mt-1 block text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] neon-text-gradient">
              {content.headlineAccent}
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/75 sm:text-xl">
            {content.subheadline}
          </p>

          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <Button href="/designer" size="lg" className="w-full sm:w-auto">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {content.primaryCta}
            </Button>
            <Button href="/designer?mode=enseigne" variant="secondary" size="lg" className="w-full sm:w-auto">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {content.secondaryCta}
            </Button>
          </div>

          {content.trustBlock.enabled && (
            <div className="mt-14 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4 sm:gap-8">
              <div className="col-span-2 text-center sm:col-span-4">
                <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {content.trustBlock.value}
                </p>
                <p className="mt-1 text-xs text-white/75 sm:text-sm">
                  {content.trustBlock.label}
                </p>
                <p className="mt-1 text-xs text-white/55 sm:text-sm">
                  {content.trustBlock.sublabel}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
