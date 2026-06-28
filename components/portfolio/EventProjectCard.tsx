"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  eventProjectHref,
  type EventProject,
} from "@/lib/events";
import { localImageUnoptimized } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

const accentMap = {
  "neon-pink": {
    glow: "group-hover:shadow-[0_0_60px_rgba(255,45,149,0.2)]",
    border: "group-hover:border-neon-pink/30",
    line: "from-neon-pink/60 via-neon-pink/20 to-transparent",
  },
  "neon-purple": {
    glow: "group-hover:shadow-[0_0_60px_rgba(168,85,247,0.2)]",
    border: "group-hover:border-neon-purple/30",
    line: "from-neon-purple/60 via-neon-purple/20 to-transparent",
  },
  "neon-blue": {
    glow: "group-hover:shadow-[0_0_60px_rgba(56,189,248,0.2)]",
    border: "group-hover:border-neon-blue/30",
    line: "from-neon-blue/60 via-neon-blue/20 to-transparent",
  },
};

type EventProjectCardProps = {
  project: EventProject;
  className?: string;
};

export function EventProjectCard({ project, className }: EventProjectCardProps) {
  const accent = accentMap[project.accent];
  const location = `${project.city}, ${project.country}`;

  return (
    <Link
      href={eventProjectHref(project.slug)}
      className={cn("group block", className)}
    >
      <motion.article
        className={cn(
          "card-shine relative overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated transition-all duration-500 sm:rounded-3xl",
          accent.border,
          accent.glow,
          project.featured && "md:col-span-2"
        )}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            project.featured
              ? "aspect-[4/3] sm:aspect-[21/9] md:aspect-[2.35/1]"
              : "aspect-[4/3] sm:aspect-[16/10]"
          )}
        >
          <Image
            src={project.image}
            alt={project.imageAlt}
            fill
            sizes={
              project.featured
                ? "(max-width: 768px) 100vw, 1280px"
                : "(max-width: 768px) 100vw, 640px"
            }
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            {...localImageUnoptimized(project.image)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r",
              accent.line
            )}
          />

          <div className="absolute top-3 right-3 z-[2] sm:top-5 sm:right-5">
            <span className="rounded-full glass-premium px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white/90 sm:text-[11px]">
              {project.year}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-[2] p-4 sm:p-6 md:p-8">
            <h3
              className={cn(
                "font-display font-bold tracking-tight text-white",
                project.featured
                  ? "text-xl sm:text-3xl md:text-4xl"
                  : "text-lg sm:text-2xl"
              )}
            >
              {project.title}
            </h3>
            <p
              className={cn(
                "mt-2 leading-relaxed text-white/65 transition-colors group-hover:text-white/85",
                project.featured
                  ? "max-w-2xl text-sm sm:text-base"
                  : "max-w-md text-sm line-clamp-2 sm:line-clamp-none"
              )}
            >
              {project.shortDescription}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45 sm:mt-4 sm:gap-x-4 sm:text-xs">
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {location}
              </span>
              <span className="hidden h-3 w-px bg-white/20 sm:block" />
              <span>{project.client}</span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
