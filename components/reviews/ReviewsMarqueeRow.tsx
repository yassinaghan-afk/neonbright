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
  const src = (review.thumbnailUrl ?? review.image)?.trim() ?? "";

  return (
    <button
      type="button"
      onClick={() => onSelect(review)}
      className="instagram-marquee-item group relative z-10 shrink-0 cursor-pointer border-0 bg-transparent p-0"
      aria-label="Voir la capture"
    >
      <div
        className={cn(
          "relative overflow-hidden",
          "h-[260px] w-[190px] sm:h-[300px] sm:w-[220px] md:h-[340px] md:w-[250px] lg:h-[380px] lg:w-[280px]",
          "transition-transform duration-500 ease-out",
          "group-hover:scale-[1.04]"
        )}
      >
        {src && !imageFailed ? (
          <Image
            src={src}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 640px) 190px, (max-width: 1024px) 250px, 280px"
            className="pointer-events-none object-contain"
            draggable={false}
            onError={() => onImageError(review.id)}
            {...localImageUnoptimized(src)}
          />
        ) : null}
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
