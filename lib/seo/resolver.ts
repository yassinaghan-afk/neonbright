import type { SeoCity, SeoIndustry, SeoPage, SeoRegistry, SeoService } from "./types";
import { RESERVED_SLUGS } from "./types";

function activeServices(r: SeoRegistry) {
  return r.services.filter((s) => s.active);
}

function activeCities(r: SeoRegistry) {
  return r.cities.filter((c) => c.active);
}

function activeIndustries(r: SeoRegistry) {
  return r.industries.filter((i) => i.active);
}

function buildServiceCityPage(service: SeoService, city: SeoCity): SeoPage {
  const slug = `${service.slug}-${city.slug}`;
  const title = `${service.name} in ${city.name} | Neon Bright`;
  const headline = `${service.name} in ${city.name}`;
  const description = `Premium ${service.name.toLowerCase()} in ${city.name}, ${city.country}. Custom design, fabrication & installation by Neon Bright. Free quote within 24 hours.`;
  const keywords = [
    ...service.keywords,
    ...city.keywords,
    `${service.name} ${city.name}`,
    `neon signs ${city.name}`,
  ];
  return {
    slug,
    type: "service-city",
    service,
    city,
    title,
    headline,
    description,
    keywords,
    canonicalPath: `/${slug}`,
  };
}

function buildIndustryCityPage(industry: SeoIndustry, city: SeoCity): SeoPage {
  const slug = `${industry.slug}-${city.slug}`;
  const title = `Neon Signs for ${industry.pluralName ?? industry.name} in ${city.name} | Neon Bright`;
  const headline = `Neon Signs for ${industry.pluralName ?? industry.name} in ${city.name}`;
  const description = `Custom LED neon signs for ${industry.pluralName?.toLowerCase() ?? industry.name.toLowerCase()} in ${city.name}. Designed, built and installed by Neon Bright Morocco.`;
  const keywords = [
    ...industry.keywords,
    ...city.keywords,
    `${industry.name} neon ${city.name}`,
  ];
  return {
    slug,
    type: "industry-city",
    industry,
    city,
    title,
    headline,
    description,
    keywords,
    canonicalPath: `/${slug}`,
  };
}

function buildServicePage(service: SeoService): SeoPage {
  return {
    slug: service.slug,
    type: "service",
    service,
    title: `${service.name} Morocco | Neon Bright`,
    headline: service.name,
    description: `${service.description} Serving all Morocco with premium LED neon. Request a free quote.`,
    keywords: [...service.keywords, "Morocco neon signs", "Neon Bright"],
    canonicalPath: `/${service.slug}`,
  };
}

function buildCityPage(city: SeoCity): SeoPage {
  return {
    slug: city.slug,
    type: "city",
    city,
    title: `Custom Neon Signs ${city.name} | Neon Bright`,
    headline: `Custom Neon Signs in ${city.name}`,
    description: `Premium custom LED neon signs in ${city.name}, ${city.region}. Design, production and installation. Free mockup within 24 hours.`,
    keywords: [...city.keywords, "custom neon Morocco"],
    canonicalPath: `/${city.slug}`,
  };
}

function buildIndustryPage(industry: SeoIndustry): SeoPage {
  return {
    slug: industry.slug,
    type: "industry",
    industry,
    title: `Neon Signs for ${industry.pluralName ?? industry.name} | Neon Bright`,
    headline: `Neon Signs for ${industry.pluralName ?? industry.name}`,
    description: `${industry.description} Premium LED neon across Morocco.`,
    keywords: [...industry.keywords, "Morocco"],
    canonicalPath: `/${industry.slug}`,
  };
}

function parseCompositeSlug(
  slug: string,
  r: SeoRegistry
): SeoPage | null {
  const cities = [...activeCities(r)].sort((a, b) => b.slug.length - a.slug.length);

  for (const city of cities) {
    const suffix = `-${city.slug}`;
    if (!slug.endsWith(suffix)) continue;
    const prefix = slug.slice(0, -suffix.length);
    if (!prefix) continue;

    const service = activeServices(r).find((s) => s.slug === prefix);
    if (service) return buildServiceCityPage(service, city);

    const industry = activeIndustries(r).find((i) => i.slug === prefix);
    if (industry) return buildIndustryCityPage(industry, city);
  }
  return null;
}

export function resolveSeoPage(slug: string, registry: SeoRegistry): SeoPage | null {
  if (RESERVED_SLUGS.has(slug)) return null;

  const composite = parseCompositeSlug(slug, registry);
  if (composite) return composite;

  const service = activeServices(registry).find((s) => s.slug === slug);
  if (service) return buildServicePage(service);

  const city = activeCities(registry).find((c) => c.slug === slug);
  if (city) return buildCityPage(city);

  const industry = activeIndustries(registry).find((i) => i.slug === slug);
  if (industry) return buildIndustryPage(industry);

  return null;
}

export function getAllSeoSlugs(registry: SeoRegistry): string[] {
  const slugs = new Set<string>();

  for (const service of activeServices(registry)) {
    slugs.add(service.slug);
    for (const city of activeCities(registry)) {
      slugs.add(`${service.slug}-${city.slug}`);
    }
  }

  for (const industry of activeIndustries(registry)) {
    slugs.add(industry.slug);
    for (const city of activeCities(registry)) {
      slugs.add(`${industry.slug}-${city.slug}`);
    }
  }

  for (const city of activeCities(registry)) {
    slugs.add(city.slug);
  }

  return [...slugs];
}

export function getRelatedPages(page: SeoPage, registry: SeoRegistry, limit = 8): SeoPage[] {
  const all = getAllSeoSlugs(registry)
    .map((s) => resolveSeoPage(s, registry))
    .filter(Boolean) as SeoPage[];

  const related: SeoPage[] = [];

  if (page.type === "service-city" && page.service && page.city) {
    related.push(
      ...all.filter(
        (p) =>
          p.slug !== page.slug &&
          ((p.service?.slug === page.service?.slug && p.city?.slug !== page.city?.slug) ||
            (p.city?.slug === page.city?.slug && p.service?.slug !== page.service?.slug))
      )
    );
  } else if (page.service) {
    related.push(...all.filter((p) => p.service?.slug === page.service?.slug && p.slug !== page.slug));
  } else if (page.city) {
    related.push(...all.filter((p) => p.city?.slug === page.city?.slug && p.slug !== page.slug));
  } else if (page.industry) {
    related.push(...all.filter((p) => p.industry?.slug === page.industry?.slug && p.slug !== page.slug));
  }

  return related.slice(0, limit);
}
