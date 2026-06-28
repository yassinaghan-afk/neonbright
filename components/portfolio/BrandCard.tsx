"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { brandHref, type ResolvedBrand } from "@/lib/brands/types";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

type BrandCardProps = {
  brand: ResolvedBrand;
  className?: string;
};

export function BrandCard({ brand, className }: BrandCardProps) {
  const location = `${brand.city}, ${brand.country}`;

  return (
    <Link href={brandHref(brand.slug)} className={cn("group block", className)}>
      <motion.article
        className="card-shine overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated transition-all duration-500 group-hover:border-neon-purple/30 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.18)] sm:rounded-3xl"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="partner-white-strip flex h-32 items-center justify-center px-8 sm:h-36">
          <Image
            src={brand.logoSrc}
            alt={`Logo ${brand.name}`}
            width={220}
            height={80}
            className="max-h-14 w-auto max-w-[180px] object-contain object-center sm:max-h-16 sm:max-w-[200px]"
            sizes="200px"
            {...localImageUnoptimized(brand.logoSrc)}
          />
        </div>

        <div className="border-t border-white/10 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neon-purple">
                {brand.typeLabel}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                {brand.name}
              </h3>
            </div>
            <span className="shrink-0 rounded-full glass-premium px-3 py-1 text-[10px] font-semibold text-white/80">
              {brand.projectCount} projet{brand.projectCount > 1 ? "s" : ""}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-white/55 line-clamp-2 group-hover:text-white/70">
            {brand.description}
          </p>

          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-white/40">
            <span>{location}</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-white/60 transition-colors group-hover:text-neon-pink">
              Voir
              <svg
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
