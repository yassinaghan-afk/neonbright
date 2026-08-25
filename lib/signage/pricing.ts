import { ENSEIGNE_SIZE_OPTIONS } from "./sizes";
import type { SignageState } from "./types";

const SIGN_TYPE_MULTIPLIER: Record<string, number> = {
  "lettres-boitiers": 1.45,
  "enseigne-lumineuse": 1.0,
  "enseigne-led": 1.08,
  "caisson-lumineux": 1.15,
  "logo-lumineux": 1.22,
  signaletique: 0.92,
  totem: 1.55,
  facade: 1.65,
};

export function estimateSignagePrice(state: SignageState): number {
  // Confirmed fixed-tier prices take priority (e.g. 50–70 cm → 1 210 DH).
  if (state.sizePreset) {
    const tier = ENSEIGNE_SIZE_OPTIONS.find((o) => o.id === state.sizePreset);
    if (tier?.priceDh != null) return tier.priceDh;
  }

  const areaM2 = (state.signWidthCm * state.signHeightCm) / 10_000;
  const base = 1200 + areaM2 * 2800;
  const typeFactor = SIGN_TYPE_MULTIPLIER[state.signType] ?? 1;
  const lightingFactor = 0.85 + (state.lightingIntensity / 100) * 0.25;
  const logoFactor = state.logoUrl ? 1.12 : 1;

  return Math.round(base * typeFactor * lightingFactor * logoFactor);
}

/** French/Moroccan dirham display — e.g. "1 210 DH" (never USD). */
export function formatSignagePrice(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} DH`;
}
