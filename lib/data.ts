export const navLinks = [
  { label: "Portfolio", href: "#portfolio" },
  { label: "Services", href: "#services" },
  { label: "Designer", href: "/designer" },
  { label: "Process", href: "#process" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#quote" },
];

export type Project = {
  title: string;
  industry: string;
  city: string;
  country: string;
  description: string;
  installationSize: string;
  completedDate: string;
  image: string;
  imageAlt: string;
  accent: "neon-pink" | "neon-purple" | "neon-blue";
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: "Lumière Lounge",
    industry: "Hospitality",
    city: "Casablanca",
    country: "Morocco",
    description:
      "A 8-meter pink and purple neon feature wall for a 400-seat premium rooftop bar overlooking the Atlantic — the signature visual anchor of the venue.",
    installationSize: "8m Feature Wall",
    completedDate: "September 2025",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85&auto=format&fit=crop",
    imageAlt: "Neon-lit rooftop bar interior at Lumière Lounge, Casablanca",
    accent: "neon-pink",
    featured: true,
  },
  {
    title: "Atlas Fitness",
    industry: "Fitness & Wellness",
    city: "Rabat",
    country: "Morocco",
    description:
      "Bold blue neon logo installation across three flagship gym locations — engineered for high-impact visibility in industrial-scale training environments.",
    installationSize: "4m Logo Sign",
    completedDate: "June 2025",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=85&auto=format&fit=crop",
    imageAlt: "Atlas Fitness gym interior with custom neon logo signage",
    accent: "neon-blue",
  },
  {
    title: "Maison Éclat",
    industry: "Luxury Retail",
    city: "Marrakech",
    country: "Morocco",
    description:
      "Elegant script neon storefront signage for a haute couture boutique on Avenue Mohammed V — refined typography meeting artisan LED craftsmanship.",
    installationSize: "3m Storefront",
    completedDate: "March 2025",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=85&auto=format&fit=crop",
    imageAlt: "Maison Éclat luxury boutique storefront with neon signage",
    accent: "neon-purple",
  },
  {
    title: "Nova Tech HQ",
    industry: "Corporate",
    city: "Dubai",
    country: "UAE",
    description:
      "A 12-meter multi-color neon wall installation for a 2,000 sqm technology headquarters lobby — a landmark piece visible from the building's main atrium.",
    installationSize: "12m Installation",
    completedDate: "January 2025",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=85&auto=format&fit=crop",
    imageAlt: "Nova Tech HQ corporate lobby with large-scale neon wall feature",
    accent: "neon-blue",
    featured: true,
  },
  {
    title: "Royal Palm Resort",
    industry: "Hotels & Resorts",
    city: "Agadir",
    country: "Morocco",
    description:
      "Grand entrance neon installation for a five-star beachfront resort — warm gold-pink tones welcoming guests across a 6-meter illuminated archway.",
    installationSize: "6m Entrance Arch",
    completedDate: "November 2024",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85&auto=format&fit=crop",
    imageAlt: "Royal Palm Resort luxury hotel entrance with neon archway",
    accent: "neon-pink",
  },
  {
    title: "Casablanca Mall",
    industry: "Commercial Retail",
    city: "Casablanca",
    country: "Morocco",
    description:
      "Wayfinding and brand neon system for a 45,000 sqm shopping center — 14 custom signs across food court, cinema, and premium retail zones.",
    installationSize: "14-Sign System",
    completedDate: "August 2024",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=85&auto=format&fit=crop",
    imageAlt: "Casablanca Mall interior with commercial neon wayfinding signage",
    accent: "neon-purple",
  },
];

export const trustClients = [
  "Marriott",
  "Sofitel",
  "WeWork",
  "Virgin",
  "Accor",
  "Radisson",
];

export const commercialStats = [
  { value: "€2M+", label: "Commercial Projects" },
  { value: "500+", label: "Installations" },
  { value: "15+", label: "Countries" },
  { value: "4.9★", label: "Client Rating" },
];

export const features = [
  {
    title: "Handcrafted Quality",
    description:
      "Every sign is precision-built with premium LED flex neon and commercial-grade materials built to last.",
    icon: "✦",
  },
  {
    title: "Custom Design",
    description:
      "From logo to full wall installations — our designers bring your vision to life with pixel-perfect accuracy.",
    icon: "◈",
  },
  {
    title: "Global Shipping",
    description:
      "Based in Morocco, trusted worldwide. We deliver and install across continents with white-glove service.",
    icon: "◎",
  },
  {
    title: "Energy Efficient",
    description:
      "Modern LED technology uses up to 80% less energy than traditional glass neon, with zero heat emission.",
    icon: "◉",
  },
  {
    title: "Fast Turnaround",
    description:
      "Standard production in 7–14 days. Rush orders available for events, openings, and time-sensitive launches.",
    icon: "◆",
  },
  {
    title: "Lifetime Support",
    description:
      "Dedicated after-sales support, warranty coverage, and maintenance guidance for every installation.",
    icon: "◇",
  },
];

export const industries = [
  { name: "Restaurants & Bars", icon: "🍸" },
  { name: "Hotels & Resorts", icon: "🏨" },
  { name: "Retail & Boutiques", icon: "🛍️" },
  { name: "Fitness & Wellness", icon: "💪" },
  { name: "Corporate Offices", icon: "🏢" },
  { name: "Events & Weddings", icon: "✨" },
  { name: "Salons & Spas", icon: "💅" },
  { name: "Nightlife & Clubs", icon: "🎵" },
];

export const testimonials = [
  {
    quote:
      "Neon Bright transformed our restaurant entrance into an Instagram magnet. The craftsmanship is extraordinary — guests photograph it every single night.",
    author: "Yasmine El Amrani",
    role: "Owner, Lumière Lounge",
    location: "Casablanca, Morocco",
  },
  {
    quote:
      "We needed a custom logo sign for our Dubai flagship store. They handled design, production, and international shipping flawlessly. World-class service.",
    author: "Marcus Chen",
    role: "Creative Director, Maison Éclat",
    location: "Dubai, UAE",
  },
  {
    quote:
      "The attention to detail is unmatched. Our gym's neon wall has become the defining feature of our brand identity. Worth every dirham.",
    author: "Karim Benali",
    role: "Founder, Atlas Fitness",
    location: "Rabat, Morocco",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Consultation",
    description:
      "Share your vision, logo, or concept. We discuss size, colors, placement, and budget to define the perfect sign.",
  },
  {
    step: "02",
    title: "Design & Mockup",
    description:
      "Our designers create a photorealistic mockup showing exactly how your neon will look in your space.",
  },
  {
    step: "03",
    title: "Production",
    description:
      "Skilled artisans craft your sign using premium LED flex neon, tested rigorously before it leaves our workshop.",
  },
  {
    step: "04",
    title: "Delivery & Install",
    description:
      "White-glove delivery and professional installation — locally in Morocco or shipped securely worldwide.",
  },
];

export const faqs = [
  {
    question: "How long does production take?",
    answer:
      "Standard orders are completed in 7–14 business days. Rush production is available for urgent projects — contact us for expedited timelines.",
  },
  {
    question: "Can you recreate my logo as a neon sign?",
    answer:
      "Absolutely. Send us your logo file (AI, SVG, PNG, or PDF) and we'll design a custom neon version optimized for LED flex technology.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes. We ship worldwide from Morocco with secure packaging and full tracking. Local installation services are available in major Moroccan cities.",
  },
  {
    question: "Are LED neon signs safe for indoor use?",
    answer:
      "Yes. Our signs operate at low voltage (12V), produce no heat, and are completely safe for indoor commercial and residential environments.",
  },
  {
    question: "What's included in the price?",
    answer:
      "Every quote includes design consultation, production, quality testing, mounting hardware, power adapter, dimmer (where applicable), and warranty.",
  },
  {
    question: "Can I get a quote before committing?",
    answer:
      "Of course. Use our instant quote form or upload your logo — we'll respond within 24 hours with a detailed proposal and mockup preview.",
  },
];
