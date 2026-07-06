import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EventsListing } from "@/components/portfolio/EventsListing";
import { Container } from "@/components/ui/Container";
import { getPortfolioCategoryBySlug } from "@/lib/cms/portfolio";
import { getEventProjectsForPage } from "@/lib/events/server";

export const metadata: Metadata = {
  title: "Événements | Réalisations Neon Bright",
  description:
    "Installations néon LED pour festivals, concerts, soirées VIP, activations de marque, mariages et événements corporate au Maroc et à l'international.",
};

export const revalidate = 3600;

export default async function EventsPage() {
  const [category, projects] = await Promise.all([
    getPortfolioCategoryBySlug("evenements"),
    getEventProjectsForPage(),
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
              {category?.pageTitle ?? "ÉVÉNEMENTS"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-lg">
              {category?.pageSubtitle ??
                "Festivals, concerts, soirées VIP, lancements produit, mariages et activations de marque — découvrez nos installations lumineuses pour événements premium."}
            </p>
          </div>

          <div className="mt-12 sm:mt-16">
            <EventsListing projects={projects} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
