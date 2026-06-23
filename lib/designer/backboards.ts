export type BackboardType =
  | "none"
  | "transparent-acrylic"
  | "transparent-acrylic-offset"
  | "black-acrylic"
  | "white-acrylic"
  | "rectangle"
  | "rounded-rectangle"
  | "circle"
  | "oval"
  | "custom-shape"
  | "cut-around-letters";

/** Acrylic border offset around neon text (cm) */
export const ACRYLIC_OFFSET_CM = 2;

/** Legacy IDs from earlier versions */
const LEGACY_MAP: Record<string, BackboardType> = {
  "cut-letters": "transparent-acrylic-offset",
  "cut-around-letters": "transparent-acrylic-offset",
  "rect-transparent": "transparent-acrylic",
  "rect-black": "black-acrylic",
  "rect-white": "white-acrylic",
  custom: "custom-shape",
};

export function normalizeBackboardType(type: string): BackboardType {
  if (LEGACY_MAP[type]) return LEGACY_MAP[type];
  return type as BackboardType;
}

export type BackboardOption = {
  id: BackboardType;
  label: string;
  description: string;
  featured?: boolean;
};

export const BACKBOARD_OPTIONS: BackboardOption[] = [
  {
    id: "transparent-acrylic-offset",
    label: "Acrylique transparent décalé",
    description: "Plexiglass transparent — contour texte + 2 cm",
    featured: true,
  },
  {
    id: "transparent-acrylic",
    label: "Acrylique transparent",
    description: "Plexiglass transparent — le plus populaire",
    featured: true,
  },
  {
    id: "black-acrylic",
    label: "Acrylique noir",
    description: "Noir brillant premium",
    featured: true,
  },
  {
    id: "none",
    label: "Sans support",
    description: "Néon flottant uniquement",
  },
  {
    id: "white-acrylic",
    label: "Acrylique blanc",
    description: "Support blanc laqué",
  },
  {
    id: "rectangle",
    label: "Rectangle",
    description: "Panneau rectangulaire",
  },
  {
    id: "rounded-rectangle",
    label: "Rectangle arrondi",
    description: "Coins arrondis premium",
  },
  {
    id: "circle",
    label: "Cercle",
    description: "Support circulaire",
  },
  {
    id: "oval",
    label: "Ovale",
    description: "Support ovale",
  },
  {
    id: "custom-shape",
    label: "Forme personnalisée",
    description: "Contour sur mesure",
  },
  {
    id: "cut-around-letters",
    label: "Découpe autour des lettres",
    description: "Lettres découpées individuellement",
  },
];

export const FEATURED_BACKBOARDS = BACKBOARD_OPTIONS.filter((o) => o.featured);
export const OTHER_BACKBOARDS = BACKBOARD_OPTIONS.filter((o) => !o.featured);
