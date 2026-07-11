"use client";

import { useCallback, useMemo, useState } from "react";
import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { Container } from "@/components/ui/Container";
import { ReviewsMarqueeRow } from "@/components/reviews/ReviewsMarqueeRow";
import { ReviewsModal } from "@/components/reviews/ReviewsModal";
import type { CMSReview } from "@/lib/cms/types";

type Props = {
  reviews: CMSReview[];
};

export function ReviewsShowcase({ reviews }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visibleReviews = useMemo(
    () => reviews.filter((r) => r.enabled && Boolean(r.image?.trim())),
    [reviews]
  );

  const handleSelect = useCallback(
    (review: CMSReview) => {
      const index = visibleReviews.findIndex((r) => r.id === review.id);
      if (index >= 0) setActiveIndex(index);
    },
    [visibleReviews]
  );

  const handleClose = useCallback(() => setActiveIndex(null), []);

  const handleNavigate = useCallback(
    (index: number) => {
      if (!visibleReviews.length) return;
      setActiveIndex(
        ((index % visibleReviews.length) + visibleReviews.length) %
          visibleReviews.length
      );
    },
    [visibleReviews.length]
  );

  if (visibleReviews.length === 0) return null;

  return (
    <>
      <SectionDivider />
      <section
        id="reviews"
        className="relative overflow-hidden py-20 bg-[#050505] sm:py-28 lg:py-32"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,85,247,0.10),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-neon-purple/8 blur-[120px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-neon-pink/8 blur-[120px]"
          aria-hidden
        />

        <Container className="relative">
          <SectionReveal className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Ils nous font confiance
            </h2>
          </SectionReveal>
        </Container>

        <div className="relative mt-12 sm:mt-16">
          <ReviewsMarqueeRow reviews={visibleReviews} onSelect={handleSelect} />
        </div>
      </section>

      <ReviewsModal
        reviews={visibleReviews}
        activeIndex={activeIndex}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    </>
  );
}
