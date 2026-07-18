"use client";

import { useMemo, useState } from "react";
import { TestimonialGalleryModal } from "@/components/testimonials/TestimonialGalleryModal";
import type { EventProject } from "@/lib/events";

export function EventProjectGallery({ project }: { project: EventProject }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const images = useMemo(
    () => project.gallery.filter((src) => Boolean(src?.trim())),
    [project.gallery]
  );

  if (images.length === 0) return null;

  return (
    <>
      {/* CSS columns masonry — each image renders at its natural aspect ratio */}
      <div className="mt-10 columns-1 gap-3 sm:columns-2 sm:gap-4 lg:columns-3">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            aria-label={`Ouvrir ${project.title} — photo ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className="mb-3 block w-full cursor-pointer break-inside-avoid rounded-xl border border-white/10 bg-transparent p-0 text-left sm:mb-4 sm:rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${project.title} — photo ${i + 1}`}
              loading="lazy"
              className="block h-auto w-full rounded-xl object-contain sm:rounded-2xl"
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
