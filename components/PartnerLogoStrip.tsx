"use client";

import Image from "next/image";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { PartnerLogo } from "@/lib/cms/logo-media";
import { localServeDirect } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

type PartnerLogoStripProps = {
  logos: PartnerLogo[];
  label?: string;
  className?: string;
};

/**
 * Compute how many copies of the logo set are needed so the animated track
 * is always wider than 2.5× the viewport — guaranteeing no visible gap
 * at any point in the animation cycle, for any number of logos.
 *
 * N copies → animation moves -100%/N = exactly one original set width.
 */
function computeCopies(logoCount: number, viewportPx = 0, setWidthPx = 0): number {
  if (logoCount <= 0) return 0;

  if (viewportPx > 0 && setWidthPx > 0) {
    // Need track ≥ 2.5× viewport so no gap is visible during the loop.
    const minTrack = Math.max(viewportPx * 2.5, setWidthPx * 2);
    return Math.max(3, Math.ceil(minTrack / setWidthPx));
  }

  // SSR / first-paint fallback — generous default so any viewport is covered.
  // 4 copies ≥ 3 required copies as a safe static default.
  return 4;
}

function LogoItem({ logo, eager }: { logo: PartnerLogo; eager: boolean }) {
  return (
    <div
      className="partner-logo-slot mx-6 flex shrink-0 items-center justify-center sm:mx-10 lg:mx-14"
      aria-hidden="true"
    >
      <Image
        src={logo.src}
        alt=""
        width={280}
        height={70}
        /*
         * Above-fold section — must NOT be lazy.
         * The duplicate animation copies also need to be ready before they
         * scroll into view via the marquee, so we load all eagerly.
         */
        loading={eager ? "eager" : "lazy"}
        sizes="(max-width: 640px) 130px, (max-width: 1024px) 200px, 240px"
        className="partner-strip-logo"
        draggable={false}
        {...localServeDirect(logo.src)}
      />
    </div>
  );
}

export function PartnerLogoStrip({
  logos,
  label = "Ils nous font confiance",
  className,
}: PartnerLogoStripProps) {
  if (logos.length === 0) return null;

  const title = label.toUpperCase();

  return (
    <section
      className={cn("relative bg-[#050505]", className)}
      aria-label={label}
    >
      <div className="px-4 py-6 sm:py-10 md:py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
          {title}
        </p>
      </div>

      <div className="partner-white-strip">
        <PartnerMarqueeTrack logos={logos} />
      </div>
    </section>
  );
}

function PartnerMarqueeTrack({ logos }: { logos: PartnerLogo[] }) {
  const maskRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(() => computeCopies(logos.length));

  useLayoutEffect(() => {
    const mask = maskRef.current;
    const measure = measureRef.current;
    if (!mask || !measure) return;

    const update = () => {
      const viewportPx = mask.clientWidth;
      const setWidthPx = measure.scrollWidth;
      if (setWidthPx === 0) return;
      const next = computeCopies(logos.length, viewportPx, setWidthPx);
      setCopies((prev) => (prev === next ? prev : next));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(mask);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [logos]);

  const track = useMemo(() => {
    const out: PartnerLogo[] = [];
    for (let i = 0; i < copies; i++) out.push(...logos);
    return out;
  }, [logos, copies]);

  return (
    <div
      ref={maskRef}
      className="partner-marquee-mask overflow-hidden py-6 sm:py-8 md:py-10 lg:py-12"
      style={{ "--partner-copies": String(copies) } as CSSProperties}
    >
      {/* Hidden single-set measurer — off-screen, zero impact on layout */}
      <div
        ref={measureRef}
        className="pointer-events-none absolute -left-[9999px] top-0 flex w-max items-center opacity-0"
        aria-hidden
      >
        {logos.map((logo) => (
          <div
            key={`measure-${logo.id}`}
            className="mx-6 shrink-0 sm:mx-10 lg:mx-14"
            style={{ width: 130, height: 50 }}
          />
        ))}
      </div>

      <div className="partner-marquee-track flex w-max items-center">
        {track.map((logo, i) => (
          <LogoItem
            key={`${logo.id}-${i}`}
            logo={logo}
            eager={i < logos.length * 2} // First 2 sets always eager
          />
        ))}
      </div>
    </div>
  );
}
