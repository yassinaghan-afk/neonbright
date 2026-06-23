import { isFontRtl } from "../fonts";
import { containsArabic, normalizeArabicText } from "./arabicText";
import type { NeonLayer, TextLayoutMode } from "./types";

export function normalizeTextForLayout(text: string, mode: TextLayoutMode): string {
  const trimmed = text.trim() || "NEON";
  switch (mode) {
    case "single":
      return trimmed.replace(/\n/g, " ").replace(/\s+/g, " ");
    case "multiline":
      return trimmed;
    case "auto-wrap":
    case "manual":
    default:
      return trimmed;
  }
}

export function applyTextLayout(text: string, mode: TextLayoutMode): string {
  return normalizeTextForLayout(text, mode);
}

export function textForKonva(layer: NeonLayer): string {
  let text: string;
  if (layer.textLayout === "single") {
    text = layer.text.replace(/\n/g, " ").replace(/\s+/g, " ");
  } else {
    text = layer.text;
  }
  text = text.trim() || " ";
  return isFontRtl(layer.fontId) || containsArabic(text) ? normalizeArabicText(text) : text;
}

export function konvaWrapWidth(layer: NeonLayer, measuredWidthPx: number): number | undefined {
  if (layer.textLayout === "single") {
    return undefined;
  }
  if (layer.textLayout === "auto-wrap") {
    return layer.wrapWidth || Math.max(180, measuredWidthPx / layer.scaleX);
  }
  if (layer.textLayout === "multiline" || layer.textLayout === "manual") {
    return layer.wrapWidth || measuredWidthPx / layer.scaleX;
  }
  return undefined;
}
