/**
 * Enseigne size tiers.
 * Only include confirmed DH prices — do not invent unverified prices.
 */
export type EnseigneSizeId = "S";

export type EnseigneSizeOption = {
  id: EnseigneSizeId;
  label: string;
  /** Display range, e.g. "50–70 cm" */
  rangeLabel: string;
  /** Confirmed fixed price in Moroccan Dirham. null = not yet provided. */
  priceDh: number | null;
  /** Applied width when this tier is selected */
  widthCm: number;
  /** Applied height when this tier is selected */
  heightCm: number;
};

export const ENSEIGNE_SIZE_OPTIONS: EnseigneSizeOption[] = [
  {
    id: "S",
    label: "S",
    rangeLabel: "50–70 cm",
    priceDh: 1210,
    widthCm: 60,
    heightCm: 40,
  },
];
