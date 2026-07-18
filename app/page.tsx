import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { QuoteCTA } from "@/components/quote/QuoteCTA";
import { Footer } from "@/components/Footer";
import { InstagramMarqueeShowcase } from "@/components/instagram/InstagramMarqueeShowcase";
import { ReviewsShowcase } from "@/components/ReviewsShowcase";
import { getPublicHomepageContent } from "@/lib/cms/public";

const WhyChooseUs = dynamic(
  () => import("@/components/WhyChooseUs").then((m) => m.WhyChooseUs),
  { loading: () => null }
);

const Industries = dynamic(
  () => import("@/components/Industries").then((m) => m.Industries),
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

export const revalidate = 3600;

export default async function Home() {
  // Single fresh CMS read for the whole homepage — Instagram showcase data is
  // derived from this same object (see lib/cms/public.ts) instead of issuing
  // a second independent CMS read, so Admin edits still appear immediately
  // after revalidation with only one disk read per request.
  const homepage = await getPublicHomepageContent({ fresh: true });

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
    instagramShowcase,
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
        <ReviewsShowcase reviews={reviews} />
        <WhyChooseUs items={features} copy={sectionCopy.services} />
        <Industries items={industries} copy={sectionCopy.industries} />
        <Testimonials items={testimonials} copy={sectionCopy.testimonials} />
        <Process steps={processSteps} copy={sectionCopy.process} />
        <FAQ items={faq} copy={sectionCopy.faq} />
        <QuoteCTA />
      </main>
      <Footer />
    </>
  );
}
