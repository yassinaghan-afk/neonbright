import type { PortfolioCategory } from "@/lib/portfolio/types";

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
  technologies: string[];
  beforeImage: string;
  afterImage: string;
  relatedEventSlugs: string[];
};

export type ResolvedBrand = BrandProfile & {
  logoSrc: string;
};

/** CMS category metadata — cover image and href are managed via Admin → Portfolio. */
export const brandsCategory: PortfolioCategory = {
  id: "marques-clients",
  title: "Réalisations pour",
  titleAccent: "marques",
  description:
    "Plus de 200 clients satisfaits nous ont fait confiance pour leurs enseignes, néons et installations lumineuses au Maroc et à l'international.",
  coverImage: "/media/hero-slider/c465b19f-3967-4486-b3eb-d4eda34b9c7b.jpg",
  coverAlt: "Installations néon LED pour marques et clients premium",
  href: "/realisations/brands",
};

export function getBrandStats(brands: Pick<BrandProfile, "city" | "projectCount">[]) {
  const cities = new Set(brands.map((b) => b.city));
  const projectCount = brands.reduce((sum, b) => sum + b.projectCount, 0);
  return {
    brandCount: brands.length,
    projectCount,
    cityCount: cities.size,
  };
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
