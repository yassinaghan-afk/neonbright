"use client";

import { useCallback, useMemo, useState } from "react";
import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { Container } from "@/components/ui/Container";
import { InstagramPostsMarqueeRow } from "@/components/instagram/InstagramMarqueeRow";
import { InstagramShowcasePostModal } from "@/components/instagram/InstagramShowcasePostModal";
import type { CMSInstagramPost } from "@/lib/cms/types";
import type { InstagramShowcaseData } from "@/lib/instagram/showcase";
import { cn } from "@/lib/utils";

const DEFAULT_PROFILE_URL =
  "https://www.instagram.com/_neonbright_?igsh=NHQxN3MzcjJhdGZ0";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

type Props = {
  data: InstagramShowcaseData;
};

export function InstagramMarqueeShowcase({ data }: Props) {
  const { settings, posts, profileUrl, isEmpty } = data;
  const [activePostIndex, setActivePostIndex] = useState<number | null>(null);

  const galleryPosts = useMemo(
    () => posts.filter((post) => post.enabled && Boolean(post.image?.trim())),
    [posts]
  );

  const title = settings.title || "Suivez-nous sur Instagram";
  const subtitle =
    settings.subtitle ||
    "Découvrez nos dernières réalisations et créations lumineuses.";
  const ctaLabel = settings.buttonText || "Voir tout sur Instagram";
  const instagramProfileUrl = profileUrl?.trim() || DEFAULT_PROFILE_URL;

  const handlePostSelect = useCallback(
    (post: CMSInstagramPost) => {
      const index = galleryPosts.findIndex((item) => item.id === post.id);
      if (index >= 0) setActivePostIndex(index);
    },
    [galleryPosts]
  );

  const closePostModal = useCallback(() => setActivePostIndex(null), []);

  const handleNavigate = useCallback(
    (index: number) => {
      if (galleryPosts.length === 0) return;
      const next = ((index % galleryPosts.length) + galleryPosts.length) % galleryPosts.length;
      setActivePostIndex(next);
    },
    [galleryPosts.length]
  );

  if (settings.enabled === false) return null;
  if (isEmpty || galleryPosts.length === 0) return null;

  return (
    <>
      <SectionDivider />
      <section
        id="instagram"
        className={cn(
          "relative overflow-hidden py-16 sm:py-20 md:py-28 lg:py-32",
          "bg-[#050505]"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(236,72,153,0.12),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-neon-pink/10 blur-[120px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-neon-purple/10 blur-[120px]"
          aria-hidden
        />

        <Container className="relative">
          <SectionReveal className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-neon-pink">
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {subtitle}
            </p>
          </SectionReveal>
        </Container>

        <div className="relative mt-12 w-full sm:mt-16">
          <InstagramPostsMarqueeRow
            posts={galleryPosts}
            onPostSelect={handlePostSelect}
            paused={activePostIndex !== null}
          />
        </div>

        <SectionReveal className="mt-12 flex justify-center sm:mt-16">
          <a
            href={instagramProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex min-w-[220px] items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-9 py-4 text-base font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-neon-purple/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neon-pink/10 via-transparent to-neon-purple/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <InstagramIcon className="relative h-4 w-4" />
            <span className="relative">{ctaLabel}</span>
          </a>
        </SectionReveal>
      </section>

      <InstagramShowcasePostModal
        posts={galleryPosts}
        activeIndex={activePostIndex}
        onNavigate={handleNavigate}
        onClose={closePostModal}
        profileUrl={instagramProfileUrl}
      />
    </>
  );
}
