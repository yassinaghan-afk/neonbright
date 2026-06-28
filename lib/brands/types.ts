import type { PortfolioCategory } from "@/lib/portfolio/types";

const hero = (file: string) => `/media/hero-slider/${file}`;

export type BrandTypeId =
  | "all"
  | "hotel"
  | "restaurant"
  | "cafe"
  | "retail"
  | "fitness"
  | "corporate"
  | "shopping"
  | "automotive";

export type BrandFilter = {
  id: BrandTypeId;
  label: string;
};

export const brandFilters: BrandFilter[] = [
  { id: "all", label: "Tous" },
  { id: "hotel", label: "Hôtels" },
  { id: "restaurant", label: "Restaurants" },
  { id: "cafe", label: "Cafés" },
  { id: "retail", label: "Retail" },
  { id: "fitness", label: "Fitness" },
  { id: "corporate", label: "Corporate" },
  { id: "shopping", label: "Centres commerciaux" },
  { id: "automotive", label: "Automobile" },
];

export type BrandProfile = {
  slug: string;
  name: string;
  type: Exclude<BrandTypeId, "all">;
  typeLabel: string;
  logoFile: string;
  city: string;
  country: string;
  year: string;
  description: string;
  installationType: string;
  projectCount: number;
  gallery: string[];
  beforeImage: string;
  afterImage: string;
  relatedEventSlugs: string[];
};

export type ResolvedBrand = BrandProfile & {
  logoSrc: string;
};

export const brandsCategory: PortfolioCategory = {
  id: "marques-clients",
  title: "Réalisations pour",
  titleAccent: "marques",
  description:
    "Plus de 200 clients satisfaits nous ont fait confiance pour leurs enseignes, néons et installations lumineuses au Maroc et à l'international.",
  coverImage: hero("c465b19f-3967-4486-b3eb-d4eda34b9c7b.webp"),
  coverAlt: "Installations néon LED pour marques et clients premium",
  href: "/realisations/brands",
};

export const BRAND_PROFILES: BrandProfile[] = [
  {
    slug: "royal-mansour",
    name: "Royal Mansour Marrakech",
    type: "hotel",
    typeLabel: "Hôtel & Resort",
    logoFile: "PHOTO-2026-06-23-18-20-29.jpg",
    city: "Marrakech",
    country: "Maroc",
    year: "2024",
    description:
      "Installations néon sur mesure pour le palace Royal Mansour — signalétique lumineuse et décors d'événements intégrés à un cadre hôtelier cinq étoiles.",
    installationType: "Décors événementiels & enseignes intérieures",
    projectCount: 3,
    gallery: [
      hero("c465b19f-3967-4486-b3eb-d4eda34b9c7b.webp"),
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
      hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
    ],
    beforeImage: hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
    afterImage: hero("c465b19f-3967-4486-b3eb-d4eda34b9c7b.webp"),
    relatedEventSlugs: ["royal-mansour-pure-the-show"],
  },
  {
    slug: "volkswagen",
    name: "Volkswagen",
    type: "automotive",
    typeLabel: "Marque automobile",
    logoFile: "PHOTO-2026-06-23-18-20-29 6.jpg",
    city: "Casablanca",
    country: "Maroc",
    year: "2025",
    description:
      "Néons personnalisés pour les activations et lancements Volkswagen Maroc — pièces lumineuses signature alignées sur l'identité de la marque.",
    installationType: "Activation de marque & lancement produit",
    projectCount: 2,
    gallery: [
      hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
      hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
      hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
    ],
    beforeImage: hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
    afterImage: hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
    relatedEventSlugs: ["activation-volkswagen"],
  },
  {
    slug: "byd",
    name: "BYD",
    type: "automotive",
    typeLabel: "Marque automobile",
    logoFile: "PHOTO-2026-06-23-18-20-29 5.jpg",
    city: "Casablanca",
    country: "Maroc",
    year: "2025",
    description:
      "Enseignes et éléments néon pour l'univers BYD — visibilité retail et présence lumineuse premium en espace commercial.",
    installationType: "Enseigne showroom & logo néon",
    projectCount: 1,
    gallery: [
      hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
      hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
    ],
    beforeImage: hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
    afterImage: hero("82efd0d2-2918-440b-9d23-41974d6cbb59.webp"),
    relatedEventSlugs: ["activation-volkswagen"],
  },
  {
    slug: "puma",
    name: "PUMA",
    type: "retail",
    typeLabel: "Retail & Sport",
    logoFile: "PHOTO-2026-06-23-18-20-29 4.jpg",
    city: "Casablanca",
    country: "Maroc",
    year: "2024",
    description:
      "Logo néon et signalétique lumineuse pour espace retail PUMA — impact visuel fort et cohérence avec l'univers sport et lifestyle.",
    installationType: "Logo néon & vitrine retail",
    projectCount: 2,
    gallery: [
      hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
      hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
    ],
    beforeImage: hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
    afterImage: hero("d4aa5e68-81c9-4331-8a8f-83b20958ef85.webp"),
    relatedEventSlugs: ["stand-salon-expo"],
  },
  {
    slug: "nike",
    name: "Nike",
    type: "fitness",
    typeLabel: "Fitness & Retail",
    logoFile: "PHOTO-2026-06-23-18-20-29 2.jpg",
    city: "Casablanca",
    country: "Maroc",
    year: "2024",
    description:
      "Installation néon pour flagship et espace retail Nike — swoosh lumineux et typographie signature pour une présence de marque iconique.",
    installationType: "Logo néon grand format",
    projectCount: 2,
    gallery: [
      hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
      hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
    ],
    beforeImage: hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
    afterImage: hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
    relatedEventSlugs: ["festival-scene-musicale"],
  },
  {
    slug: "supreme",
    name: "Supreme",
    type: "retail",
    typeLabel: "Retail & Lifestyle",
    logoFile: "PHOTO-2026-06-23-18-20-29 3.jpg",
    city: "Marrakech",
    country: "Maroc",
    year: "2025",
    description:
      "Néon logo Supreme pour espace retail et activation — typographie rouge iconique reproduite en LED flex haute fidélité.",
    installationType: "Logo néon script",
    projectCount: 1,
    gallery: [
      hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
      hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
    ],
    beforeImage: hero("64550da3-6666-41e4-ae29-6d8422853ffd.webp"),
    afterImage: hero("d35fa705-f3f5-4435-a878-d6d3f99c92cc.webp"),
    relatedEventSlugs: ["palm-party"],
  },
  {
    slug: "mfm-radio",
    name: "MFM Radio",
    type: "corporate",
    typeLabel: "Média & Corporate",
    logoFile: "PHOTO-2026-06-23-18-32-12.jpg",
    city: "Casablanca",
    country: "Maroc",
    year: "2024",
    description:
      "Enseigne néon pour studio et espace média MFM Radio — logo circulaire reproduit en néon LED pour une identité visible jour et nuit.",
    installationType: "Enseigne logo & studio branding",
    projectCount: 1,
    gallery: [
      hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
      hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
    ],
    beforeImage: hero("2842fb6b-da2c-4af8-92f4-e4ed440c7183.webp"),
    afterImage: hero("efa6a01f-04f7-4220-8080-c35519c6539f.webp"),
    relatedEventSlugs: ["conference-scene"],
  },
];

export function getBrandStats(brands: Pick<BrandProfile, "city" | "projectCount">[]) {
  const cities = new Set(brands.map((b) => b.city));
  const projectCount = brands.reduce((sum, b) => sum + b.projectCount, 0);
  return {
    brandCount: brands.length,
    projectCount,
    cityCount: cities.size,
  };
}

export function getBrandSlugs(): string[] {
  return BRAND_PROFILES.map((b) => b.slug);
}

export function filterBrands(
  brands: ResolvedBrand[],
  filterId: BrandTypeId
): ResolvedBrand[] {
  if (filterId === "all") return brands;
  return brands.filter((b) => b.type === filterId);
}

export function brandHref(slug: string): string {
  return `/realisations/brands/${slug}`;
}
