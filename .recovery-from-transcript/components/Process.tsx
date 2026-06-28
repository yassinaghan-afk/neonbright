"use client";

import { processSteps as staticSteps, sectionCopy as staticCopy } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import {
  SectionReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/SectionReveal";
import type { CMSProcessStep } from "@/lib/cms/types";

type ProcessCopy = {
  title: string;
  headline: string;
  subtitle: string;
};

type ProcessProps = {
  steps?: CMSProcessStep[];
  copy?: ProcessCopy;
};

export function Process({ steps, copy }: ProcessProps) {
  const processSteps = steps ?? staticSteps.map((s, i) => ({
    id: String(i),
    step: s.step,
    title: s.title,
    description: s.description,
    sortOrder: i,
  }));

  const sectionsCopy = copy ?? staticCopy.process;

  return (
    <section id="process" className="py-24 sm:py-32">
      <Container>
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-neon-blue">
            {sectionsCopy.title}
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {sectionsCopy.headline}
          </h2>
          <p className="mt-4 text-muted">
            {sectionsCopy.subtitle}
          </p>
        </SectionReveal>

        <StaggerContainer className="relative mt-16">
          {/* Connection line — desktop */}
          <div className="absolute top-12 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-neon-purple/30 to-transparent lg:block" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <StaggerItem key={step.id}>
                <div className="group relative text-center lg:text-left">
                  <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center lg:mx-0">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 transition-all duration-500 group-hover:from-neon-pink/20 group-hover:to-neon-purple/20" />
                    <span className="relative font-display text-3xl font-bold neon-text-gradient">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                  {i < processSteps.length - 1 && (
                    <div className="mx-auto mt-6 h-8 w-px bg-gradient-to-b from-neon-purple/30 to-transparent lg:hidden" />
                  )}
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </Container>
    </section>
  );
}
