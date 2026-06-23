import { isFontRtl } from "../fonts";
import type { NeonLayer } from "./types";

const ARABIC_LETTER = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function containsArabic(text: string): boolean {
  return ARABIC_LETTER.test(text);
}

function layerText(layer: NeonLayer): string {
  return layer.textLayout === "single"
    ? layer.text.replace(/\n/g, " ").replace(/\s+/g, " ")
    : layer.text;
}

/** True when Konva must use RTL whole-string shaping (ligatures). */
export function needsRtlShaping(layer: NeonLayer): boolean {
  return isFontRtl(layer.fontId) || containsArabic(layerText(layer));
}

/** Konva breaks Arabic ligatures when letterSpacing ≠ 0 or text is split per glyph. */
export function effectiveLetterSpacing(layer: NeonLayer): number {
  if (needsRtlShaping(layer)) return 0;
  return layer.letterSpacing ?? 0;
}

export function useUnifiedTextPath(layer: NeonLayer): boolean {
  return needsRtlShaping(layer) || layer.wordSpacing === 0;
}

/** Collapse erroneous spaces between isolated Arabic letters (e.g. "س ل ا م" → "سلام"). */
export function joinArabicLetterSpaces(text: string): string {
  return text.replace(
    new RegExp(`(${ARABIC_LETTER.source})\\s+(?=${ARABIC_LETTER.source})`, "g"),
    "$1"
  );
}

export function normalizeArabicText(text: string): string {
  return joinArabicLetterSpaces(text.trim());
}
