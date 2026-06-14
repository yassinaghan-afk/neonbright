import type { DesignerState } from "../types";
import { SIZE_PRESETS, cmToPreviewPx } from "../sizes";

export function glowBlur(intensity: number, layer = 1): number {
  const t = intensity / 100;
  return (4 + t * 20) * layer;
}

export function resolveSignWidthPx(state: DesignerState): number {
  const cm = SIZE_PRESETS.find((s) => s.id === state.sizePreset)?.cm ?? 120;
  return cmToPreviewPx(cm) * state.transform.scale;
}

export function estimateTextFontSize(text: string, targetWidthPx: number): number {
  const len = Math.max(text.length, 1);
  return Math.min(120, Math.max(20, targetWidthPx / (len * 0.55)));
}
