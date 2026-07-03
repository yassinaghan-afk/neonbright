import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandsListing } from "@/components/portfolio/BrandsListing";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { Container } from "@/components/ui/Container";
import {
  getResolvedBrands,
  getBrandSlugs,
} from "@/lib/brands/server";
import { getPortfolioCategoryBySlug } from "@/lib/cms/portfolio";
import { getPublicHomepageContent } from "@/lib/cms/public";

export const metadata: Metadata = {
  title: "Marques & Clients | Réalisations Neon Bright",
  description:
    "Hôtels, restaurants, retail, fitness, corporate et marques automobiles — découvrez les entreprises qui nous font confiance pour leurs projets néon LED.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BrandsPage() {
  const [brands, category, { partnerLogos, trustStripLabel }] = await Promise.all([
    getResolvedBrands(),
    getPortfolioCategoryBySlug("marques-clients"),
    getPublicHomepageContent(),
  ]);

  console.log(`[cms-sync] website-render /realisations/brands: ${brands.length} brands visible`, brands.map((b) => `${b.slug}(logo:${b.logoSrc ? "y" : "n"})`).join(","));
  console.log(`[cms-sync] website-render /realisations/brands: ${partnerLogos.length} partner logos`);

  const stripLabel = trustStripLabel || "Ils nous font confiance";

  return (
    <>
      <Navbar />
      <main className="section-glow-top pb-24 pt-28 sm:pb-28 sm:pt-32">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/#portfolio"
              className="text-xs font-medium uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-neon-pink"
            >
              ← Réalisations
            </Link>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              {category?.pageTitle ?? "MARQUES & CLIENTS"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-lg">
              {category?.pageSubtitle ??
                "Découvrez les marques, hôtels, restaurants, enseignes et entreprises qui nous ont confié leurs projets lumineux."}
            </p>
          </div>
        </Container>

        {partnerLogos.length > 0 ? (
          <PartnerLogoStrip logos={partnerLogos} label={stripLabel} className="mt-12 sm:mt-16" />
        ) : (
          <section className="relative mt-12 bg-[#050505] sm:mt-16" aria-label={stripLabel}>
            <div className="px-4 py-10 sm:py-12">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
                {stripLabel.toUpperCase()}
              </p>
              <p className="mt-6 text-center text-sm text-white/30">
                Aucun logo public pour le moment.
              </p>
            </div>
          </section>
        )}

        <Container>
          <div className="mt-12 sm:mt-16">
            <BrandsListing brands={brands} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
