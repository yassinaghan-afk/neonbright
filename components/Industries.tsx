"use client";

import { motion } from "framer-motion";
import { industries } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import {
  SectionReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/SectionReveal";

export function Industries() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <Container>
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-neon-blue">
            Industries
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Industries We Serve
          </h2>
          <p className="mt-4 text-muted">
            From boutique storefronts to corporate headquarters — we illuminate
            spaces across every sector.
          </p>
        </SectionReveal>

        <StaggerContainer className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {industries.map((industry) => (
            <StaggerItem key={industry.name}>
              <motion.div
                className="group flex flex-col items-center rounded-2xl border border-white/10 bg-surface-elevated/30 p-6 text-center transition-all duration-500 hover:border-neon-blue/30 hover:bg-surface-elevated"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-3xl transition-transform duration-300 group-hover:scale-110">
                  {industry.icon}
                </span>
                <p className="mt-3 text-sm font-medium leading-snug">
                  {industry.name}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </section>
  );
}
