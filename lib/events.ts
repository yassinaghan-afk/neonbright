import type { PortfolioCategory } from "@/lib/portfolio/types";

export type { PortfolioCategory };

const hero = (file: string) => `/media/hero-slider/${file}`;

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

export const eventsCategory: PortfolioCategory = {
  id: "evenements",
  title: "Réalisations pour",
  titleAccent: "événements",
  description:
    "Festivals, concerts, soirées VIP, activations de marque, salons professionnels et expériences immersives conçues pour marquer les esprits.",
  coverImage: hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
  coverAlt: "Installation néon LED pour festival et événement premium",
  href: "/realisations/events",
};

export const eventProjects: EventProject[] = [
  {
    slug: "festival-scene-musicale",
    title: "Festival & Scène Musicale",
    shortDescription:
      "Scénographie néon grand format pour une scène festival — signature lumineuse visible à des centaines de mètres.",
    fullDescription:
      "Conception et production d'une installation néon monumentale pour une scène festival au cœur de Marrakech. L'objectif : créer une signature visuelle immédiatement reconnaissable, photogénique et adaptée aux shows live devant des milliers de spectateurs. Structure modulaire, rendu haute luminosité et finitions premium pour résister aux conditions événementielles.",
    city: "Marrakech",
    country: "Maroc",
    year: "2025",
    client: "Production événementielle",
    technologies: ["Néon LED flex RGB", "Contrôle DMX", "Structure aluminium", "Diffusion opale"],
    filters: ["festivals", "concerts"],
    image: hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
    imageAlt: "Installation néon LED sur scène de festival à Marrakech",
    gallery: [
      hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
      hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
    ],
    accent: "neon-pink",
    featured: true,
  },
  {
    slug: "palm-party",
    title: "Palm Party",
    shortDescription:
      "Néons sur mesure pour une soirée Palm Party Events — ambiance premium et impact visuel sur les espaces VIP.",
    fullDescription:
      "Installation complète de néons personnalisés pour une soirée signée Palm Party Events. Chaque élément lumineux a été pensé pour renforcer l'ambiance festive, guider les invités et créer des zones photo mémorables sur la piste et les espaces VIP.",
    city: "Marrakech",
    country: "Maroc",
    year: "2025",
    client: "Palm Party Events",
    technologies: ["Néon LED flex", "Fixations invisibles", "Variateur intensité", "Câblage discret"],
    filters: ["vip", "concerts"],
    image: hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
    imageAlt: "Néon LED personnalisé pour soirée Palm Party Events",
    gallery: [
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
      hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
      hero("c465b19f-3967-4486-b3eb-d4eda34b9c7b.webp"),
    ],
    accent: "neon-purple",
  },
  {
    slug: "activation-volkswagen",
    title: "Activation Volkswagen",
    shortDescription:
      "Néons personnalisés hors norme pour l'activation @volkswagen.ma — vitrine lumineuse et image de marque amplifiée.",
    fullDescription:
      "Réalisation de néons sur mesure pour une activation de marque Volkswagen au Maroc. Des pièces lumineuses uniques, conçues pour attirer le regard, structurer l'espace événementiel et offrir une expérience premium alignée avec l'univers de la marque.",
    city: "Casablanca",
    country: "Maroc",
    year: "2025",
    client: "Volkswagen Maroc",
    technologies: ["Néon LED flex", "Couleurs brandées", "Montage rapide", "Transport sécurisé"],
    filters: ["corporate"],
    image: hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
    imageAlt: "Activation de marque Volkswagen avec néons LED sur mesure",
    gallery: [
      hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
      hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
      hero("13978eaa-af3e-422b-afce-217b5298c6ed.webp"),
    ],
    accent: "neon-blue",
    featured: true,
  },
  {
    slug: "royal-mansour-pure-the-show",
    title: "Royal Mansour — Clôture Pure The Show",
    shortDescription:
      "Installation lumineuse pour la soirée de clôture @pure_theshow au Royal Mansour — expérience haut de gamme et atmosphère VIP.",
    fullDescription:
      "Décors néon et signalétique lumineuse pour la soirée de clôture Pure The Show au Royal Mansour Marrakech. Une approche raffinée, intégrée au décor existant, pour sublimer l'expérience invités dans un cadre palace cinq étoiles.",
    city: "Marrakech",
    country: "Maroc",
    year: "2024",
    client: "Pure The Show · Royal Mansour",
    technologies: ["Néon LED warm white", "Arches sur mesure", "Installation nocturne", "Finitions luxe"],
    filters: ["vip", "corporate"],
    image: hero("c465b19f-3967-4486-b3eb-d4eda34b9c7b.webp"),
    imageAlt: "Néon LED pour événement corporate au Royal Mansour Marrakech",
    gallery: [
      hero("c465b19f-3967-4486-b3eb-d4eda34b9c7b.webp"),
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
      hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
    ],
    accent: "neon-pink",
  },
  {
    slug: "rooftop-vip-stardust",
    title: "Rooftop VIP Stardust",
    shortDescription:
      "Décors néon pour une soirée @stardust.eventdesigner — zones Instagrammables et expérience invitée mémorable.",
    fullDescription:
      "Création d'installations néon pour un rooftop VIP orchestré par Stardust Event Designer. Typographies lumineuses, décors muraux et points focaux conçus pour maximiser l'impact visuel et la partageabilité sur les réseaux sociaux.",
    city: "Casablanca",
    country: "Maroc",
    year: "2025",
    client: "Stardust Event Designer",
    technologies: ["Néon LED script", "Montage mural", "RGB programmable", "Housse transport"],
    filters: ["vip"],
    image: hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
    imageAlt: "Installation néon sur rooftop VIP pour événement Stardust",
    gallery: [
      hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
      hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
    ],
    accent: "neon-purple",
  },
  {
    slug: "stand-salon-expo",
    title: "Stand Salon & Expo",
    shortDescription:
      "Signalétique néon pour stand d'exposition — visibilité maximale et image de marque premium sur le parcours visiteurs.",
    fullDescription:
      "Enseignes et éléments néon pour un stand d'exposition professionnel. Conception orientée visibilité à distance, repérage instantané en salon et cohérence avec l'identité visuelle de la marque exposante.",
    city: "Casablanca",
    country: "Maroc",
    year: "2024",
    client: "Marque exposante",
    technologies: ["Néon LED compact", "Logo 3D lumineux", "Kit démontable", "Alimentation 12V"],
    filters: ["expositions", "corporate"],
    image: hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
    imageAlt: "Stand d'exposition avec enseigne néon LED sur salon professionnel",
    gallery: [
      hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
      hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
      hero("13978eaa-af3e-422b-afce-217b5298c6ed.webp"),
    ],
    accent: "neon-blue",
  },
  {
    slug: "mariage-neon-personnalise",
    title: "Mariage — Néon Personnalisé",
    shortDescription:
      "Prénoms, dates et messages lumineux pour une réception de mariage — une touche spectaculaire et inoubliable.",
    fullDescription:
      "Création de néons personnalisés pour une célébration de mariage premium à Marrakech. Prénoms des mariés, date du jour et messages sentimentaux transformés en pièces lumineuses élégantes, parfaites pour la cérémonie et la réception.",
    city: "Marrakech",
    country: "Maroc",
    year: "2025",
    client: "Mariés privés",
    technologies: ["Néon LED warm white", "Typo script", "Support acrylique", "Livraison événement"],
    filters: ["mariages"],
    image: hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
    imageAlt: "Néon LED personnalisé pour mariage et réception premium",
    gallery: [
      hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
      hero("c465b19f-3967-4486-b3eb-d4eda34b9c7b.webp"),
    ],
    accent: "neon-pink",
  },
  {
    slug: "conference-scene",
    title: "Conférence & Scène",
    shortDescription:
      "Branding scénique pour keynote — logo néon, typo lumineuse et fond de scène pour une présence professionnelle forte.",
    fullDescription:
      "Installation de branding lumineux pour une conférence et keynote corporate. Logo néon, éléments typographiques et habillage scénique conçus pour renforcer la crédibilité de la marque et la qualité perçue de l'événement.",
    city: "Rabat",
    country: "Maroc",
    year: "2024",
    client: "Organisateur corporate",
    technologies: ["Néon LED blanc froid", "Logo sur mesure", "Structure scénique", "Installation technique"],
    filters: ["corporate", "concerts"],
    image: hero("13978eaa-af3e-422b-afce-217b5298c6ed.webp"),
    imageAlt: "Branding néon LED pour scène de conférence et keynote",
    gallery: [
      hero("13978eaa-af3e-422b-afce-217b5298c6ed.webp"),
      hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
      hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
    ],
    accent: "neon-purple",
  },
];

export function getEventProject(slug: string): EventProject | undefined {
  return eventProjects.find((p) => p.slug === slug);
}

export function getEventProjectSlugs(): string[] {
  return eventProjects.map((p) => p.slug);
}

export function filterEventProjects(filterId: EventFilterId): EventProject[] {
  if (filterId === "all") return eventProjects;
  return eventProjects.filter((p) => p.filters.includes(filterId));
}

export function eventProjectHref(slug: string): string {
  return `/realisations/events/${slug}`;
}
