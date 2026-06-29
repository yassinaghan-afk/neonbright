"use client";

import Image from "next/image";
import { isLocalPublicAsset, isRemoteCmsAsset } from "@/lib/media/local-image";
import type { CMSInstagramMediaItem } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type MarqueeDirection = "rtl" | "ltr";

type InstagramMarqueeCardProps = {
  item: CMSInstagramMediaItem;
  variant: "post" | "reel";
};

function InstagramMarqueeCard({ item, variant }: InstagramMarqueeCardProps) {
  const href = item.url?.trim();
  const unoptimized =
    isLocalPublicAsset(item.thumbnail) || isRemoteCmsAsset(item.thumbnail);

  const inner = (
    <>
      <div
        className={cn(
          "instagram-marquee-card relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out",
          "group-hover:border-neon-pink/40 group-hover:shadow-[0_0_40px_rgba(236,72,153,0.2),0_12px_48px_rgba(0,0,0,0.5)]",
          "group-hover:scale-[1.04] group-hover:-translate-y-1",
          variant === "post"
            ? "aspect-[4/5] w-[200px] sm:w-[240px] md:w-[260px] lg:w-[280px]"
            : "aspect-[9/16] w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-white/5 transition-all duration-500 group-hover:ring-neon-purple/30" />

        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.alt || "Instagram"}
            fill
            loading="lazy"
            sizes={
              variant === "post"
                ? "(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
                : "(max-width: 640px) 140px, (max-width: 1024px) 160px, 200px"
            }
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            unoptimized={unoptimized}
            draggable={false}
          />
        ) : null}

        {variant === "reel" && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25 transition-transform duration-500 group-hover:scale-110">
              <svg className="ml-0.5 h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="line-clamp-2 text-[11px] font-medium text-white/90">
            {item.alt || "Voir sur Instagram"}
          </p>
        </div>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className="instagram-marquee-item group mx-3 shrink-0 sm:mx-4" aria-hidden>
        {inner}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="instagram-marquee-item group mx-3 block shrink-0 sm:mx-4"
      aria-label={item.alt || "Ouvrir sur Instagram"}
    >
      {inner}
    </a>
  );
}

type InstagramMarqueeRowProps = {
  items: CMSInstagramMediaItem[];
  direction: MarqueeDirection;
  variant: "post" | "reel";
  label: string;
};

export function InstagramMarqueeRow({
  items,
  direction,
  variant,
  label,
}: InstagramMarqueeRowProps) {
  if (items.length === 0) return null;

  const minCopies = items.length < 4 ? 4 : 2;
  const copies = Array.from({ length: minCopies }, () => items).flat();
  const track = [...copies, ...copies];

  return (
    <div
      className="instagram-marquee-row relative py-3 sm:py-4"
      aria-label={label}
    >
      <div className="instagram-marquee-mask overflow-hidden">
        <div
          className={cn(
            "instagram-marquee-track flex w-max items-stretch",
            direction === "rtl"
              ? "instagram-marquee-track--rtl"
              : "instagram-marquee-track--ltr"
          )}
        >
          {track.map((item, i) => (
            <InstagramMarqueeCard
              key={`${item.id}-${i}`}
              item={item}
              variant={variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
