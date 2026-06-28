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
  const areaM2 = (state.signWidthCm * state.signHeightCm) / 10_000;
  const base = 1200 + areaM2 * 2800;
  const typeFactor = SIGN_TYPE_MULTIPLIER[state.signType] ?? 1;
  const lightingFactor = 0.85 + (state.lightingIntensity / 100) * 0.25;
  const logoFactor = state.logoUrl ? 1.12 : 1;

  return Math.round(base * typeFactor * lightingFactor * logoFactor);
}

export function formatSignagePrice(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(amount);
}
