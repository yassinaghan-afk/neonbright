import { readCMSContent } from "@/lib/cms/store";
import { heroSlideSrc } from "@/lib/cms/hero-media";
import { getPartnerLogosFromMedia, type PartnerLogo } from "@/lib/cms/logo-media";
import { toPortfolioCategory } from "@/lib/cms/portfolio";
import { normalizeHeroSlides, normalizePartners, sortByOrder } from "@/lib/cms/normalize";
import type { PortfolioCategory } from "@/lib/portfolio/types";
import type {
  CMSFAQItem,
  CMSFeature,
  CMSHeroSlide,
  CMSIndustry,
  CMSNavLink,
  CMSPartner,
  CMSProcessStep,
  CMSSectionCopy,
  CMSTestimonial,
  CMSInstagramSettings,
  CompanyInfo,
  ContactInfo,
  HeroContent,
  SocialLinks,
} from "@/lib/cms/types";

export type PublicHomepageContent = {
  hero: HeroContent;
  heroSlides: CMSHeroSlide[];
  partners: CMSPartner[];
  partnerLogos: PartnerLogo[];
  trustStripLabel: string;
  heroMediaVersion?: string;
  portfolioCategories: PortfolioCategory[];
  testimonials: CMSTestimonial[];
  features: CMSFeature[];
  industries: CMSIndustry[];
  processSteps: CMSProcessStep[];
  faq: CMSFAQItem[];
  sectionCopy: CMSSectionCopy;
  instagram: CMSInstagramSettings;
  nav: CMSNavLink[];
  company: CompanyInfo;
  contact: ContactInfo;
  social: SocialLinks;
};

function partnerLogosFromCMS(partners: CMSPartner[]): PartnerLogo[] {
  return partners
    .filter((p) => p.logoUrl)
    .map((p) => ({
      id: p.id,
      src: p.logoUrl.split("?")[0],
      alt: p.name,
    }));
}

export async function getPublicHomepageContent(): Promise<PublicHomepageContent> {
  const [content, filesystemLogos] = await Promise.all([
    readCMSContent(),
    getPartnerLogosFromMedia(),
  ]);

  const heroSlides = sortByOrder(content.heroSlides)
    .filter((s) => s.enabled && s.src)
    .map((s) => ({
      ...s,
      src: heroSlideSrc(s),
    }));

  const partners = sortByOrder(content.partners).filter((p) => p.enabled && p.name);
  const cmsLogos = partnerLogosFromCMS(partners);
  const partnerLogos =
    cmsLogos.length > 0 ? cmsLogos : filesystemLogos;

  const features = sortByOrder(content.features).filter((f) => f.enabled);
  const industries = sortByOrder(content.industries).filter((i) => i.enabled);
  const faq = sortByOrder(content.faq).filter((f) => f.enabled);
  const nav = sortByOrder(content.nav).filter((n) => n.enabled);
  const processSteps = sortByOrder(content.processSteps);

  const portfolioCategories = sortByOrder(content.portfolioCategories)
    .filter((c) => c.enabled)
    .map(toPortfolioCategory);

  return {
    hero: content.hero,
    heroSlides,
    partners,
    partnerLogos,
    trustStripLabel: content.hero.trustStripLabel || "Ils nous font confiance",
    heroMediaVersion: content.heroMediaVersion,
    portfolioCategories,
    testimonials: content.testimonials,
    features,
    industries,
    processSteps,
    faq,
    sectionCopy: content.sectionCopy,
    instagram: content.instagram,
    nav,
    company: content.company,
    contact: content.contact,
    social: content.social,
  };
}

export { normalizeHeroSlides, normalizePartners };
