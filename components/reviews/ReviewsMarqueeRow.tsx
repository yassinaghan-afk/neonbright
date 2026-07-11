"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { CMSReview } from "@/lib/cms/types";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

function StarsMini({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} sur 5`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={cn("h-3 w-3", n <= rating ? "text-amber-400" : "text-white/20")}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

type ReviewCardProps = {
  review: CMSReview;
  onSelect: (review: CMSReview) => void;
  imageFailed: boolean;
  onImageError: (id: string) => void;
};

function ReviewCard({ review, onSelect, imageFailed, onImageError }: ReviewCardProps) {
  const src = review.screenshots[0] ?? "";

  return (
    <button
      type="button"
      onClick={() => onSelect(review)}
      className="instagram-marquee-item group relative z-10 shrink-0 cursor-pointer border-0 bg-transparent p-0"
      aria-label={`Avis de ${review.company}`}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]",
          "w-[200px] sm:w-[220px] md:w-[240px]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
          "transition-all duration-500 ease-out",
          "group-hover:border-neon-pink/45 group-hover:scale-[1.05]",
          "group-hover:shadow-[0_0_36px_rgba(236,72,153,0.28),0_0_64px_rgba(168,85,247,0.12),0_12px_48px_rgba(0,0,0,0.5)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-neon-pink/50"
        )}
      >
        {/* Screenshot */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.02]">
              <svg
                className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
          {review.screenshots.length > 1 && (
            <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70 backdrop-blur">
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="2" y="5" width="14" height="14" rx="2" />
                <path d="M8 3h12a2 2 0 0 1 2 2v12" />
              </svg>
              {review.screenshots.length}
            </span>
          )}
        </div>

        {/* Info bar */}
        <div className="px-3 py-2.5">
          <StarsMini rating={review.rating} />
          <p className="mt-1.5 truncate text-xs font-semibold text-white/90">
            {review.company}
          </p>
          {review.reviewer && (
            <p className="truncate text-[10px] text-white/45">{review.reviewer}</p>
          )}
        </div>
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
    () => reviews.filter((r) => r.screenshots.length > 0),
    [reviews]
  );

  const trackReviews = useMemo(
    () => [...visibleReviews, ...visibleReviews],
    [visibleReviews]
  );

  const handleImageError = (id: string) => {
    setFailedIds((prev) => new Set(prev).add(id));
  };

  if (visibleReviews.length === 0) return null;

  return (
    <div
      className="instagram-marquee-row relative py-3 sm:py-4"
      aria-label="Avis clients"
    >
      <div className="instagram-marquee-mask overflow-hidden">
        <div className="instagram-marquee-track instagram-marquee-track--rtl flex w-max items-stretch gap-4 px-4 sm:gap-6 sm:px-6">
          {trackReviews.map((review, index) => (
            <ReviewCard
              key={`${review.id}-${index}`}
              review={review}
              onSelect={onSelect}
              imageFailed={failedIds.has(review.id)}
              onImageError={handleImageError}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
