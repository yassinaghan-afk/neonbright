export const WALL_ACCEPT = "image/jpeg,image/png,image/webp";
export const LOGO_ACCEPT = ".png,.svg,.pdf,.ai,image/png,image/svg+xml,application/pdf";

export const NEON_COLORS = [
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "warm-white", label: "Warm White", hex: "#fff4e0" },
  { id: "pink", label: "Pink", hex: "#ff2d95" },
  { id: "purple", label: "Purple", hex: "#a855f7" },
  { id: "blue", label: "Blue", hex: "#38bdf8" },
  { id: "red", label: "Red", hex: "#ef4444" },
  { id: "green", label: "Green", hex: "#4ade80" },
  { id: "yellow", label: "Yellow", hex: "#fde047" },
  { id: "orange", label: "Orange", hex: "#f97316" },
] as const;

export const DESIGNER_FONTS = [
  { id: "outfit", label: "Modern Sans", preview: "Aa", family: "var(--font-heading)", css: "var(--font-heading), sans-serif" },
  { id: "pacifico", label: "Script Neon", preview: "Aa", family: "var(--font-pacifico)", css: "var(--font-pacifico), cursive" },
  { id: "playfair", label: "Luxury Serif", preview: "Aa", family: "var(--font-playfair)", css: "var(--font-playfair), serif" },
  { id: "bebas", label: "Retro Neon", preview: "Aa", family: "var(--font-bebas)", css: "var(--font-bebas), sans-serif" },
  { id: "montserrat", label: "Handwritten", preview: "Aa", family: "var(--font-montserrat)", css: "var(--font-montserrat), sans-serif" },
  { id: "anton", label: "Bold Display", preview: "Aa", family: "var(--font-anton)", css: "var(--font-anton), sans-serif" },
] as const;

export const FONT_SIZE_MIN = 20;
export const FONT_SIZE_MAX = 120;
export const GLOW_MIN = 0;
export const GLOW_MAX = 100;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const SCALE_MIN = 0.3;
export const SCALE_MAX = 3;
