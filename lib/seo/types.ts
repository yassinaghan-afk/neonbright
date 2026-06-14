export type SeoEntityBase = {
  slug: string;
  name: string;
  pluralName?: string;
  description: string;
  keywords: string[];
  active: boolean;
};

export type SeoService = SeoEntityBase & {
  type: "service";
  headline?: string;
};

export type SeoCity = SeoEntityBase & {
  type: "city";
  region: string;
  country: string;
};

export type SeoIndustry = SeoEntityBase & {
  type: "industry";
};

export type SeoRegistry = {
  services: SeoService[];
  cities: SeoCity[];
  industries: SeoIndustry[];
  updatedAt: string;
};

export type SeoPageType =
  | "service-city"
  | "industry-city"
  | "service"
  | "city"
  | "industry";

export type SeoPage = {
  slug: string;
  type: SeoPageType;
  service?: SeoService;
  city?: SeoCity;
  industry?: SeoIndustry;
  title: string;
  headline: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
};

/** Future content types — route stubs reserved in registry */
export type SeoFutureContentType = "blog" | "case-study";

export type SeoFutureRoute = {
  prefix: "/blog" | "/case-studies" | "/cities" | "/industries";
  contentType: SeoFutureContentType | "city-hub" | "industry-hub";
};

export const SEO_FUTURE_ROUTES: SeoFutureRoute[] = [
  { prefix: "/blog", contentType: "blog" },
  { prefix: "/case-studies", contentType: "case-study" },
  { prefix: "/cities", contentType: "city-hub" },
  { prefix: "/industries", contentType: "industry-hub" },
];

export const RESERVED_SLUGS = new Set([
  "admin",
  "designer",
  "api",
  "blog",
  "case-studies",
  "cities",
  "industries",
  "sitemap.xml",
  "robots.txt",
]);
