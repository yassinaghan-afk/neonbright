import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  getEventProjectForPage,
  getEventSlugsForPage,
} from "@/lib/events/server";
import type { EventProject } from "@/lib/events";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getEventSlugsForPage();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getEventProjectForPage(slug);
  if (!project) return { title: "Projet introuvable" };

  return {
    title: `${project.title} | Événements Neon Bright`,
    description: project.shortDescription,
  };
}

function ProjectGallery({ project }: { project: EventProject }) {
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {project.gallery.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl"
        >
          <Image
            src={src}
            alt={`${project.title} — photo ${i + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export default async function EventProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getEventProjectForPage(slug);
  if (!project) notFound();

  const location = `${project.city}, ${project.country}`;

  return (
    <>
      <Navbar />
      <main className="pb-24 pt-28 sm:pb-28 sm:pt-32">
        <Container>
          <Link
            href="/realisations/events"
            className="text-xs font-medium uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-neon-pink"
          >
            ← Événements
          </Link>

          <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 sm:mt-10 sm:rounded-3xl">
            <div className="relative aspect-[4/3] sm:aspect-[21/9]">
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 1280px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-3xl sm:mt-12">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {project.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/55">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                {location}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                {project.year}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                {project.client}
              </span>
            </div>

            <p className="mt-8 text-base leading-relaxed text-white/70 sm:text-lg">
              {project.fullDescription}
            </p>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Technologies utilisées
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-neon-pink/20 bg-neon-pink/10 px-4 py-1.5 text-xs font-medium text-neon-pink"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Galerie
              </p>
              <ProjectGallery project={project} />
            </div>

            <div className="mt-12 rounded-2xl border border-white/10 glass-premium p-6 text-center sm:p-10">
              <p className="font-display text-xl font-bold text-white sm:text-2xl">
                Un projet similaire pour votre événement ?
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                Maquette gratuite et devis sous 24 h — festivals, VIP, corporate
                et activations de marque.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/#quote" size="lg">
                  Demander un projet similaire
                </Button>
                <Button href="/realisations/events" variant="secondary" size="lg">
                  Voir tous les événements
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
