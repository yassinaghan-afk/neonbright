import { sectionCopy as staticCopy } from "@/lib/data";
import { brandsCategory } from "@/lib/brands/types";
import { eventsCategory } from "@/lib/events";
import { CategoryCard } from "@/components/portfolio/CategoryCard";
import { Container } from "@/components/ui/Container";
import { SectionDivider, SectionReveal } from "@/components/ui/SectionReveal";

type PortfolioCopy = {
  title: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
};

type FeaturedProjectsProps = {
  copy?: PortfolioCopy;
};

export function FeaturedProjects({ copy }: FeaturedProjectsProps) {
  const sectionsCopy = copy ?? staticCopy.portfolio;

  return (
    <>
      <SectionDivider />
      <section
        id="portfolio"
        className="section-glow-top relative overflow-hidden py-20 sm:py-28 md:py-32"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,45,149,0.08),transparent_70%)]"
        />

        <Container>
          <SectionReveal className="relative mx-auto max-w-4xl text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neon-pink sm:text-xs sm:tracking-[0.32em]">
              {sectionsCopy.title}
            </span>
            <h2 className="display-headline mx-auto mt-6 max-w-4xl text-[2rem] sm:mt-8 sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem]">
              <span className="block text-white">{sectionsCopy.headline}</span>
              <span className="mt-1 block text-white sm:mt-1.5">
                {sectionsCopy.headlineAccent}
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-muted sm:mt-8 sm:text-lg">
              {sectionsCopy.subtitle}
            </p>
          </SectionReveal>

          <div className="mt-14 space-y-6 sm:mt-16 sm:space-y-7 md:mt-20 md:space-y-8">
            <SectionReveal delay={0.1}>
              <CategoryCard category={eventsCategory} />
            </SectionReveal>

            <SectionReveal delay={0.15}>
              <CategoryCard category={brandsCategory} />
            </SectionReveal>
          </div>
        </Container>
      </section>
    </>
  );
}
