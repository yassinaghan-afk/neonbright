export type AccentColor = "neon-pink" | "neon-purple" | "neon-blue";

export type HeroStat = { id: string; value: string; label: string };

export type HeroContent = {
  badge: string;
  headline: string;
  headlineAccent: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  helperText: string;
  backgroundImage: string;
  stats: HeroStat[];
  trustStripLabel: string;
};

/** Hero background slideshow slide — managed via /admin/hero-slider */
export type CMSHeroSlide = {
  id: string;
  src: string;
  alt: string;
  enabled: boolean;
  sortOrder: number;
};

export type CMSProject = {
  id: string;
  title: string;
  industry: string;
  city: string;
  country: string;
  description: string;
  installationSize: string;
  completedDate: string;
  image: string;
  imageAlt: string;
  accent: AccentColor;
  featured: boolean;
};

export type CMSTestimonial = {
  id: string;
  quote: string;
  author: string;
  role: string;
  location: string;
  photo?: string;
  rating?: number;
  company?: string;
};

/** Trusted brand logo — managed via /admin/media/logos */
export type CMSPartner = {
  id: string;
  name: string;
  logoUrl: string;
  enabled: boolean;
  sortOrder: number;
};

export type CMSService = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder?: number;
  enabled?: boolean;
};

export type CMSFAQItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  enabled: boolean;
};

export type CMSFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  enabled: boolean;
};

export type CMSIndustry = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  enabled: boolean;
};

export type CMSProcessStep = {
  id: string;
  step: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type CMSNavLink = {
  id: string;
  label: string;
  href: string;
  sortOrder: number;
  enabled: boolean;
};

export type CMSInstagramSettings = {
  enabled: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  url: string;
};

export type CMSSectionCopy = {
  portfolio: { title: string; headline: string; headlineAccent: string; subtitle: string };
  services: { title: string; headline: string; subtitle: string };
  industries: { title: string; headline: string; subtitle: string };
  testimonials: { title: string; headline: string };
  process: { title: string; headline: string; subtitle: string };
  faq: { title: string; headline: string; subtitle: string; contactLink: string };
  cta: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    trustPoints: string[];
  };
};

export type CompanyInfo = {
  name: string;
  tagline: string;
  description: string;
  commercialHighlight: string;
  commercialSubtext: string;
  footerTagline?: string;
};

export type ContactInfo = {
  address: string;
  email: string;
  phone: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  openingHours?: string;
};

export type SocialLinks = {
  instagram: string;
  linkedin: string;
  pinterest: string;
  facebook: string;
  twitter: string;
};

export type SEOMetadata = {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
};

export type CMSContent = {
  hero: HeroContent;
  heroSlides: CMSHeroSlide[];
  /** Busts browser cache when hero media is re-synced from MEDIA/hero-slider */
  heroMediaVersion?: string;
  projects: CMSProject[];
  testimonials: CMSTestimonial[];
  partners: CMSPartner[];
  services: CMSService[];
  faq: CMSFAQItem[];
  features: CMSFeature[];
  industries: CMSIndustry[];
  processSteps: CMSProcessStep[];
  sectionCopy: CMSSectionCopy;
  instagram: CMSInstagramSettings;
  nav: CMSNavLink[];
  company: CompanyInfo;
  contact: ContactInfo;
  social: SocialLinks;
  seo: SEOMetadata;
  updatedAt: string;
};

export type CMSSection =
  | "hero"
  | "heroSlides"
  | "projects"
  | "testimonials"
  | "partners"
  | "services"
  | "faq"
  | "features"
  | "industries"
  | "processSteps"
  | "sectionCopy"
  | "instagram"
  | "nav"
  | "company"
  | "contact"
  | "social"
  | "seo";
