import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandsListing } from "@/components/portfolio/BrandsListing";
import { Container } from "@/components/ui/Container";
import { getResolvedBrands } from "@/lib/brands/server";
import { getPortfolioCategoryBySlug } from "@/lib/cms/portfolio";

export const metadata: Metadata = {
  title: "Marques & Clients | Réalisations Neon Bright",
  description:
    "Hôtels, restaurants, retail, fitness, corporate et marques automobiles — découvrez les entreprises qui nous font confiance pour leurs projets néon LED.",
};

export const revalidate = 3600;

export default async function BrandsPage() {
  const [brands, category] = await Promise.all([
    getResolvedBrands(),
    getPortfolioCategoryBySlug("marques-clients"),
  ]);

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

          <div className="mt-12 sm:mt-16">
            <BrandsListing brands={brands} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
