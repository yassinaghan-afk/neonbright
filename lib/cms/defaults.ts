import { createId } from "./id";
import { seedPortfolioCategories, seedPortfolioProjects } from "./portfolio-seed";
import type { CMSContent } from "./types";

export function getDefaultCMSContent(): CMSContent {
  const portfolioCategories = seedPortfolioCategories();
  return {
    hero: {
      badge: "Néon LED & Enseignes Lumineuses · Maroc & International",
      headline: "Leader du néon sur mesure",
      headlineAccent: "et de l'enseigne personnalisée",
      subheadline:
        "Créez votre néon LED ou votre enseigne lumineuse sur mesure. Visualisez votre projet en temps réel grâce à notre designer interactif.",
      primaryCta: "Créer Mon Néon",
      secondaryCta: "Créer Mon Enseigne",
      backgroundImage: "",
      trustBlock: {
        enabled: true,
        value: "200+",
        label: "clients satisfaits",
        sublabel: "",
      },
      trustStripLabel: "Ils nous font confiance",
    },
    heroSlides: [],
    portfolioCategories,
    portfolioProjects: seedPortfolioProjects(portfolioCategories),
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
          "Neon Bright a transformé l'entrée de notre restaurant en un véritable aimant Instagram. La qualité est exceptionnelle — nos clients le photographient chaque soir.",
        author: "Yasmine El Amrani",
        role: "Propriétaire, Lumière Lounge",
        location: "Casablanca, Maroc",
      },
      {
        id: createId("test"),
        quote:
          "Nous avions besoin d'une enseigne logo pour notre flagship à Dubai. Design, production et expédition internationale — un service impeccable.",
        author: "Marcus Chen",
        role: "Directeur créatif, Maison Éclat",
        location: "Dubai, Émirats",
      },
      {
        id: createId("test"),
        quote:
          "Le niveau de détail est incomparable. Le mur néon de notre salle de sport est devenu l'élément central de notre identité de marque.",
        author: "Karim Benali",
        role: "Fondateur, Atlas Fitness",
        location: "Rabat, Maroc",
      },
    ],
    partners: [
      { id: createId("partner"), name: "Atlas Hospitality", logoUrl: "", enabled: true, sortOrder: 0 },
      { id: createId("partner"), name: "Maison Éclat", logoUrl: "", enabled: true, sortOrder: 1 },
      { id: createId("partner"), name: "Nova Corporate", logoUrl: "", enabled: true, sortOrder: 2 },
      { id: createId("partner"), name: "Lumière Lounge", logoUrl: "", enabled: true, sortOrder: 3 },
      { id: createId("partner"), name: "Zenith Retail", logoUrl: "", enabled: true, sortOrder: 4 },
      { id: createId("partner"), name: "Pacific Enseignes", logoUrl: "", enabled: true, sortOrder: 5 },
      { id: createId("partner"), name: "Royal Palm Group", logoUrl: "", enabled: true, sortOrder: 6 },
      { id: createId("partner"), name: "Éclat Boutique", logoUrl: "", enabled: true, sortOrder: 7 },
    ],
    services: [
      {
        id: createId("svc"),
        title: "Qualité artisanale",
        description:
          "Chaque enseigne est fabriquée avec du néon LED flex premium et des matériaux de grade commercial.",
        icon: "✦",
        sortOrder: 0,
        enabled: true,
      },
      {
        id: createId("svc"),
        title: "Design sur mesure",
        description:
          "Du logo à l'installation murale complète — nos designers concrétisent votre vision avec une précision pixel-perfect.",
        icon: "◈",
        sortOrder: 1,
        enabled: true,
      },
      {
        id: createId("svc"),
        title: "Livraison internationale",
        description:
          "Basés au Maroc, nous livrons et installons dans le monde entier avec un service premium.",
        icon: "◎",
        sortOrder: 2,
        enabled: true,
      },
    ],
    faq: [
      {
        id: createId("faq"),
        question: "Quels sont vos délais de production ?",
        answer:
          "Les commandes standard sont livrées en 7 à 14 jours ouvrés. Production express disponible pour projets urgents — contactez-nous pour les délais accélérés.",
        sortOrder: 0,
        enabled: true,
      },
      {
        id: createId("faq"),
        question: "Pouvez-vous reproduire mon logo en néon ?",
        answer:
          "Absolument. Envoyez votre logo (AI, SVG, PNG ou PDF) et nous créons une version néon optimisée pour la technologie LED flex.",
        sortOrder: 1,
        enabled: true,
      },
      {
        id: createId("faq"),
        question: "Livrez-vous à l'international ?",
        answer:
          "Oui. Nous expédions dans le monde entier depuis le Maroc avec emballage sécurisé et suivi complet. Installation locale disponible dans les grandes villes marocaines.",
        sortOrder: 2,
        enabled: true,
      },
      {
        id: createId("faq"),
        question: "Les enseignes LED sont-elles sûres en intérieur ?",
        answer:
          "Oui. Nos enseignes fonctionnent en basse tension (12V), ne produisent aucune chaleur et sont parfaitement sûres pour les espaces commerciaux et résidentiels.",
        sortOrder: 3,
        enabled: true,
      },
      {
        id: createId("faq"),
        question: "Qu'est-ce qui est inclus dans le devis ?",
        answer:
          "Consultation design, production, tests qualité, fixations, adaptateur secteur, variateur (si applicable) et garantie.",
        sortOrder: 4,
        enabled: true,
      },
      {
        id: createId("faq"),
        question: "Puis-je obtenir un devis avant de m'engager ?",
        answer:
          "Bien sûr. Utilisez notre designer interactif ou le formulaire de devis — réponse sous 24 h avec proposition détaillée et aperçu visuel.",
        sortOrder: 5,
        enabled: true,
      },
    ],
    features: [
      {
        id: createId("feat"),
        title: "Qualité artisanale",
        description:
          "Chaque enseigne est fabriquée avec du néon LED flex premium et des matériaux de grade commercial.",
        icon: "✦",
        sortOrder: 0,
        enabled: true,
      },
      {
        id: createId("feat"),
        title: "Design sur mesure",
        description:
          "Du logo à l'installation murale complète — nos designers concrétisent votre vision avec une précision pixel-perfect.",
        icon: "◈",
        sortOrder: 1,
        enabled: true,
      },
      {
        id: createId("feat"),
        title: "Livraison internationale",
        description:
          "Basés au Maroc, nous livrons et installons dans le monde entier avec un service premium.",
        icon: "◎",
        sortOrder: 2,
        enabled: true,
      },
      {
        id: createId("feat"),
        title: "Énergie efficiente",
        description:
          "Technologie LED moderne — jusqu'à 80 % d'économie d'énergie par rapport au néon traditionnel, zéro émission de chaleur.",
        icon: "◉",
        sortOrder: 3,
        enabled: true,
      },
      {
        id: createId("feat"),
        title: "Délais rapides",
        description:
          "Production standard en 7 à 14 jours. Commandes express disponibles pour ouvertures et événements.",
        icon: "◆",
        sortOrder: 4,
        enabled: true,
      },
      {
        id: createId("feat"),
        title: "Support à vie",
        description:
          "Assistance après-vente, garantie et conseils d'entretien pour chaque installation.",
        icon: "◇",
        sortOrder: 5,
        enabled: true,
      },
    ],
    industries: [
      { id: createId("ind"), name: "Néons LED personnalisés", icon: "✨", sortOrder: 0, enabled: true },
      { id: createId("ind"), name: "Enseignes lumineuses", icon: "💡", sortOrder: 1, enabled: true },
      { id: createId("ind"), name: "Logos lumineux", icon: "◎", sortOrder: 2, enabled: true },
      { id: createId("ind"), name: "Enseignes commerciales", icon: "🏪", sortOrder: 3, enabled: true },
      { id: createId("ind"), name: "Signalétique pro", icon: "📍", sortOrder: 4, enabled: true },
      { id: createId("ind"), name: "Hôtels & Resorts", icon: "🏨", sortOrder: 5, enabled: true },
      { id: createId("ind"), name: "Restaurants & Bars", icon: "🍸", sortOrder: 6, enabled: true },
      { id: createId("ind"), name: "Boutiques & Retail", icon: "🛍️", sortOrder: 7, enabled: true },
      { id: createId("ind"), name: "Corporate", icon: "🏢", sortOrder: 8, enabled: true },
    ],
    processSteps: [
      {
        id: createId("step"),
        step: "01",
        title: "Consultation",
        description:
          "Partagez votre vision, logo ou concept. Nous définissons dimensions, couleurs, emplacement et budget.",
        sortOrder: 0,
      },
      {
        id: createId("step"),
        step: "02",
        title: "Design & Maquette",
        description:
          "Nos designers créent une maquette photoréaliste montrant exactement le rendu dans votre espace.",
        sortOrder: 1,
      },
      {
        id: createId("step"),
        step: "03",
        title: "Production",
        description:
          "Fabrication artisanale en néon LED flex premium, testée rigoureusement avant expédition.",
        sortOrder: 2,
      },
      {
        id: createId("step"),
        step: "04",
        title: "Livraison & Pose",
        description:
          "Livraison soignée et installation professionnelle — au Maroc ou expédition sécurisée dans le monde entier.",
        sortOrder: 3,
      },
    ],
    sectionCopy: {
      portfolio: {
        title: "Événements & Expériences",
        headline: "Nos réalisations pour",
        headlineAccent: "événements, festivals et expériences de marque",
        subtitle:
          "Des installations lumineuses conçues pour attirer l'attention, renforcer l'image de marque et créer des expériences mémorables lors d'événements, festivals, salons, concerts et activations marketing.",
      },
      services: {
        title: "Services",
        headline: "Conçu pour l'échelle commerciale",
        subtitle:
          "Néon LED et enseignes lumineuses de grade commercial pour espaces à fort trafic et déploiements multi-sites.",
      },
      industries: {
        title: "Secteurs",
        headline: "Les secteurs que nous équipons",
        subtitle:
          "De la boutique indépendante au siège corporate — nous illuminons tous les espaces professionnels.",
      },
      testimonials: {
        title: "Témoignages",
        headline: "La confiance des grandes marques",
      },
      process: {
        title: "Processus",
        headline: "Du concept à la lumière",
        subtitle:
          "Un parcours en quatre étapes, de votre idée initiale à une installation lumineuse remarquable.",
      },
      faq: {
        title: "FAQ",
        headline: "Questions fréquentes",
        subtitle: "Tout ce qu'il faut savoir sur votre enseigne néon sur mesure.",
        contactLink: "Contactez-nous",
      },
      cta: {
        badge: "Démarrez votre projet",
        headline: "Prêt à illuminer",
        headlineAccent: "votre marque ?",
        subtitle:
          "Maquette photoréaliste et devis commercial gratuits sous 24 h — directement sur le site.",
        primaryCta: "Obtenir un Devis",
        secondaryCta: "Créer Mon Néon",
        trustPoints: [
          "Maquette gratuite",
          "Réponse sous 24 h",
          "Garantie commerciale",
          "Livraison mondiale",
        ],
      },
    },
    instagram: {
      enabled: true,
      title: "Notre Instagram",
      subtitle: "Suivez-nous pour les dernières réalisations et inspirations.",
      buttonText: "Voir sur Instagram",
      url: "https://www.instagram.com/neonbright.ma/",
    },
    nav: [
      { id: createId("nav"), label: "Réalisations", href: "#portfolio", sortOrder: 0, enabled: true },
      { id: createId("nav"), label: "Services", href: "#services", sortOrder: 1, enabled: true },
      { id: createId("nav"), label: "Designer Mon Néon", href: "/designer", sortOrder: 2, enabled: true },
      { id: createId("nav"), label: "Processus", href: "#process", sortOrder: 3, enabled: true },
      { id: createId("nav"), label: "À propos", href: "#about", sortOrder: 4, enabled: true },
      { id: createId("nav"), label: "Contact", href: "#quote", sortOrder: 5, enabled: true },
    ],
    company: {
      name: "Neon Bright",
      tagline: "Premium Custom LED Neon Signs",
      description:
        "Premium custom LED neon signs crafted in Morocco, delivered worldwide.",
      commercialHighlight: "€2M+",
      commercialSubtext: "in delivered installations across 15+ countries",
      footerTagline:
        "Néon LED et enseignes lumineuses sur mesure, fabriqués au Maroc et livrés dans le monde entier. Illuminez votre marque avec excellence.",
    },
    contact: {
      address: "Casablanca, Morocco",
      email: "hello@neonbright.ma",
      phone: "+212 600 000 000",
      whatsapp: "+212600000000",
      googleMapsUrl: "",
      openingHours: "Lun–Ven : 9h–18h",
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
