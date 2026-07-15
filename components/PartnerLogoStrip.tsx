"use client";

import Image from "next/image";
import type { PartnerLogo } from "@/lib/cms/logo-media";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

type PartnerLogoStripProps = {
  logos: PartnerLogo[];
  label?: string;
  className?: string;
};

function LogoItem({ logo }: { logo: PartnerLogo }) {
  return (
    <div
      className="partner-logo-slot mx-8 flex shrink-0 items-center justify-center sm:mx-12 lg:mx-16"
      aria-hidden="true"
    >
      <Image
        src={logo.src}
        alt=""
        width={280}
        height={70}
        loading="lazy"
        sizes="(max-width: 640px) 140px, (max-width: 1024px) 200px, 240px"
        className="partner-strip-logo"
        draggable={false}
        {...localImageUnoptimized(logo.src)}
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

  const track = [...logos, ...logos];
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
        <div className="partner-marquee-mask overflow-hidden py-6 sm:py-8 md:py-10 lg:py-12">
          <div className="partner-marquee-track flex w-max items-center">
            {track.map((logo, i) => (
              <LogoItem key={`${logo.id}-${i}`} logo={logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
