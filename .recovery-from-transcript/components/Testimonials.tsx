"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { testimonials as staticTestimonials, sectionCopy as staticCopy } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionReveal } from "@/components/ui/SectionReveal";
import type { CMSTestimonial } from "@/lib/cms/types";

type TestimonialsCopy = {
  title: string;
  headline: string;
};

type TestimonialsProps = {
  items?: CMSTestimonial[];
  copy?: TestimonialsCopy;
};

export function Testimonials({ items, copy }: TestimonialsProps) {
  const [active, setActive] = useState(0);

  const testimonialItems: import("@/lib/cms/types").CMSTestimonial[] = items ?? staticTestimonials.map((t, i) => ({
    id: String(i),
    quote: t.quote,
    author: t.author,
    role: t.role,
    location: t.location,
  }));

  const sectionsCopy = copy ?? staticCopy.testimonials;

  return (
    <section className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink/[0.02] to-transparent" />

      <Container className="relative">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-neon-pink">
            {sectionsCopy.title}
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {sectionsCopy.headline}
          </h2>
        </SectionReveal>

        <SectionReveal className="mt-16" delay={0.1}>
          <div className="relative mx-auto max-w-3xl">
            <div className="rounded-2xl border border-white/10 glass-premium p-8 sm:p-12 shadow-[0_16px_48px_rgba(0,0,0,0.3)]">
              <svg
                className="mb-6 h-8 w-8 text-neon-pink/40"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-lg leading-relaxed sm:text-xl">
                    &ldquo;{testimonialItems[active]?.quote}&rdquo;
                  </p>
                  <div className="mt-8 flex items-center gap-4">
                    {testimonialItems[active]?.photo ? (
                      <img
                        src={testimonialItems[active].photo}
                        alt={testimonialItems[active].author}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-purple font-display text-lg font-bold">
                        {testimonialItems[active]?.author.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{testimonialItems[active]?.author}</p>
                      <p className="text-sm text-muted">
                        {testimonialItems[active]?.role}
                      </p>
                      <p className="text-xs text-muted/70">
                        {testimonialItems[active]?.location}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              {testimonialItems.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Témoignage ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-8 bg-neon-pink"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
