import { eventsCategory } from "@/lib/events";
import { brandsCategory } from "@/lib/brands/types";
import { createId } from "@/lib/cms/id";
import type { CMSPortfolioCategory } from "@/lib/cms/types";

const PLACEHOLDER_CATEGORIES: Omit<CMSPortfolioCategory, "id">[] = [
  {
    slug: "restaurants",
    title: "Réalisations pour",
    titleAccent: "restaurants",
    description:
      "Enseignes lumineuses, néons et signalétique pour restaurants, bars et établissements gastronomiques.",
    coverImage: "",
    coverAlt: "Installations néon LED pour restaurants",
    heroImage: "",
    href: "/realisations/restaurants",
    pageTitle: "RESTAURANTS",
    pageSubtitle:
      "Découvrez nos installations lumineuses pour restaurants, bars et établissements premium.",
    enabled: false,
    sortOrder: 2,
  },
  {
    slug: "hotels",
    title: "Réalisations pour",
    titleAccent: "hôtels",
    description:
      "Décors lumineux, enseignes et néons sur mesure pour hôtels, resorts et établissements hôteliers.",
    coverImage: "",
    coverAlt: "Installations néon LED pour hôtels",
    heroImage: "",
    href: "/realisations/hotels",
    pageTitle: "HÔTELS",
    pageSubtitle:
      "Découvrez nos réalisations pour hôtels, resorts et établissements hôteliers premium.",
    enabled: false,
    sortOrder: 3,
  },
  {
    slug: "retail",
    title: "Réalisations pour",
    titleAccent: "retail",
    description:
      "Logos néon, vitrines lumineuses et enseignes pour boutiques et espaces retail.",
    coverImage: "",
    coverAlt: "Installations néon LED pour retail",
    heroImage: "",
    href: "/realisations/retail",
    pageTitle: "RETAIL",
    pageSubtitle: "Découvrez nos installations pour boutiques et espaces retail.",
    enabled: false,
    sortOrder: 4,
  },
  {
    slug: "corporate",
    title: "Réalisations pour",
    titleAccent: "corporate",
    description:
      "Signalétique professionnelle, logos lumineux et branding pour entreprises et sièges corporate.",
    coverImage: "",
    coverAlt: "Installations néon LED corporate",
    heroImage: "",
    href: "/realisations/corporate",
    pageTitle: "CORPORATE",
    pageSubtitle: "Découvrez nos réalisations pour entreprises et espaces corporate.",
    enabled: false,
    sortOrder: 5,
  },
];

function categoryFromStatic(
  cat: typeof eventsCategory,
  slug: string,
  sortOrder: number,
  pageTitle: string,
  pageSubtitle: string
): CMSPortfolioCategory {
  return {
    id: createId("cat"),
    slug,
    title: cat.title,
    titleAccent: cat.titleAccent,
    description: cat.description,
    coverImage: cat.coverImage,
    coverAlt: cat.coverAlt,
    heroImage: cat.coverImage,
    href: cat.href,
    pageTitle,
    pageSubtitle,
    enabled: true,
    sortOrder,
  };
}

export function seedPortfolioCategories(): CMSPortfolioCategory[] {
  const events = categoryFromStatic(
    eventsCategory,
    "evenements",
    0,
    "ÉVÉNEMENTS",
    "Festivals, concerts, soirées VIP, lancements produit, mariages et activations de marque — découvrez nos installations lumineuses pour événements premium."
  );
  events.id = "cat_evenements";

  const brands = categoryFromStatic(
    brandsCategory,
    "marques-clients",
    1,
    "MARQUES & CLIENTS",
    "Découvrez les marques, hôtels, restaurants, enseignes et entreprises qui nous ont confié leurs projets lumineux."
  );
  brands.id = "cat_marques";

  const placeholders = PLACEHOLDER_CATEGORIES.map((c) => ({
    ...c,
    id: createId("cat"),
  }));

  return [events, brands, ...placeholders];
}

/**
 * Projects are managed entirely through the Admin CMS.
 * This seed is intentionally empty — existing data lives in data/cms-content.json.
 */
export function seedPortfolioProjects(): never[] {
  return [];
}
