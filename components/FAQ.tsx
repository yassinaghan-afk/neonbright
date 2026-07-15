"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs as staticFaqs, sectionCopy as staticCopy } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { useQuote } from "@/components/quote/QuoteProvider";
import type { CMSFAQItem } from "@/lib/cms/types";

type FAQCopy = {
  title: string;
  headline: string;
  subtitle: string;
  contactLink: string;
};

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-neon-pink"
      >
        <span className="pr-8 font-medium">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type FAQProps = {
  items?: CMSFAQItem[];
  copy?: FAQCopy;
};

export function FAQ({ items, copy }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { openQuote } = useQuote();

  const faqItems = items ?? staticFaqs.map((f, i) => ({
    id: String(i),
    question: f.question,
    answer: f.answer,
    sortOrder: i,
    enabled: true,
  }));

  const faqCopy = copy ?? staticCopy.faq;

  return (
    <section className="py-16 sm:py-24 md:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionReveal>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-neon-purple">
              {faqCopy.title}
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {faqCopy.headline}
            </h2>
            <p className="mt-4 text-muted">
              {faqCopy.subtitle}{" "}
              <button
                type="button"
                onClick={() => openQuote(1)}
                className="text-neon-pink hover:underline"
              >
                {faqCopy.contactLink}
              </button>
              .
            </p>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div>
              {faqItems.map((faq, i) => (
                <FAQItem
                  key={faq.id}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </SectionReveal>
        </div>
      </Container>
    </section>
  );
}
