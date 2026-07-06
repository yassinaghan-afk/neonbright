"use client";

import Image from "next/image";
import { useState } from "react";
import type { CMSTestimonial } from "@/lib/cms/types";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { TestimonialAudioPlayer } from "@/components/testimonials/TestimonialAudioPlayer";
import { TestimonialGalleryModal } from "@/components/testimonials/TestimonialGalleryModal";
import { TestimonialVideoModal } from "@/components/testimonials/TestimonialVideoModal";

type Props = {
  testimonial: CMSTestimonial;
};

export function TestimonialMedia({ testimonial }: Props) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const images = testimonial.galleryImages ?? [];
  const videos = testimonial.videos ?? [];
  const audioFiles = testimonial.audioFiles ?? [];

  if (!images.length && !videos.length && !audioFiles.length) return null;

  return (
    <>
      <div className="mt-8 space-y-4 border-t border-white/10 pt-8">
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setGalleryIndex(idx)}
                className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black transition-opacity hover:opacity-90"
                aria-label={`Ouvrir l'image ${idx + 1}`}
              >
                <Image
                  src={src}
                  alt={`Galerie ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                  loading="lazy"
                  {...localImageUnoptimized(src)}
                />
              </button>
            ))}
          </div>
        )}

        {videos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {videos.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveVideo(src)}
                className="group relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black"
                aria-label={`Lire la vidéo ${idx + 1}`}
              >
                <video
                  src={src}
                  muted
                  playsInline
                  preload="none"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neon-pink/90 text-white shadow-lg">
                    <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {audioFiles.length > 0 && (
          <div className="space-y-2">
            {audioFiles.map((src, idx) => (
              <TestimonialAudioPlayer key={`${src}-${idx}`} src={src} />
            ))}
          </div>
        )}
      </div>

      <TestimonialGalleryModal
        images={images}
        activeIndex={galleryIndex}
        onNavigate={setGalleryIndex}
        onClose={() => setGalleryIndex(null)}
      />
      <TestimonialVideoModal videoUrl={activeVideo} onClose={() => setActiveVideo(null)} />
    </>
  );
}
