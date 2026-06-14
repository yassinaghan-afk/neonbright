import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/whatsapp/config";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
