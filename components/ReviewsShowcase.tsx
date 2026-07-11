"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { Container } from "@/components/ui/Container";
import { ReviewsMarqueeRow } from "@/components/reviews/ReviewsMarqueeRow";
import { ReviewsModal } from "@/components/reviews/ReviewsModal";
import type { CMSReview } from "@/lib/cms/types";

type Props = {
  reviews: CMSReview[];
};

/**
 * Public Reviews Gallery.
 * SSR props are the initial paint; we immediately re-fetch /api/public/homepage
 * (force-dynamic, enabled===true only) so Activate / Deactivate from Admin
 * cannot leave a stale homepage snapshot on screen.
 */
export function ReviewsShowcase({ reviews }: Props) {
  const [items, setItems] = useState<CMSReview[]>(reviews);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(reviews);
  }, [reviews]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/public/homepage", {
          cache: "no-store",
          credentials: "omit",
        });
        if (!res.ok) return;
        const data = await res.json();
        const next = Array.isArray(data?.reviews) ? data.reviews : [];
        if (!cancelled) setItems(next);
      } catch {
        // Keep SSR / last-known items on network failure.
      }
    };

    void load();

    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const visibleReviews = useMemo(
    () => items.filter((r) => r.enabled === true && Boolean(r.image?.trim())),
    [items]
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
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Reviews
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
