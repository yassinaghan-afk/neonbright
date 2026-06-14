export type AccentColor = "neon-pink" | "neon-purple" | "neon-blue";

export type HeroStat = { id: string; value: string; label: string };

export type HeroContent = {
  badge: string;
  headline: string;
  headlineAccent: string;
  subheadline: string;
  stats: HeroStat[];
  trustStripLabel: string;
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
};

export type CMSPartner = {
  id: string;
  name: string;
  logoUrl: string;
};

export type CMSService = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type CompanyInfo = {
  name: string;
  tagline: string;
  description: string;
  commercialHighlight: string;
  commercialSubtext: string;
};

export type ContactInfo = {
  address: string;
  email: string;
  phone: string;
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
  projects: CMSProject[];
  testimonials: CMSTestimonial[];
  partners: CMSPartner[];
  services: CMSService[];
  company: CompanyInfo;
  contact: ContactInfo;
  social: SocialLinks;
  seo: SEOMetadata;
  updatedAt: string;
};

export type CMSSection =
  | "hero"
  | "projects"
  | "testimonials"
  | "partners"
  | "services"
  | "company"
  | "contact"
  | "social"
  | "seo";
