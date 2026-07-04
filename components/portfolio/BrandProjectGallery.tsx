"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { TestimonialGalleryModal } from "@/components/testimonials/TestimonialGalleryModal";
import { localImageUnoptimized } from "@/lib/media/local-image";

type BrandProjectGalleryProps = {
  name: string;
  gallery: string[];
};

export function BrandProjectGallery({ name, gallery }: BrandProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const images = useMemo(
    () => gallery.filter((src) => Boolean(src?.trim())),
    [gallery]
  );

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            aria-label={`Ouvrir ${name} — photo ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-transparent p-0 text-left sm:rounded-2xl"
          >
            <Image
              src={src}
              alt={`${name} — photo ${i + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="pointer-events-none object-cover"
              {...localImageUnoptimized(src)}
            />
          </button>
        ))}
      </div>

      <TestimonialGalleryModal
        images={images}
        activeIndex={activeIndex}
        onNavigate={setActiveIndex}
        onClose={() => setActiveIndex(null)}
      />
    </>
  );
}
