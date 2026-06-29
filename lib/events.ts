import type { PortfolioCategory } from "@/lib/portfolio/types";

export type { PortfolioCategory };

export type EventFilterId =
  | "all"
  | "festivals"
  | "vip"
  | "corporate"
  | "mariages"
  | "concerts"
  | "expositions";

export type EventFilter = {
  id: EventFilterId;
  label: string;
};

export const eventFilters: EventFilter[] = [
  { id: "all", label: "Tous" },
  { id: "festivals", label: "Festivals" },
  { id: "vip", label: "VIP" },
  { id: "corporate", label: "Corporate" },
  { id: "mariages", label: "Mariages" },
  { id: "concerts", label: "Concerts" },
  { id: "expositions", label: "Expositions" },
];

export type EventProject = {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  city: string;
  country: string;
  year: string;
  client: string;
  technologies: string[];
  filters: Exclude<EventFilterId, "all">[];
  image: string;
  imageAlt: string;
  gallery: string[];
  accent: "neon-pink" | "neon-purple" | "neon-blue";
  featured?: boolean;
};

/** CMS category metadata — cover image and href are managed via Admin → Portfolio. */
export const eventsCategory: PortfolioCategory = {
  id: "evenements",
  title: "Réalisations pour",
  titleAccent: "événements",
  description:
    "Festivals, concerts, soirées VIP, activations de marque, salons professionnels et expériences immersives conçues pour marquer les esprits.",
  coverImage: "/media/hero-slider/2842fb6b-da2c-4af8-92f4-e4ed440c7183.jpg",
  coverAlt: "Installation néon LED pour festival et événement premium",
  href: "/realisations/events",
};

export function eventProjectHref(slug: string): string {
  return `/realisations/events/${slug}`;
}
