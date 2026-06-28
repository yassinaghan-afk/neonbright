import { readCMSContent } from "@/lib/cms/store";
import { heroSlideSrc } from "@/lib/cms/hero-media";
import {
  getPartnerLogosFromMedia,
  isLogoMediaSyncEnabled,
  type PartnerLogo,
} from "@/lib/cms/logo-media";
import { resolvePublicAsset } from "@/lib/media/public-asset";
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


function partnerLogosFromMediaDir(content: Awaited<ReturnType<typeof readCMSContent>>): PartnerLogo[] {
  const seen = new Set<string>();
  const logos: PartnerLogo[] = [];
  for (const file of content.portfolioProjects) {
    if (!file.logoFile || seen.has(file.logoFile)) continue;
    seen.add(file.logoFile);
    const src = resolvePublicAsset(`/media/logo/${encodeURIComponent(file.logoFile)}`);
    if (!src) continue;
    logos.push({
      id: `logo_${file.logoFile.replace(/[^a-z0-9]+/gi, "_").slice(0, 40)}`,
      src,
      alt: file.title,
    });
  }
  return logos;
}

export async function getPublicHomepageContent(): Promise<PublicHomepageContent> {
  const content = await readCMSContent();

  const partnerLogos = isLogoMediaSyncEnabled()
    ? await getPartnerLogosFromMedia()
    : partnerLogosFromMediaDir(content);

  const heroSlides = sortByOrder(content.heroSlides)
    .filter((s) => s.enabled && s.src)
    .map((s) => ({
      ...s,
      src: resolvePublicAsset(heroSlideSrc(s)) ?? heroSlideSrc(s),
    }));

  const partners = sortByOrder(content.partners).filter((p) => p.enabled && p.name);

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
