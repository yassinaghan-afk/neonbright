"use client";

import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { Container } from "@/components/ui/Container";
import { InstagramMarqueeRow } from "@/components/instagram/InstagramMarqueeRow";
import type { InstagramShowcaseData } from "@/lib/instagram/showcase";
import { cn } from "@/lib/utils";

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
  const { settings, posts, reels, profileUrl } = data;

  if (!settings.enabled) return null;
  if (posts.length === 0 && reels.length === 0) return null;

  const title = settings.title || "Suivez-nous sur Instagram";
  const subtitle =
    settings.subtitle ||
    "Découvrez nos dernières réalisations et créations lumineuses.";

  return (
    <>
      <SectionDivider />
      <section
        id="instagram"
        className={cn(
          "relative overflow-hidden py-20 sm:py-28 lg:py-32",
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

        <div className="relative mt-12 space-y-2 sm:mt-16 sm:space-y-4">
          {posts.length > 0 && (
            <InstagramMarqueeRow
              items={posts}
              direction="rtl"
              variant="post"
              label="Instagram Posts"
            />
          )}
          {reels.length > 0 && (
            <InstagramMarqueeRow
              items={reels}
              direction="ltr"
              variant="reel"
              label="Instagram Reels"
            />
          )}
        </div>

        {profileUrl ? (
          <SectionReveal className="mt-12 flex justify-center sm:mt-16">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex min-w-[220px] items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-9 py-4 text-base font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-neon-purple/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] active:scale-[0.98]"
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neon-pink/10 via-transparent to-neon-purple/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <InstagramIcon className="relative h-4 w-4" />
              <span className="relative">{settings.buttonText || "Voir sur Instagram"}</span>
            </a>
          </SectionReveal>
        ) : null}
      </section>
    </>
  );
}
