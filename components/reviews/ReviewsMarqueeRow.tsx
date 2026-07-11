"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { CMSReview } from "@/lib/cms/types";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

type ReviewCardProps = {
  review: CMSReview;
  onSelect: (review: CMSReview) => void;
  imageFailed: boolean;
  onImageError: (id: string) => void;
};

function ReviewCard({ review, onSelect, imageFailed, onImageError }: ReviewCardProps) {
  const src = review.image?.trim() ?? "";

  return (
    <button
      type="button"
      onClick={() => onSelect(review)}
      className="instagram-marquee-item group relative z-10 shrink-0 cursor-pointer border-0 bg-transparent p-0"
      aria-label="Voir la capture"
    >
      <div
        className={cn(
          "instagram-marquee-card relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]",
          "aspect-square w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
          "transition-all duration-500 ease-out",
          "group-hover:border-neon-pink/45 group-hover:scale-[1.05]",
          "group-hover:shadow-[0_0_36px_rgba(236,72,153,0.28),0_0_64px_rgba(168,85,247,0.12),0_12px_48px_rgba(0,0,0,0.5)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-neon-pink/50"
        )}
      >
        {src && !imageFailed ? (
          <Image
            src={src}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 260px"
            className="pointer-events-none object-cover"
            draggable={false}
            onError={() => onImageError(review.id)}
            {...localImageUnoptimized(src)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.02]" aria-hidden />
        )}
      </div>
    </button>
  );
}

type Props = {
  reviews: CMSReview[];
  onSelect: (review: CMSReview) => void;
};

export function ReviewsMarqueeRow({ reviews, onSelect }: Props) {
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());

  const visibleReviews = useMemo(
    () => reviews.filter((r) => Boolean(r.image?.trim())),
    [reviews]
  );

  const trackReviews = useMemo(
    () => [...visibleReviews, ...visibleReviews],
    [visibleReviews]
  );

  if (visibleReviews.length === 0) return null;

  return (
    <div className="instagram-marquee-row relative py-3 sm:py-4" aria-label="Avis clients">
      <div className="instagram-marquee-mask overflow-hidden">
        <div className="instagram-marquee-track instagram-marquee-track--rtl flex w-max items-stretch gap-4 px-4 sm:gap-6 sm:px-6">
          {trackReviews.map((review, index) => (
            <ReviewCard
              key={`${review.id}-${index}`}
              review={review}
              onSelect={onSelect}
              imageFailed={failedIds.has(review.id)}
              onImageError={(id) => setFailedIds((prev) => new Set(prev).add(id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
