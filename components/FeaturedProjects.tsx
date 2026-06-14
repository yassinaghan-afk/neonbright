"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { projects, type Project } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import {
  SectionReveal,
  StaggerContainer,
  StaggerItem,
  SectionDivider,
} from "@/components/ui/SectionReveal";

const accentMap = {
  "neon-pink": {
    badge: "bg-neon-pink/20 text-neon-pink border-neon-pink/30",
    glow: "group-hover:shadow-[0_0_60px_rgba(255,45,149,0.18)]",
    border: "group-hover:border-neon-pink/25",
    cta: "group-hover:text-neon-pink",
    ring: "ring-neon-pink/20",
  },
  "neon-purple": {
    badge: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
    glow: "group-hover:shadow-[0_0_60px_rgba(168,85,247,0.18)]",
    border: "group-hover:border-neon-purple/25",
    cta: "group-hover:text-neon-purple",
    ring: "ring-neon-purple/20",
  },
  "neon-blue": {
    badge: "bg-neon-blue/20 text-neon-blue border-neon-blue/30",
    glow: "group-hover:shadow-[0_0_60px_rgba(56,189,248,0.18)]",
    border: "group-hover:border-neon-blue/25",
    cta: "group-hover:text-neon-blue",
    ring: "ring-neon-blue/20",
  },
};

function ProjectImage({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20 };
  const x = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);
  const y = useSpring(useTransform(mouseY, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="absolute inset-0"
        style={{ x, y }}
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ scale: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
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
          className="object-cover"
          priority={project.featured}
        />
      </motion.div>

      {/* Color tint on hover */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          project.accent === "neon-pink" && "bg-neon-pink/10",
          project.accent === "neon-purple" && "bg-neon-purple/10",
          project.accent === "neon-blue" && "bg-neon-blue/10",
          hovered ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const accent = accentMap[project.accent];
  const location = `${project.city}, ${project.country}`;

  return (
    <motion.article
      className={cn(
        "group card-shine relative overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated transition-all duration-500",
        accent.border,
        accent.glow
      )}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Image area */}
      <div
        className={cn(
          "relative overflow-hidden",
          project.featured ? "aspect-[21/9] sm:aspect-[2.4/1]" : "aspect-[4/3] sm:aspect-[16/10]"
        )}
      >
        <ProjectImage project={project} />

        {/* Layered overlays */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black via-black/50 to-black/10" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_30%_80%,rgba(255,45,149,0.08)_0%,transparent_60%)]" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 z-[3] flex flex-wrap gap-2 sm:top-5 sm:left-5">
          <span
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-xl",
              accent.badge
            )}
          >
            {project.industry}
          </span>
          <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-xl">
            {location}
          </span>
        </div>

        {/* Installation size badge */}
        <div className="absolute top-4 right-4 z-[3] sm:top-5 sm:right-5">
          <span className="rounded-full glass-premium px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white/90">
            {project.installationSize}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 z-[3] p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <h3
                className={cn(
                  "font-display font-bold tracking-tight text-white",
                  project.featured
                    ? "text-2xl sm:text-4xl"
                    : "text-xl sm:text-2xl"
                )}
              >
                {project.title}
              </h3>
              <p
                className={cn(
                  "mt-2 leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/80",
                  project.featured
                    ? "max-w-2xl text-sm sm:text-base"
                    : "max-w-md text-sm line-clamp-2 sm:line-clamp-none"
                )}
              >
                {project.description}
              </p>

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Completed {project.completedDate}
                </span>
                <span className="hidden h-3 w-px bg-white/20 sm:block" />
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </span>
              </div>
            </div>

            {/* CTA */}
            <motion.span
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full glass-premium px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/70 transition-all duration-300",
                accent.cta,
                "group-hover:shadow-lg"
              )}
              whileHover={{ scale: 1.03 }}
            >
              View Project
              <svg
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function FeaturedProjects() {
  return (
    <>
      <SectionDivider />
      <section
        id="portfolio"
        className="section-glow-top section-glow-bottom py-28 sm:py-36"
      >
        <Container>
          <SectionReveal className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-pink">
              Portfolio
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Commercial Installations
            </h2>
            <p className="mt-5 text-lg text-muted">
              Six landmark projects across hospitality, retail, fitness, and
              corporate — from Casablanca to Dubai.
            </p>
          </SectionReveal>

          <StaggerContainer
            className="mt-20 grid gap-5 sm:grid-cols-2"
            staggerDelay={0.12}
          >
            {projects.map((project) => (
              <StaggerItem
                key={project.title}
                className={project.featured ? "sm:col-span-2" : ""}
              >
                <ProjectCard project={project} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Portfolio credibility strip */}
          <SectionReveal className="mt-16" delay={0.2}>
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 glass-premium px-6 py-8 sm:flex-row sm:gap-12">
              {[
                { value: "6", label: "Featured Projects" },
                { value: "45,000 sqm", label: "Largest Single Site" },
                { value: "14", label: "Max Signs Per Project" },
                { value: "12m", label: "Max Installation Width" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-xl font-bold sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </Container>
      </section>
    </>
  );
}
