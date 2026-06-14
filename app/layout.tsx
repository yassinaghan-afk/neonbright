import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { QuoteRoot } from "@/components/quote/QuoteRoot";
import { BRAND_OG_DIMENSIONS, BRAND_OG_IMAGE, BRAND_NAME } from "@/lib/brand";
import { getSiteBaseUrl } from "@/lib/seo/metadata";
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
  title: `${BRAND_NAME} | Premium Custom LED Neon Signs`,
  description:
    "Premium custom LED neon signs designed for businesses that want to stand out. Serving Morocco and international clients.",
  keywords: [
    "LED neon signs",
    "custom neon",
    "business signage",
    "Morocco",
    "neon signs",
  ],
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} | Premium Custom LED Neon Signs`,
    description:
      "Premium custom LED neon signs designed for businesses that want to stand out. Serving Morocco and international clients.",
    images: [
      {
        url: BRAND_OG_IMAGE,
        width: BRAND_OG_DIMENSIONS.width,
        height: BRAND_OG_DIMENSIONS.height,
        alt: `${BRAND_NAME} — Lights Design`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | Premium Custom LED Neon Signs`,
    description:
      "Premium custom LED neon signs designed for businesses that want to stand out.",
    images: [BRAND_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${outfit.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <QuoteRoot>{children}</QuoteRoot>
      </body>
    </html>
  );
}
