import { MOUNTING_OPTIONS, SIZE_PRESETS } from "./sizes";
import { priceAreaFactor, resolveSignBounds } from "./studio/measurements";
import type { DesignerState } from "./types";

const SIZE_BASE: Record<string, number> = Object.fromEntries(
  SIZE_PRESETS.map((s) => [s.id, s.cm * 8])
);

export function estimatePrice(state: DesignerState): number {
  const bounds = resolveSignBounds(state);
  const presetBase = SIZE_BASE[state.sizePreset] ?? 960;
  const areaFactor = priceAreaFactor(bounds.widthCm, bounds.heightCm);
  let unit = presetBase * areaFactor;
  if (state.signType === "logo") unit *= 1.18;
  if (state.color === "#38bdf8" || state.glowIntensity > 80) unit *= 1.05;

  const mount = MOUNTING_OPTIONS.find((m) => m.id === state.mountingType)?.fee ?? 0;
  const total = unit * Math.max(1, state.quantity) + mount;
  return Math.round(total);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
