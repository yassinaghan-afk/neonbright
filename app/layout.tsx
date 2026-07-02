import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { QuoteRoot } from "@/components/quote/QuoteRoot";
import { ContactSocialProvider } from "@/components/contact/ContactSocialProvider";
import { BrandLogoProvider } from "@/components/brand/BrandLogoProvider";
import { BRAND_OG_DIMENSIONS, BRAND_OG_IMAGE, BRAND_NAME } from "@/lib/brand";
import { getSiteBaseUrl } from "@/lib/seo/metadata";
import { readCMSContentFresh } from "@/lib/cms/store";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  title: `${BRAND_NAME} | Néon LED & Enseignes Lumineuses sur Mesure`,
  description:
    "Leader marocain du néon LED et des enseignes lumineuses personnalisées. Designer interactif, fabrication premium et installation professionnelle au Maroc et à l'international.",
  keywords: [
    "néon LED Maroc",
    "enseigne lumineuse Maroc",
    "enseigne Casablanca",
    "néon personnalisé Maroc",
    "logo lumineux professionnel",
    "enseigne restaurant",
    "enseigne hôtel",
    "enseigne boutique",
    "signalétique professionnelle",
  ],
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    locale: "fr_MA",
    title: `${BRAND_NAME} | Néon LED & Enseignes Lumineuses sur Mesure`,
    description:
      "Créez votre néon LED ou enseigne lumineuse sur mesure. Visualisez en temps réel avec notre designer interactif. Devis gratuit sous 24 h.",
    images: [
      {
        url: BRAND_OG_IMAGE,
        width: BRAND_OG_DIMENSIONS.width,
        height: BRAND_OG_DIMENSIONS.height,
        alt: BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | Néon LED & Enseignes Lumineuses`,
    description:
      "Néon LED et enseignes lumineuses premium sur mesure — Maroc & international.",
    images: [BRAND_OG_IMAGE],
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { contact, social, instagram, company } = await readCMSContentFresh();

  return (
    <html
      lang="fr"
      className={`${plusJakarta.variable} ${outfit.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <BrandLogoProvider logoUrl={company.logoUrl}>
          <ContactSocialProvider
            contact={contact}
            social={social}
            instagramSettingsUrl={instagram.url}
          >
            <QuoteRoot>{children}</QuoteRoot>
          </ContactSocialProvider>
        </BrandLogoProvider>
      </body>
    </html>
  );
}
