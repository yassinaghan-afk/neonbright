"use client";

import { features } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import {
  SectionReveal,
  StaggerContainer,
  StaggerItem,
  SectionDivider,
} from "@/components/ui/SectionReveal";

export function WhyChooseUs() {
  return (
    <>
      <SectionDivider />
      <section id="services" className="relative section-glow-bottom py-28 sm:py-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/[0.04] to-transparent" />

        <Container className="relative">
          <SectionReveal className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-purple">
              Why Neon Bright
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Built For{" "}
              <span className="neon-text-gradient">Enterprise Scale</span>
            </h2>
            <p className="mt-5 text-lg text-muted">
              Commercial-grade LED neon engineered for high-traffic environments,
              multi-location rollouts, and lasting brand impact.
            </p>
          </SectionReveal>

          <StaggerContainer className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
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
