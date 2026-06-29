"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { InstagramFeedResult } from "@/lib/instagram/types";
import {
  SectionReveal,
  SectionDivider,
} from "@/components/ui/SectionReveal";
import { Container } from "@/components/ui/Container";
import {
  ShowcaseSkeleton,
  InstagramShowcase,
} from "@/components/instagram/InstagramShowcase";
import { InstagramPostModal } from "@/components/instagram/InstagramPostModal";
import { useContactSocialOptional } from "@/components/contact/ContactSocialProvider";

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
  initialFeed: InstagramFeedResult;
  profileUrl?: string;
};

export function InstagramFeed({ initialFeed, profileUrl: profileUrlProp }: Props) {
  const cms = useContactSocialOptional();
  const profileUrl = profileUrlProp ?? cms?.instagramUrl ?? initialFeed.profileUrl ?? "";

  const hasPostsOnServer = initialFeed.posts.some((p) => p.imageUrl);

  const [feed, setFeed] = useState(initialFeed);
  const [loading, setLoading] = useState(
    initialFeed.configured && !hasPostsOnServer
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const refreshFeed = useCallback(async () => {
    if (!initialFeed.configured) return;
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch("/api/public/instagram");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as InstagramFeedResult & {
        data?: InstagramFeedResult;
      };
      const payload = "data" in data && data.data ? data.data : data;
      setFeed(payload);
      if (payload.error) setFetchError(payload.error);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Erreur de chargement Instagram"
      );
    } finally {
      setLoading(false);
    }
  }, [initialFeed.configured]);

  useEffect(() => {
    if (hasPostsOnServer || !initialFeed.configured) return;
    void refreshFeed();
  }, [hasPostsOnServer, initialFeed.configured, refreshFeed]);

  const displayPosts = feed.posts.slice(0, 10);
  const hasImages = displayPosts.some((p) => p.imageUrl);
  const apiError = fetchError ?? feed.error;

  return (
    <>
      <SectionDivider />
      <section
        id="instagram"
        className={cn("relative overflow-hidden py-24 sm:py-32", "bg-[#050505]")}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink/[0.03] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-neon-pink/8 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-neon-purple/8 blur-[100px]"
          aria-hidden
        />

        <Container className="relative">
          <SectionReveal className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-neon-pink">
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Suivez-nous sur Instagram
            </h2>
            <p className="mt-5 text-lg text-muted">
              Découvrez nos dernières réalisations et créations lumineuses.
            </p>
          </SectionReveal>

          {loading && !hasImages ? (
            <ShowcaseSkeleton />
          ) : displayPosts.length > 0 ? (
            <InstagramShowcase
              posts={displayPosts}
              onPostClick={setActiveIndex}
            />
          ) : (
            <p className="mt-14 text-center text-sm text-white/50" role="status">
              {feed.configured
                ? "Aucune publication Instagram disponible."
                : "Galerie Instagram — configuration API requise."}
            </p>
          )}

          {apiError && (
            <p
              className="mt-4 text-center text-xs text-amber-400/80"
              role="status"
            >
              {apiError}
            </p>
          )}

          {profileUrl ? (
            <SectionReveal className="mt-12 flex justify-center">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-premium relative inline-flex min-w-[200px] items-center justify-center gap-2.5 rounded-full px-9 py-4 text-base font-semibold tracking-wide text-white transition-all duration-300 hover:scale-[1.02] hover:border-neon-purple/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] active:scale-[0.98]"
              >
                <InstagramIcon className="h-4 w-4" />
                Voir Instagram
              </a>
            </SectionReveal>
          ) : null}
        </Container>
      </section>

      <InstagramPostModal
        posts={displayPosts}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </>
  );
}
