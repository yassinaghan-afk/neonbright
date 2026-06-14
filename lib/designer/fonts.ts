export type FontCategory =
  | "Modern"
  | "Luxury"
  | "Script"
  | "Handwritten"
  | "Retro"
  | "Corporate"
  | "Wedding"
  | "Minimal"
  | "Bold"
  | "Neon Classic";

export type EditorFont = {
  id: string;
  label: string;
  category: FontCategory;
  family: string;
  preview: string;
};

export const FONT_CATEGORIES: FontCategory[] = [
  "Modern",
  "Luxury",
  "Script",
  "Handwritten",
  "Retro",
  "Corporate",
  "Wedding",
  "Minimal",
  "Bold",
  "Neon Classic",
];

export const EDITOR_FONTS: EditorFont[] = [
  { id: "outfit-modern", label: "Outfit", category: "Modern", family: "Outfit", preview: "Aa" },
  { id: "inter-modern", label: "Inter", category: "Modern", family: "Inter", preview: "Aa" },
  { id: "poppins-modern", label: "Poppins", category: "Modern", family: "Poppins", preview: "Aa" },
  { id: "montserrat-modern", label: "Montserrat", category: "Modern", family: "Montserrat", preview: "Aa" },
  { id: "roboto-modern", label: "Roboto", category: "Modern", family: "Roboto", preview: "Aa" },
  { id: "opensans-modern", label: "Open Sans", category: "Modern", family: "Open Sans", preview: "Aa" },
  { id: "playfair-luxury", label: "Playfair", category: "Luxury", family: "Playfair Display", preview: "Aa" },
  { id: "cormorant-luxury", label: "Cormorant", category: "Luxury", family: "Cormorant Garamond", preview: "Aa" },
  { id: "libre-luxury", label: "Libre Baskerville", category: "Luxury", family: "Libre Baskerville", preview: "Aa" },
  { id: "cinzel-luxury", label: "Cinzel", category: "Luxury", family: "Cinzel", preview: "Aa" },
  { id: "pacifico-script", label: "Pacifico", category: "Script", family: "Pacifico", preview: "Aa" },
  { id: "greatvibes-script", label: "Great Vibes", category: "Script", family: "Great Vibes", preview: "Aa" },
  { id: "dancing-script", label: "Dancing Script", category: "Script", family: "Dancing Script", preview: "Aa" },
  { id: "sacramento-script", label: "Sacramento", category: "Script", family: "Sacramento", preview: "Aa" },
  { id: "caveat-hand", label: "Caveat", category: "Handwritten", family: "Caveat", preview: "Aa" },
  { id: "patrick-hand", label: "Patrick Hand", category: "Handwritten", family: "Patrick Hand", preview: "Aa" },
  { id: "indie-hand", label: "Indie Flower", category: "Handwritten", family: "Indie Flower", preview: "Aa" },
  { id: "shadows-hand", label: "Shadows Into Light", category: "Handwritten", family: "Shadows Into Light", preview: "Aa" },
  { id: "bebas-retro", label: "Bebas Neue", category: "Retro", family: "Bebas Neue", preview: "Aa" },
  { id: "anton-retro", label: "Anton", category: "Retro", family: "Anton", preview: "Aa" },
  { id: "alfa-retro", label: "Alfa Slab One", category: "Retro", family: "Alfa Slab One", preview: "Aa" },
  { id: "russo-retro", label: "Russo One", category: "Retro", family: "Russo One", preview: "Aa" },
  { id: "ibm-corp", label: "IBM Plex Sans", category: "Corporate", family: "IBM Plex Sans", preview: "Aa" },
  { id: "source-corp", label: "Source Sans 3", category: "Corporate", family: "Source Sans 3", preview: "Aa" },
  { id: "worksans-corp", label: "Work Sans", category: "Corporate", family: "Work Sans", preview: "Aa" },
  { id: "tangerine-wed", label: "Tangerine", category: "Wedding", family: "Tangerine", preview: "Aa" },
  { id: "allura-wed", label: "Allura", category: "Wedding", family: "Allura", preview: "Aa" },
  { id: "jost-minimal", label: "Jost", category: "Minimal", family: "Jost", preview: "Aa" },
  { id: "dmsans-minimal", label: "DM Sans", category: "Minimal", family: "DM Sans", preview: "Aa" },
  { id: "nunito-minimal", label: "Nunito Sans", category: "Minimal", family: "Nunito Sans", preview: "Aa" },
  { id: "oswald-bold", label: "Oswald", category: "Bold", family: "Oswald", preview: "Aa" },
  { id: "blackops-bold", label: "Black Ops One", category: "Bold", family: "Black Ops One", preview: "Aa" },
  { id: "archivo-bold", label: "Archivo Black", category: "Bold", family: "Archivo Black", preview: "Aa" },
  { id: "monoton-neon", label: "Monoton", category: "Neon Classic", family: "Monoton", preview: "Aa" },
  { id: "bungee-neon", label: "Bungee", category: "Neon Classic", family: "Bungee", preview: "Aa" },
  { id: "rampart-neon", label: "Rampart One", category: "Neon Classic", family: "Rampart One", preview: "Aa" },
  { id: "orbitron-neon", label: "Orbitron", category: "Neon Classic", family: "Orbitron", preview: "Aa" },
];

export function resolveFontFamily(fontId: string): string {
  return EDITOR_FONTS.find((f) => f.id === fontId)?.family ?? "Outfit";
}

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  [...new Set(EDITOR_FONTS.map((f) => f.family.replace(/ /g, "+")))]
    .map((f) => `family=${f}:wght@400;700`)
    .join("&") +
  "&display=swap";
