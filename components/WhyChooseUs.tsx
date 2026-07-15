"use client";

import { features as staticFeatures, sectionCopy as staticCopy } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import {
  SectionReveal,
  StaggerContainer,
  StaggerItem,
  SectionDivider,
} from "@/components/ui/SectionReveal";
import type { CMSFeature } from "@/lib/cms/types";

type ServicesCopy = {
  title: string;
  headline: string;
  subtitle: string;
};

type WhyChooseUsProps = {
  items?: CMSFeature[];
  copy?: ServicesCopy;
};

export function WhyChooseUs({ items, copy }: WhyChooseUsProps) {
  const featureItems = items ?? staticFeatures.map((f, i) => ({
    id: String(i),
    title: f.title,
    description: f.description,
    icon: f.icon,
    sortOrder: i,
    enabled: true,
  }));

  const sectionsCopy = copy ?? staticCopy.services;

  return (
    <>
      <SectionDivider />
      <section id="services" className="relative section-glow-bottom py-16 sm:py-28 md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/[0.04] to-transparent" />

        <Container className="relative">
          <SectionReveal className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-purple">
              {sectionsCopy.title}
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {sectionsCopy.headline}
            </h2>
            <p className="mt-5 text-lg text-muted">
              {sectionsCopy.subtitle}
            </p>
          </SectionReveal>

          <StaggerContainer className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
            {featureItems.map((feature) => (
              <StaggerItem key={feature.id}>
                <div className="group h-full rounded-2xl border border-white/10 glass-premium p-7 transition-all duration-500 hover:border-neon-purple/25 hover:shadow-[0_8px_40px_rgba(168,85,247,0.08)]">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neon-pink/25 to-neon-purple/25 text-lg transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </span>
                  <h3 className="mt-6 font-display text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>
    </>
  );
}
