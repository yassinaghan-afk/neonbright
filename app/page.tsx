import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { QuoteCTA } from "@/components/quote/QuoteCTA";
import { Footer } from "@/components/Footer";
import { getPublicHomepageContent } from "@/lib/cms/public";
import { getInstagramShowcase } from "@/lib/instagram/showcase";

const InstagramMarqueeShowcase = dynamic(
  () =>
    import("@/components/instagram/InstagramMarqueeShowcase").then(
      (m) => m.InstagramMarqueeShowcase
    ),
  { loading: () => null }
);

const WhyChooseUs = dynamic(
  () => import("@/components/WhyChooseUs").then((m) => m.WhyChooseUs),
  { loading: () => null }
);

const Industries = dynamic(
  () => import("@/components/Industries").then((m) => m.Industries),
  { loading: () => null }
);

const ReviewsShowcase = dynamic(
  () => import("@/components/ReviewsShowcase").then((m) => m.ReviewsShowcase),
  { loading: () => null }
);

const Testimonials = dynamic(
  () => import("@/components/Testimonials").then((m) => m.Testimonials),
  { loading: () => null }
);

const Process = dynamic(
  () => import("@/components/Process").then((m) => m.Process),
  { loading: () => null }
);

const FAQ = dynamic(
  () => import("@/components/FAQ").then((m) => m.FAQ),
  { loading: () => null }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [homepage, instagramShowcase] = await Promise.all([
    // Fresh CMS read so Admin Reviews (and other) edits appear on the live
    // homepage immediately after revalidation — no stale ISR/data-cache gap.
    getPublicHomepageContent({ fresh: true }),
    getInstagramShowcase(),
  ]);

  const {
    hero,
    heroSlides,
    partnerLogos,
    trustStripLabel,
    portfolioCategories,
    testimonials,
    reviews,
    features,
    industries,
    processSteps,
    faq,
    sectionCopy,
    nav,
  } = homepage;

  return (
    <>
      <Navbar nav={nav} />
      <main>
        <Hero slides={heroSlides} hero={hero} />
        <PartnerLogoStrip logos={partnerLogos} label={trustStripLabel} />
        <FeaturedProjects copy={sectionCopy.portfolio} categories={portfolioCategories} />
        <InstagramMarqueeShowcase data={instagramShowcase} />
        <WhyChooseUs items={features} copy={sectionCopy.services} />
        <Industries items={industries} copy={sectionCopy.industries} />
        <ReviewsShowcase reviews={reviews} />
        <Testimonials items={testimonials} copy={sectionCopy.testimonials} />
        <Process steps={processSteps} copy={sectionCopy.process} />
        <FAQ items={faq} copy={sectionCopy.faq} />
        <QuoteCTA />
      </main>
      <Footer />
    </>
  );
}
