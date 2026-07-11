export type AccentColor = "neon-pink" | "neon-purple" | "neon-blue";

export type HeroTrustBlock = {
  enabled: boolean;
  value: string;
  label: string;
  sublabel: string;
};

export type HeroContent = {
  badge: string;
  headline: string;
  headlineAccent: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  backgroundImage: string;
  trustStripLabel: string;
  trustBlock: HeroTrustBlock;
};

/** Hero background slideshow slide — managed via /admin/hero-slider */
export type CMSHeroSlide = {
  id: string;
  src: string;
  alt: string;
  enabled: boolean;
  sortOrder: number;
};

/** @deprecated Legacy homepage projects — use portfolioProjects */
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

export type CMSPortfolioCategory = {
  id: string;
  slug: string;
  title: string;
  titleAccent: string;
  description: string;
  coverImage: string;
  coverAlt: string;
  heroImage: string;
  href: string;
  pageTitle: string;
  pageSubtitle: string;
  enabled: boolean;
  sortOrder: number;
};

export type CMSPortfolioProject = {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  client: string;
  city: string;
  country: string;
  year: string;
  images: string[];
  videos: string[];
  gallery: string[];
  featuredImage: string;
  coverImage: string;
  thumbnail: string;
  imageAlt: string;
  tags: string[];
  accent: AccentColor;
  published: boolean;
  sortOrder: number;
  type?: string;
  typeLabel?: string;
  logoFile?: string;
  installationType?: string;
  beforeImage?: string;
  afterImage?: string;
  relatedProjectSlugs?: string[];
  technologies?: string[];
  filters?: string[];
  seoTitle?: string;
  seoDescription?: string;
  subtitle?: string;
};

export type CMSTestimonial = {
  id: string;
  quote: string;
  /** Client name */
  author: string;
  /** Position / job title */
  role: string;
  /** City / country */
  location: string;
  company?: string;
  photo?: string;
  rating?: number;
  galleryImages?: string[];
  videos?: string[];
  audioFiles?: string[];
  instagramUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  sortOrder: number;
  enabled: boolean;
};

/** Trusted brand logo — managed via /admin/media/logos */
export type CMSPartner = {
  id: string;
  name: string;
  logoUrl: string;
  enabled: boolean;
  sortOrder: number;
};

/** Marques page logo strip — managed via /admin/brands-logos */
export type CMSBrandsPageLogo = CMSPartner;

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
  /** Instagram profile URL for the section CTA. */
  url: string;
};

/** Admin-managed customer review with screenshot gallery for the homepage marquee. */
export type CMSReview = {
  id: string;
  /** Uploaded screenshot images (at least one required for display). */
  screenshots: string[];
  company: string;
  reviewer?: string;
  /** 1–5 star rating. */
  rating: number;
  title?: string;
  description?: string;
  enabled: boolean;
  sortOrder: number;
};

/** Admin-managed Instagram post for the homepage marquee. */
export type CMSInstagramPost = {
  id: string;
  /** Primary cover image (required for display). */
  image: string;
  /** Optional additional carousel images. */
  carouselImages?: string[];
  caption: string;
  instagramUrl: string;
  enabled: boolean;
  sortOrder: number;
};

/** Admin-managed Instagram reel for the homepage marquee. */
export type CMSInstagramReel = {
  id: string;
  videoUrl: string;
  thumbnail: string;
  caption: string;
  instagramUrl: string;
  enabled: boolean;
  sortOrder: number;
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
  /** Official site logo — navbar, footer, admin (Vercel Blob URL) */
  logoUrl?: string;
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
  /** @deprecated use portfolioProjects */
  projects?: CMSProject[];
  portfolioCategories: CMSPortfolioCategory[];
  portfolioProjects: CMSPortfolioProject[];
  testimonials: CMSTestimonial[];
  partners: CMSPartner[];
  brandsPageLogos: CMSBrandsPageLogo[];
  services: CMSService[];
  faq: CMSFAQItem[];
  features: CMSFeature[];
  industries: CMSIndustry[];
  processSteps: CMSProcessStep[];
  sectionCopy: CMSSectionCopy;
  instagram: CMSInstagramSettings;
  reviews: CMSReview[];
  instagramPosts: CMSInstagramPost[];
  instagramReels: CMSInstagramReel[];
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
  | "portfolioCategories"
  | "portfolioProjects"
  | "testimonials"
  | "partners"
  | "brandsPageLogos"
  | "services"
  | "faq"
  | "features"
  | "industries"
  | "processSteps"
  | "sectionCopy"
  | "instagram"
  | "reviews"
  | "instagramPosts"
  | "instagramReels"
  | "nav"
  | "company"
  | "contact"
  | "social"
  | "seo";
