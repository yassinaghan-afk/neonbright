"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { TestimonialGalleryModal } from "@/components/testimonials/TestimonialGalleryModal";
import type { EventProject } from "@/lib/events";
import { localImageUnoptimized } from "@/lib/media/local-image";

export function EventProjectGallery({ project }: { project: EventProject }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const images = useMemo(
    () => project.gallery.filter((src) => Boolean(src?.trim())),
    [project.gallery]
  );

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            aria-label={`Ouvrir ${project.title} — photo ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-transparent p-0 text-left sm:rounded-2xl"
          >
            <Image
              src={src}
              alt={`${project.title} — photo ${i + 1}`}
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
