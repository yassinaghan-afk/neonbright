"use client";

import Link from "next/link";
import type { EventProject } from "@/lib/events";
import { EventProjectCard } from "@/components/portfolio/EventProjectCard";

type EventsListingProps = {
  projects: EventProject[];
};

export function EventsListing({ projects }: EventsListingProps) {
  return (
    <>
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {projects.map((project) => (
          <EventProjectCard key={project.slug} project={project} />
        ))}
      </div>

      <div className="mt-12 text-center sm:mt-16">
        <Link
          href="/#quote"
          className="text-sm text-white/45 transition-colors hover:text-neon-pink"
        >
          Demander un projet similaire →
        </Link>
      </div>
    </>
  );
}
