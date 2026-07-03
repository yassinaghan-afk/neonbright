import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { Container } from "@/components/ui/Container";
import { getPortfolioCategoryBySlug } from "@/lib/cms/portfolio";
import { getBrandsPageLogos } from "@/lib/cms/brands-logos";

export const metadata: Metadata = {
  title: "Marques & Clients | Réalisations Neon Bright",
  description:
    "Hôtels, restaurants, retail, fitness, corporate et marques automobiles — découvrez les entreprises qui nous font confiance pour leurs projets néon LED.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BrandsPage() {
  const [category, { logos, stripLabel }] = await Promise.all([
    getPortfolioCategoryBySlug("marques-clients"),
    getBrandsPageLogos(),
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
        </Container>

        {logos.length > 0 ? (
          <PartnerLogoStrip logos={logos} label={stripLabel} className="mt-12 sm:mt-16" />
        ) : null}
      </main>
      <Footer />
    </>
  );
}
