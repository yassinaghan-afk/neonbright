import type { DesignerState } from "../types";
import { SIZE_PRESETS, cmToPreviewPx, PX_PER_CM } from "../sizes";

export type SignBounds = {
  contentWidthPx: number;
  contentHeightPx: number;
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
  widthLabel: string;
  heightLabel: string;
};

export function pxToCm(px: number): number {
  return Math.round(px / PX_PER_CM);
}

export function formatCm(cm: number): string {
  return `${cm}cm`;
}

export function estimateTextBounds(text: string, fontSize: number): { w: number; h: number } {
  const len = Math.max(text.length, 1);
  const w = len * fontSize * 0.55;
  const h = fontSize * 1.2;
  return { w, h };
}

export function resolveSignBounds(
  state: DesignerState,
  logoImage?: HTMLImageElement
): SignBounds {
  const presetCm = SIZE_PRESETS.find((s) => s.id === state.sizePreset)?.cm ?? 120;
  const widthPx = cmToPreviewPx(presetCm) * state.transform.scale;

  let contentWidthPx: number;
  let contentHeightPx: number;

  if (state.signType === "text") {
    const fontSize =
      Math.min(120, Math.max(20, widthPx / (Math.max(state.text.length, 1) * 0.55))) *
      (state.fontSize / 48);
    const bounds = estimateTextBounds(state.text || "NEON", fontSize);
    contentWidthPx = bounds.w;
    contentHeightPx = bounds.h;
  } else if (logoImage?.width && logoImage?.height) {
    const scale = widthPx / logoImage.width;
    contentWidthPx = logoImage.width * scale;
    contentHeightPx = logoImage.height * scale;
  } else {
    contentWidthPx = widthPx;
    contentHeightPx = widthPx * 0.45;
  }

  const widthCm = pxToCm(widthPx);
  const aspect = contentHeightPx / Math.max(contentWidthPx, 1);
  const heightCm = Math.max(1, Math.round(widthCm * aspect));

  return {
    contentWidthPx,
    contentHeightPx,
    widthPx,
    heightPx: contentHeightPx,
    widthCm,
    heightCm,
    widthLabel: formatCm(widthCm),
    heightLabel: formatCm(heightCm),
  };
}

export function scaleToSizePreset(effectiveCm: number): DesignerState["sizePreset"] {
  let closest = SIZE_PRESETS[3];
  let minDiff = Infinity;
  for (const preset of SIZE_PRESETS) {
    const diff = Math.abs(preset.cm - effectiveCm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = preset;
    }
  }
  return closest.id;
}

export function priceAreaFactor(widthCm: number, heightCm: number): number {
  const baseArea = 120 * 54;
  const area = widthCm * heightCm;
  return Math.sqrt(area / baseArea);
}
