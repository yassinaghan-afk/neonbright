import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "./constants";
import { resolveFontFamily, resolveFontWeight } from "./fonts";

function canvasContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  return document.createElement("canvas").getContext("2d");
}

/** Visual bounding box for text at a given size (glyph metrics, not glow). */
export function measureVisualTextExtent(
  text: string,
  fontId: string,
  fontSize: number
): { width: number; height: number } {
  const ctx = canvasContext();
  const sample = text.trim() || "Neon";
  if (!ctx) {
    return { width: sample.length * fontSize * 0.55, height: fontSize * 1.05 };
  }

  const family = resolveFontFamily(fontId);
  const weight = resolveFontWeight(fontId);
  ctx.font = `${weight} ${fontSize}px "${family}"`;

  const lines = sample.split("\n");
  const lineStep = fontSize * 1.2;
  let maxW = 0;
  let ascent = 0;
  let descent = 0;

  for (const line of lines) {
    const probe = line || "Mg";
    const m = ctx.measureText(probe);
    maxW = Math.max(maxW, m.width);
    ascent = Math.max(ascent, m.actualBoundingBoxAscent ?? fontSize * 0.78);
    descent = Math.max(descent, m.actualBoundingBoxDescent ?? fontSize * 0.22);
  }

  const height =
    lines.length === 1
      ? ascent + descent
      : ascent + descent + (lines.length - 1) * lineStep;

  return {
    width: Math.max(maxW, fontSize * 0.4),
    height: Math.max(height, fontSize * 0.8),
  };
}

/**
 * When switching fonts, adjust fontSize so the new font matches the prior visual size.
 */
export function normalizeFontSizeOnSwitch(
  text: string,
  fromFontId: string,
  fromSize: number,
  toFontId: string
): number {
  if (fromFontId === toFontId) return fromSize;

  const refSize = 64;
  const fromRef = measureVisualTextExtent(text, fromFontId, refSize);
  const toRef = measureVisualTextExtent(text, toFontId, refSize);
  const fromCurrent = measureVisualTextExtent(text, fromFontId, fromSize);

  const toRefH = Math.max(toRef.height, 1);
  const toRefW = Math.max(toRef.width, 1);
  const heightRatio = fromCurrent.height / toRefH;
  const widthRatio = fromCurrent.width / toRefW;

  const sizeFromHeight = Math.round(heightRatio * refSize);
  const sizeFromWidth = Math.round(widthRatio * refSize);
  const blended = Math.round(sizeFromHeight * 0.72 + sizeFromWidth * 0.28);

  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, blended));
}
