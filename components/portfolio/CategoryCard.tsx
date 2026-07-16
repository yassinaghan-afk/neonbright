"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { PortfolioCategory } from "@/lib/portfolio/types";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

type CategoryCardProps = {
  category: PortfolioCategory;
  className?: string;
  priority?: boolean;
};

export function CategoryCard({ category, className, priority = false }: CategoryCardProps) {
  return (
    <Link href={category.href} className={cn("group block", className)}>
      <motion.article
        className="card-shine relative overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_80px_rgba(255,45,149,0.12)] sm:rounded-3xl"
        whileHover={{ y: -3 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[21/9] md:aspect-[2.4/1]">
          {category.coverImage ? (
            <Image
              src={category.coverImage}
              alt={category.coverAlt}
              fill
              sizes="(max-width: 768px) 100vw, 1280px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              priority={priority}
              loading={priority ? undefined : "lazy"}
              {...localImageUnoptimized(category.coverImage)}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16 lg:px-20">
            <div className="flex w-full flex-col gap-7 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="max-w-2xl">
                <h3 className="display-headline text-[1.75rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.75rem]">
                  <span className="block text-white">{category.title}</span>
                  <span className="mt-1 block neon-text-gradient sm:mt-1.5">
                    {category.titleAccent}
                  </span>
                </h3>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                  {category.description}
                </p>
                <div className="mt-7">
                  <span className="inline-flex w-fit shrink-0 items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-medium tracking-wide text-white/85 backdrop-blur-sm transition-all duration-300 group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white sm:px-6 sm:py-3 sm:text-sm">
                    Explorer
                    <svg
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
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
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
