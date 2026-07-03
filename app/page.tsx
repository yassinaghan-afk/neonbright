import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { InstagramMarqueeShowcase } from "@/components/instagram/InstagramMarqueeShowcase";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { Industries } from "@/components/Industries";
import { Testimonials } from "@/components/Testimonials";
import { Process } from "@/components/Process";
import { FAQ } from "@/components/FAQ";
import { QuoteCTA } from "@/components/quote/QuoteCTA";
import { Footer } from "@/components/Footer";
import { getPublicHomepageContent } from "@/lib/cms/public";
import { getInstagramShowcase } from "@/lib/instagram/showcase";
import { logCmsSync } from "@/lib/cms/sync-log";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [homepage, instagramShowcase] = await Promise.all([
    getPublicHomepageContent(),
    getInstagramShowcase(),
  ]);

  const {
    hero,
    heroSlides,
    partnerLogos,
    trustStripLabel,
    portfolioCategories,
    testimonials,
    features,
    industries,
    processSteps,
    faq,
    sectionCopy,
    nav,
  } = homepage;

  logCmsSync("website-render", {
    testimonials: testimonials.length,
    headline: sectionCopy.testimonials.headline,
    firstAuthor: testimonials[0]?.author,
    firstQuote: testimonials[0]?.quote?.slice(0, 40),
  });

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
        <Testimonials items={testimonials} copy={sectionCopy.testimonials} />
        <Process steps={processSteps} copy={sectionCopy.process} />
        <FAQ items={faq} copy={sectionCopy.faq} />
        <QuoteCTA />
      </main>
      <Footer />
    </>
  );
}
