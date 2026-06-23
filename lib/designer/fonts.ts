export type FontSection = "double-line" | "single-line" | "arabic";

/** @deprecated Use section field on EditorFont */
export type FontCategory =
  | "Block Neon"
  | "Modern Neon"
  | "Luxury Neon"
  | "Corporate Neon"
  | "Script Neon"
  | "Single Line Neon"
  | "Arabic Modern"
  | "Arabic Signature"
  | "Arabic Luxury"
  | "Arabic Neon"
  | "Arabic Single Line"
  | "Arabic Naskh"
  | "Arabic Kufi";

export type EditorFont = {
  id: string;
  label: string;
  section: FontSection;
  category: FontCategory;
  family: string;
  preview: string;
  weight?: "normal" | "bold";
  rtl?: boolean;
  tubeFriendly?: boolean;
};

export const FONT_SECTIONS: { id: FontSection; label: string; description: string }[] = [
  {
    id: "double-line",
    label: "Double Line Fonts",
    description: "Outer + inner contour — modern, corporate, luxury & block styles",
  },
  {
    id: "single-line",
    label: "Single Line Fonts",
    description: "One continuous neon tube — script & signature styles",
  },
  {
    id: "arabic",
    label: "Arabic Fonts",
    description: "Connected Arabic letterforms with proper RTL shaping",
  },
];

export const EDITOR_FONTS: EditorFont[] = [
  // Double Line Fonts
  { id: "bebas-neue", label: "Archlight", category: "Modern Neon", section: "double-line", family: "Bebas Neue", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "oswald", label: "Oswald", category: "Modern Neon", section: "double-line", family: "Oswald", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "montserrat", label: "Montserrat", category: "Modern Neon", section: "double-line", family: "Montserrat", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "quicksand", label: "Quicksand", category: "Modern Neon", section: "double-line", family: "Quicksand", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "orbitron", label: "Orbitron", category: "Corporate Neon", section: "double-line", family: "Orbitron", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "audiowide", label: "Audiowide", category: "Corporate Neon", section: "double-line", family: "Audiowide", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "exo-2", label: "Exo 2", category: "Corporate Neon", section: "double-line", family: "Exo 2", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "italiana", label: "Italiana", category: "Luxury Neon", section: "double-line", family: "Italiana", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "cormorant", label: "Cormorant", category: "Luxury Neon", section: "double-line", family: "Cormorant Garamond", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "playfair", label: "Playfair", category: "Luxury Neon", section: "double-line", family: "Playfair Display", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "league-spartan", label: "Spartan Block", category: "Block Neon", section: "double-line", family: "League Spartan", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "barlow-condensed", label: "Barlow Block", category: "Block Neon", section: "double-line", family: "Barlow Condensed", preview: "Neon", weight: "normal", tubeFriendly: true },

  // Single Line Fonts
  { id: "great-vibes", label: "Aline", category: "Single Line Neon", section: "single-line", family: "Great Vibes", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "pacifico-script", label: "Rocket", category: "Single Line Neon", section: "single-line", family: "Pacifico", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "kaushan-script", label: "Wonderplay", category: "Single Line Neon", section: "single-line", family: "Kaushan Script", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "alex-brush", label: "Signature", category: "Single Line Neon", section: "single-line", family: "Alex Brush", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "sacramento", label: "Sacramento", category: "Single Line Neon", section: "single-line", family: "Sacramento", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "caveat", label: "Signatera", category: "Single Line Neon", section: "single-line", family: "Caveat", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "parisienne", label: "Parisienne", category: "Single Line Neon", section: "single-line", family: "Parisienne", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "dancing-script", label: "Maria", category: "Script Neon", section: "single-line", family: "Dancing Script", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "allura", label: "Allura", category: "Script Neon", section: "single-line", family: "Allura", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "cookie", label: "Cookie", category: "Script Neon", section: "single-line", family: "Cookie", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "mr-dafoe", label: "Mr Dafoe", category: "Script Neon", section: "single-line", family: "Mr Dafoe", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "pinyon-script", label: "Pinyon", category: "Script Neon", section: "single-line", family: "Pinyon Script", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "satisfy", label: "Andres", category: "Script Neon", section: "single-line", family: "Satisfy", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "tangerine", label: "Tangerine", category: "Script Neon", section: "single-line", family: "Tangerine", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "yellowtail", label: "Yellowtail", category: "Script Neon", section: "single-line", family: "Yellowtail", preview: "Neon", weight: "normal", tubeFriendly: true },
  { id: "jost", label: "Jost Line", category: "Single Line Neon", section: "single-line", family: "Jost", preview: "Neon", weight: "normal", tubeFriendly: true },

  // Arabic Fonts
  { id: "arabic-modern", label: "Arabic Modern", category: "Arabic Modern", section: "arabic", family: "Cairo", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-display", label: "Arabic Display", category: "Arabic Modern", section: "arabic", family: "El Messiri", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-sans", label: "Arabic Sans", category: "Arabic Modern", section: "arabic", family: "Noto Sans Arabic", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-script", label: "Arabic Signature", category: "Arabic Signature", section: "arabic", family: "Amiri", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-handwritten", label: "Arabic Handwritten", category: "Arabic Signature", section: "arabic", family: "Aref Ruqaa", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-calligraphy", label: "Arabic Calligraphy", category: "Arabic Signature", section: "arabic", family: "Scheherazade New", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-luxury", label: "Arabic Luxury", category: "Arabic Luxury", section: "arabic", family: "Lateef", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-elegant", label: "Arabic Elegant", category: "Arabic Luxury", section: "arabic", family: "Markazi Text", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-neon", label: "Arabic Neon", category: "Arabic Neon", section: "arabic", family: "Rakkas", preview: "نيون", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-thin", label: "Arabic Single Line", category: "Arabic Single Line", section: "arabic", family: "Harmattan", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-naskh", label: "Arabic Naskh", category: "Arabic Naskh", section: "arabic", family: "Noto Naskh Arabic", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
  { id: "arabic-kufi", label: "Arabic Kufi", category: "Arabic Kufi", section: "arabic", family: "Reem Kufi", preview: "سلام", weight: "normal", rtl: true, tubeFriendly: true },
];

export function categoriesInSection(section: FontSection): FontCategory[] {
  const seen = new Set<FontCategory>();
  const out: FontCategory[] = [];
  for (const font of EDITOR_FONTS) {
    if (font.section !== section || seen.has(font.category)) continue;
    seen.add(font.category);
    out.push(font.category);
  }
  return out;
}

export const FALLBACK_FONT_ID = "kaushan-script";

export function resolveSafeFontId(fontId: string): string {
  return EDITOR_FONTS.some((f) => f.id === fontId) ? fontId : FALLBACK_FONT_ID;
}

export function resolveFontFamily(fontId: string): string {
  return EDITOR_FONTS.find((f) => f.id === resolveSafeFontId(fontId))?.family ?? "Kaushan Script";
}

export function resolveFontWeight(fontId: string): "normal" | "bold" {
  return EDITOR_FONTS.find((f) => f.id === resolveSafeFontId(fontId))?.weight ?? "normal";
}

export function isFontRtl(fontId: string): boolean {
  return EDITOR_FONTS.find((f) => f.id === resolveSafeFontId(fontId))?.rtl ?? false;
}

export function fontSectionForId(fontId: string): FontSection {
  return EDITOR_FONTS.find((f) => f.id === resolveSafeFontId(fontId))?.section ?? "single-line";
}

export function displayModeForSection(section: FontSection): "single" | "double" {
  return section === "double-line" ? "double" : "single";
}

export function isTubeFriendlyFont(fontId: string): boolean {
  const font = EDITOR_FONTS.find((f) => f.id === fontId);
  return font?.tubeFriendly !== false;
}

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  [...new Set(EDITOR_FONTS.map((f) => f.family.replace(/ /g, "+")))]
    .map((f) => `family=${f}:wght@400;700`)
    .join("&") +
  "&display=swap";
