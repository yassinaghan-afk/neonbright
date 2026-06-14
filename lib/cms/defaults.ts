import { createId } from "./id";
import type { CMSContent } from "./types";

export function getDefaultCMSContent(): CMSContent {
  return {
    hero: {
      badge: "Commercial LED Neon · Morocco & International",
      headline: "Transform Your Brand",
      headlineAccent: "Into Light.",
      subheadline:
        "Premium custom LED neon signs for hotels, retail chains, and corporate brands that demand world-class visibility.",
      stats: [
        { id: createId("stat"), value: "€2M+", label: "Commercial Projects" },
        { id: createId("stat"), value: "500+", label: "Installations" },
        { id: createId("stat"), value: "15+", label: "Countries" },
        { id: createId("stat"), value: "4.9★", label: "Client Rating" },
      ],
      trustStripLabel: "Trusted by hospitality groups & global brands",
    },
    projects: [
      {
        id: createId("proj"),
        title: "Lumière Lounge",
        industry: "Hospitality",
        city: "Casablanca",
        country: "Morocco",
        description:
          "A 8-meter pink and purple neon feature wall for a 400-seat premium rooftop bar.",
        installationSize: "8m Feature Wall",
        completedDate: "September 2025",
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85&auto=format&fit=crop",
        imageAlt: "Neon-lit rooftop bar interior at Lumière Lounge",
        accent: "neon-pink",
        featured: true,
      },
      {
        id: createId("proj"),
        title: "Atlas Fitness",
        industry: "Fitness & Wellness",
        city: "Rabat",
        country: "Morocco",
        description: "Bold blue neon logo installation across three flagship gym locations.",
        installationSize: "4m Logo Sign",
        completedDate: "June 2025",
        image:
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=85&auto=format&fit=crop",
        imageAlt: "Atlas Fitness gym with custom neon logo",
        accent: "neon-blue",
        featured: false,
      },
    ],
    testimonials: [
      {
        id: createId("test"),
        quote:
          "Neon Bright transformed our restaurant entrance into an Instagram magnet.",
        author: "Yasmine El Amrani",
        role: "Owner, Lumière Lounge",
        location: "Casablanca, Morocco",
      },
      {
        id: createId("test"),
        quote:
          "They handled design, production, and international shipping flawlessly.",
        author: "Marcus Chen",
        role: "Creative Director, Maison Éclat",
        location: "Dubai, UAE",
      },
    ],
    partners: [
      { id: createId("partner"), name: "Marriott", logoUrl: "" },
      { id: createId("partner"), name: "Sofitel", logoUrl: "" },
      { id: createId("partner"), name: "WeWork", logoUrl: "" },
      { id: createId("partner"), name: "Virgin", logoUrl: "" },
    ],
    services: [
      {
        id: createId("svc"),
        title: "Handcrafted Quality",
        description:
          "Every sign is precision-built with premium LED flex neon and commercial-grade materials.",
        icon: "✦",
      },
      {
        id: createId("svc"),
        title: "Custom Design",
        description:
          "Our designers bring your vision to life with pixel-perfect accuracy.",
        icon: "◈",
      },
      {
        id: createId("svc"),
        title: "Global Shipping",
        description:
          "Based in Morocco, trusted worldwide with white-glove delivery.",
        icon: "◎",
      },
    ],
    company: {
      name: "Neon Bright",
      tagline: "Premium Custom LED Neon Signs",
      description:
        "Premium custom LED neon signs crafted in Morocco, delivered worldwide.",
      commercialHighlight: "€2M+",
      commercialSubtext: "in delivered installations across 15+ countries",
    },
    contact: {
      address: "Casablanca, Morocco",
      email: "hello@neonbright.ma",
      phone: "+212 600 000 000",
    },
    social: {
      instagram: "",
      linkedin: "",
      pinterest: "",
      facebook: "",
      twitter: "",
    },
    seo: {
      title: "Neon Bright | Premium Custom LED Neon Signs",
      description:
        "Premium custom LED neon signs designed for businesses that want to stand out.",
      keywords: "LED neon signs, custom neon, business signage, Morocco",
      ogImage: "",
    },
    updatedAt: new Date().toISOString(),
  };
}
