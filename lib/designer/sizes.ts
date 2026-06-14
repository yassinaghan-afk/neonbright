export type SizePreset = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type MountingType = "wall-mount" | "hanging" | "freestanding" | "adhesive";

export const SIZE_PRESETS: {
  id: SizePreset;
  label: string;
  cm: number;
  display: string;
}[] = [
  { id: "XS", label: "XS", cm: 30, display: "30 cm" },
  { id: "S", label: "S", cm: 60, display: "60 cm" },
  { id: "M", label: "M", cm: 90, display: "90 cm" },
  { id: "L", label: "L", cm: 120, display: "120 cm" },
  { id: "XL", label: "XL", cm: 150, display: "150 cm" },
  { id: "XXL", label: "XXL", cm: 200, display: "200 cm+" },
];

export const MOUNTING_OPTIONS: { id: MountingType; label: string; fee: number }[] = [
  { id: "wall-mount", label: "Wall Mount", fee: 0 },
  { id: "hanging", label: "Hanging Wires", fee: 45 },
  { id: "freestanding", label: "Freestanding", fee: 120 },
  { id: "adhesive", label: "Adhesive / No Drill", fee: 25 },
];

export const WALL_SCENES = [
  "Restaurant Wall",
  "Hotel Lobby",
  "Office Space",
  "Shop Front",
  "Salon Interior",
  "Custom Upload",
] as const;

/** Preview pixels per cm at zoom 1 (L = 120cm ≈ 55% stage width) */
export const PX_PER_CM = 2.2;

export function cmToPreviewPx(cm: number, zoom = 1): number {
  return cm * PX_PER_CM * zoom;
}

export function resolveKonvaFont(family: string): string {
  const map: Record<string, string> = {
    "var(--font-heading)": "Outfit",
    "var(--font-bebas)": "Bebas Neue",
    "var(--font-pacifico)": "Pacifico",
    "var(--font-anton)": "Anton",
    "var(--font-playfair)": "Playfair Display",
    "var(--font-montserrat)": "Montserrat",
  };
  return map[family] ?? "Outfit";
}
