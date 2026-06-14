import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/whatsapp/config";
import { hydrateSeoRegistry } from "@/lib/seo/registry";
import { getAllSeoSlugs } from "@/lib/seo/resolver";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().replace(/\/$/, "");
  const registry = await hydrateSeoRegistry();
  const slugs = getAllSeoSlugs(registry);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/designer`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];

  const seoRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: slug.includes("-") ? 0.8 : 0.7,
  }));

  return [...staticRoutes, ...seoRoutes];
}
