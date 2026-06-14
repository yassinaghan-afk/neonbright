import type { Metadata } from "next";
import {
  Bebas_Neue,
  Montserrat,
  Pacifico,
  Playfair_Display,
  Anton,
  Outfit,
} from "next/font/google";
import { GOOGLE_FONTS_URL } from "@/lib/designer/fonts";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Neon Design Editor | Neon Bright",
  description: "Canva-style neon sign design editor with wall mockups.",
};

export default function DesignerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      <div
        className={`${outfit.variable} ${bebas.variable} ${pacifico.variable} ${anton.variable} ${playfair.variable} ${montserrat.variable}`}
      >
        {children}
      </div>
    </>
  );
}
