import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EventProjectCard } from "@/components/portfolio/EventProjectCard";
import { BrandProjectGallery } from "@/components/portfolio/BrandProjectGallery";
import { getResolvedBrand, getResolvedBrands } from "@/lib/brands/server";
import { getEventProjectsForPage } from "@/lib/events/server";
import { localImageUnoptimized } from "@/lib/media/local-image";

type Props = { params: Promise<{ slug: string }> };

/** Runtime CMS at STORAGE_ROOT — must not be baked at build time. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getResolvedBrand(slug);
  if (!brand) return { title: "Marque introuvable" };

  return {
    title: `${brand.name} | Marques & Clients Neon Bright`,
    description: brand.description,
  };
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const brand = await getResolvedBrand(slug);
  if (!brand) notFound();

  const allBrands = await getResolvedBrands();
  const relatedBrands = allBrands
    .filter((b) => b.slug !== brand.slug && b.type === brand.type)
    .slice(0, 3);

  const eventProjects = await getEventProjectsForPage();
  const relatedEvents = eventProjects.filter((p) =>
    brand.relatedEventSlugs.includes(p.slug)
  );

  const location = `${brand.city}, ${brand.country}`;

  return (
    <>
      <Navbar />
      <main className="pb-24 pt-28 sm:pb-28 sm:pt-32">
        <Container>
          <Link
            href="/realisations/brands"
            className="text-xs font-medium uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-neon-pink"
          >
            ← Marques & Clients
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start lg:gap-12">
            <div className="partner-white-strip flex min-h-[200px] items-center justify-center rounded-2xl border border-white/10 p-10 sm:rounded-3xl lg:sticky lg:top-28">
              <Image
                src={brand.logoSrc}
                alt={`Logo ${brand.name}`}
                width={260}
                height={100}
                className="max-h-24 w-auto max-w-[220px] object-contain"
                priority
                {...localImageUnoptimized(brand.logoSrc)}
              />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-purple">
                {brand.typeLabel}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {brand.name}
              </h1>

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/55">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  {location}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  {brand.year}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  {brand.installationType}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  {brand.projectCount} projet{brand.projectCount > 1 ? "s" : ""}
                </span>
              </div>

              <p className="mt-8 text-base leading-relaxed text-white/70 sm:text-lg">
                {brand.description}
              </p>

              {brand.technologies.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                    Technologies utilisées
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {brand.technologies.map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full border border-neon-pink/20 bg-neon-pink/10 px-4 py-1.5 text-xs font-medium text-neon-pink"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {brand.gallery.length > 0 && (
            <div className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Galerie
              </p>
              <BrandProjectGallery name={brand.name} gallery={brand.gallery} />
            </div>
          )}

          {relatedEvents.length > 0 && (
            <div className="mt-14 sm:mt-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Projets événementiels liés
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {relatedEvents.map((project) => (
                  <EventProjectCard key={project.slug} project={project} />
                ))}
              </div>
            </div>
          )}

          {relatedBrands.length > 0 && (
            <div className="mt-14 sm:mt-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Marques similaires
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {relatedBrands.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/realisations/brands/${b.slug}`}
                    className="partner-white-strip flex h-20 w-36 items-center justify-center rounded-xl border border-white/10 px-4 transition-colors hover:border-neon-purple/30 sm:h-24 sm:w-44"
                  >
                    <Image
                      src={b.logoSrc}
                      alt={b.name}
                      width={140}
                      height={48}
                      className="max-h-10 w-auto object-contain sm:max-h-12"
                      {...localImageUnoptimized(b.logoSrc)}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 rounded-2xl border border-white/10 glass-premium p-6 text-center sm:mt-16 sm:p-10">
            <p className="font-display text-xl font-bold text-white sm:text-2xl">
              Un projet lumineux pour {brand.name} ou votre marque ?
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Maquette gratuite et devis sous 24 h — enseignes, logos néon et
              installations sur mesure.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/#quote" size="lg">
                Demander un projet similaire
              </Button>
              <Button href="/realisations/brands" variant="secondary" size="lg">
                Toutes les marques
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
