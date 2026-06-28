import { readCMSContent } from "@/lib/cms/store";
import { heroSlideSrc } from "@/lib/cms/hero-media";
import { getPartnerLogosFromMedia, type PartnerLogo } from "@/lib/cms/logo-media";
import { normalizeHeroSlides, normalizePartners, sortByOrder } from "@/lib/cms/normalize";
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
  SocialLinks,
} from "@/lib/cms/types";

export type PublicHomepageContent = {
  heroSlides: CMSHeroSlide[];
  partners: CMSPartner[];
  partnerLogos: PartnerLogo[];
  trustStripLabel: string;
  heroMediaVersion?: string;
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

export async function getPublicHomepageContent(): Promise<PublicHomepageContent> {
  const [content, partnerLogos] = await Promise.all([
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

  const features = sortByOrder(content.features).filter((f) => f.enabled);
  const industries = sortByOrder(content.industries).filter((i) => i.enabled);
  const faq = sortByOrder(content.faq).filter((f) => f.enabled);
  const nav = sortByOrder(content.nav).filter((n) => n.enabled);
  const processSteps = sortByOrder(content.processSteps);

  return {
    heroSlides,
    partners,
    partnerLogos,
    trustStripLabel: content.hero.trustStripLabel || "Ils nous font confiance",
    heroMediaVersion: content.heroMediaVersion,
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
