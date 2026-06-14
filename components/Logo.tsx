import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_LOGO } from "@/lib/brand";

/**
 * Responsive height classes per context.
 * mix-blend-mode:screen on the <img> makes all dark logo pixels dissolve into
 * the dark navbar/footer background — eliminating any "pasted image" box effect.
 * Only the luminous neon colors remain visible.
 */
const VARIANTS = {
  /** Main navbar — mobile 44px, tablet 54px, desktop 62px */
  nav: "h-[44px] md:h-[54px] lg:h-[62px]",
  /** Mobile fullscreen menu */
  menu: "h-[56px] sm:h-[64px]",
  /** Footer brand column */
  footer: "h-[48px] md:h-[54px] lg:h-[60px]",
  /** Compact app headers (designer, admin sidebar) */
  compact: "h-[40px] sm:h-[44px] md:h-[48px]",
  /** Login / hero brand mark */
  display: "h-[60px] sm:h-[68px] md:h-[76px]",
} as const;

const MAX_HEIGHT: Record<keyof typeof VARIANTS, number> = {
  nav: 62,
  menu: 64,
  footer: 60,
  compact: 48,
  display: 76,
};

type LogoVariant = keyof typeof VARIANTS;

type LogoProps = {
  href?: string | null;
  variant?: LogoVariant;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  /** Disable the neon glow (e.g. on light backgrounds) */
  glow?: boolean;
  onClick?: () => void;
};

export function Logo({
  href = "/",
  variant = "nav",
  className,
  imageClassName,
  priority = false,
  glow = true,
  onClick,
}: LogoProps) {
  const maxH = MAX_HEIGHT[variant];
  // Keep 823:251 aspect ratio (processed logo dimensions)
  const maxW = Math.round(maxH * (BRAND_LOGO.width / BRAND_LOGO.height));

  const image = (
    <Image
      src={BRAND_LOGO.src}
      alt={BRAND_LOGO.alt}
      width={maxW}
      height={maxH}
      priority={priority}
      /*
       * sizes: tell browser which src to download at each viewport.
       * Values derived from actual rendered heights × aspect ratio.
       */
      sizes={[
        `(min-width: 1024px) ${maxW}px`,
        `(min-width: 768px) ${Math.round(maxH * 0.87 * (BRAND_LOGO.width / BRAND_LOGO.height))}px`,
        `${Math.round(maxH * 0.71 * (BRAND_LOGO.width / BRAND_LOGO.height))}px`,
      ].join(", ")}
      className={cn(
        // Sizing — responsive height, auto-width, no stretch
        "w-auto max-w-none object-contain",
        VARIANTS[variant],
        /*
         * mix-blend-mode: screen
         * Mathematically dissolves all dark (near-black) pixels into the
         * dark background — only bright neon colors remain visible.
         * This eliminates any rectangle/box halo effect completely.
         */
        "mix-blend-screen",
        // Subtle neon glow — pink outer, cyan inner
        glow && "drop-shadow-[0_0_8px_rgba(255,20,180,0.55)] drop-shadow-[0_0_18px_rgba(255,20,180,0.25)] drop-shadow-[0_0_32px_rgba(0,255,255,0.10)]",
        imageClassName
      )}
      style={{ mixBlendMode: "screen" }}
    />
  );

  const wrapperClass = cn(
    "inline-flex shrink-0 items-center leading-none select-none",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={wrapperClass}
        aria-label={BRAND_LOGO.alt}
        onClick={onClick}
      >
        {image}
      </Link>
    );
  }

  return <span className={wrapperClass}>{image}</span>;
}
