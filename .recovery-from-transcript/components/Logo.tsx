import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_LOGO_DIMENSIONS, BRAND_LOGO_WIDE, BRAND_NAME } from "@/lib/brand";

const HEIGHTS: Record<LogoVariant, { h: number; cls: string }> = {
  nav: { h: 40, cls: "h-[40px] sm:h-[44px]" },
  menu: { h: 48, cls: "h-[48px] sm:h-[52px]" },
  footer: { h: 40, cls: "h-[40px] sm:h-[44px]" },
  compact: { h: 32, cls: "h-[32px] sm:h-[36px]" },
  display: { h: 56, cls: "h-[56px] sm:h-[64px]" },
};

type LogoVariant = "nav" | "menu" | "footer" | "compact" | "display";

type LogoProps = {
  href?: string | null;
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

function LogoImage({
  variant,
  className,
  priority = false,
}: {
  variant: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const { h, cls } = HEIGHTS[variant];
  const aspect = BRAND_LOGO_DIMENSIONS.width / BRAND_LOGO_DIMENSIONS.height;
  const w = Math.round(h * aspect);
  const w2x = w * 2;
  const h2x = h * 2;

  return (
    <Image
      src={BRAND_LOGO_WIDE}
      alt={BRAND_NAME}
      width={w2x}
      height={h2x}
      priority={priority}
      className={cn("w-auto max-w-none object-contain object-left", cls, className)}
      style={{ width: w, height: h }}
      sizes={`${w}px`}
      unoptimized={false}
    />
  );
}

export function Logo({
  href = "/",
  variant = "nav",
  className,
  priority = variant === "nav",
  onClick,
}: LogoProps) {
  const img = (
    <LogoImage variant={variant} className={className} priority={priority} />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center leading-none select-none"
        aria-label={BRAND_NAME}
        onClick={onClick}
      >
        {img}
      </Link>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center leading-none select-none">
      {img}
    </span>
  );
}
