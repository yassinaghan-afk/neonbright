"use client";

import { useCallback, useMemo, useState } from "react";
import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { Container } from "@/components/ui/Container";
import { ReviewsMarqueeRow } from "@/components/reviews/ReviewsMarqueeRow";
import { ReviewsModal } from "@/components/reviews/ReviewsModal";
import type { CMSReview } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type Props = {
  reviews: CMSReview[];
};

export function ReviewsShowcase({ reviews }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visibleReviews = useMemo(
    () => reviews.filter((r) => r.enabled && r.screenshots.length > 0),
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
      const next =
        ((index % visibleReviews.length) + visibleReviews.length) %
        visibleReviews.length;
      setActiveIndex(next);
    },
    [visibleReviews.length]
  );

  if (visibleReviews.length === 0) return null;

  return (
    <>
      <SectionDivider />
      <section
        id="reviews"
        className={cn(
          "relative overflow-hidden py-20 sm:py-28 lg:py-32",
          "bg-[#050505]"
        )}
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
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-neon-pink">
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Avis Clients
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Ils nous font confiance
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Découvrez les retours de nos clients satisfaits à travers le monde.
            </p>
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
