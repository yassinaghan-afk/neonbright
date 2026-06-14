import { getSiteBaseUrl } from "./metadata";
import type { SeoPage } from "./types";

type JsonLd = Record<string, unknown>;

export function buildBreadcrumbSchema(page: SeoPage): JsonLd {
  const base = getSiteBaseUrl();
  const items: { name: string; url: string }[] = [
    { name: "Home", url: base },
  ];

  if (page.service) {
    items.push({ name: page.service.name, url: `${base}/${page.service.slug}` });
  } else if (page.industry) {
    items.push({ name: page.industry.pluralName ?? page.industry.name, url: `${base}/${page.industry.slug}` });
  }

  if (page.city) {
    items.push({ name: page.city.name, url: `${base}/${page.city.slug}` });
  }

  if (page.type === "service-city" || page.type === "industry-city") {
    items.push({ name: page.headline, url: `${base}${page.canonicalPath}` });
  } else if (page.type === "service" || page.type === "city" || page.type === "industry") {
    if (items[items.length - 1]?.url !== `${base}${page.canonicalPath}`) {
      items.push({ name: page.headline, url: `${base}${page.canonicalPath}` });
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildServiceSchema(page: SeoPage): JsonLd {
  const base = getSiteBaseUrl();
  const area = page.city
    ? { "@type": "City", name: page.city.name, containedInPlace: { "@type": "Country", name: page.city.country } }
    : { "@type": "Country", name: "Morocco" };

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.headline,
    description: page.description,
    url: `${base}${page.canonicalPath}`,
    provider: {
      "@type": "LocalBusiness",
      name: "Neon Bright",
      url: base,
      address: { "@type": "PostalAddress", addressLocality: "Casablanca", addressCountry: "MA" },
      areaServed: area,
    },
    serviceType: page.service?.name ?? page.industry?.name ?? "LED Neon Signs",
  };
}

export function buildWebPageSchema(page: SeoPage): JsonLd {
  const base = getSiteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: `${base}${page.canonicalPath}`,
    isPartOf: { "@type": "WebSite", name: "Neon Bright", url: base },
  };
}

export function buildPageJsonLd(page: SeoPage): JsonLd[] {
  return [buildWebPageSchema(page), buildBreadcrumbSchema(page), buildServiceSchema(page)];
}
