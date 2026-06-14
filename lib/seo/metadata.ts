import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/whatsapp/config";
import { BRAND_OG_DIMENSIONS, BRAND_OG_IMAGE, BRAND_NAME } from "@/lib/brand";
import type { SeoPage } from "./types";

const DEFAULT_OG = BRAND_OG_IMAGE;

export function buildPageMetadata(page: SeoPage, siteUrl?: string): Metadata {
  const base = (siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  const url = `${base}${page.canonicalPath}`;
  const title = page.title;
  const description = page.description;
  const keywords = page.keywords.join(", ");

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: BRAND_NAME,
      title,
      description,
      images: [{ url: `${base}${DEFAULT_OG}`, width: BRAND_OG_DIMENSIONS.width, height: BRAND_OG_DIMENSIONS.height, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${base}${DEFAULT_OG}`],
    },
    robots: { index: true, follow: true },
  };
}

export function getSiteBaseUrl(): string {
  return getSiteUrl().replace(/\/$/, "");
}
