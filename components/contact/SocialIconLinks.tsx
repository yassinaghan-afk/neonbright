"use client";

import { cn } from "@/lib/utils";
import { useContactSocialOptional } from "@/components/contact/ContactSocialProvider";

type SocialIconLinksProps = {
  className?: string;
  iconClassName?: string;
  /** Override CMS values (e.g. server-rendered Footer). */
  instagramUrl?: string;
  facebookUrl?: string;
};

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

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const linkClass =
  "text-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/50 rounded";

export function SocialIconLinks({
  className,
  iconClassName = "h-5 w-5",
  instagramUrl: instagramOverride,
  facebookUrl: facebookOverride,
}: SocialIconLinksProps) {
  const cms = useContactSocialOptional();
  const instagramUrl = instagramOverride ?? cms?.instagramUrl ?? "";
  const facebookUrl = facebookOverride ?? cms?.facebookUrl ?? "";

  const links = [
    instagramUrl
      ? { label: "Instagram", href: instagramUrl, Icon: InstagramIcon }
      : null,
    facebookUrl
      ? { label: "Facebook", href: facebookUrl, Icon: FacebookIcon }
      : null,
  ].filter(Boolean) as {
    label: string;
    href: string;
    Icon: typeof InstagramIcon;
  }[];

  if (!links.length) return null;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={linkClass}
        >
          <Icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
