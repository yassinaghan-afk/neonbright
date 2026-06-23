import { resolveFontFamily, resolveFontWeight } from "../fonts";
import {
  MEASUREMENT_GLOW_PAD,
  measurementTubeStrokeWidth,
} from "../neonTubeStyles";
import { effectiveLetterSpacing, needsRtlShaping } from "./arabicText";
import { textForKonva } from "./textLayout";
import type { NeonLayer } from "./types";

/** Temporary — draw measured vs rendered bounds on canvas */
export const DEBUG_TEXT_BOUNDS = false;

export type TextBoundsLocal = {
  /** Full box including neon glow extent (selection / hit target) */
  width: number;
  height: number;
  /** Glyph box only */
  innerWidth: number;
  innerHeight: number;
  /** Neon stroke + glow padding applied on each side */
  padding: number;
};

export function neonExtentPadding(_layer: NeonLayer): number {
  const tubeW = measurementTubeStrokeWidth(_layer.fontSize);
  return Math.ceil(tubeW + MEASUREMENT_GLOW_PAD);
}

function canvasContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  return canvas.getContext("2d");
}

export async function ensureFontLoaded(
  family: string,
  weight: string,
  fontSize: number
): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  try {
    await document.fonts.load(`${weight} ${fontSize}px "${family}"`);
  } catch {
    /* font may already be loaded via link */
  }
}

function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  line: string,
  letterSpacing: number,
  wordSpacing: number,
  rtl: boolean
): number {
  if (!line) return 0;

  if (rtl || (wordSpacing === 0 && !letterSpacing)) {
    return ctx.measureText(line).width;
  }

  if (wordSpacing === 0) {
    const chars = [...line];
    let w = 0;
    chars.forEach((ch, i) => {
      w += ctx.measureText(ch).width;
      if (i < chars.length - 1) w += letterSpacing;
    });
    return w;
  }

  const words = line.split(/\s+/).filter(Boolean);
  let w = 0;
  words.forEach((word, i) => {
    const chars = [...word];
    chars.forEach((ch, ci) => {
      w += ctx.measureText(ch).width;
      if (ci < chars.length - 1) w += letterSpacing;
    });
    if (i < words.length - 1) w += wordSpacing;
  });
  return w;
}

function measureLineVertical(
  ctx: CanvasRenderingContext2D,
  line: string,
  fontSize: number
): { ascent: number; descent: number } {
  const sample = line.trim() || "Mg";
  const m = ctx.measureText(sample);
  return {
    ascent: m.actualBoundingBoxAscent ?? fontSize * 0.78,
    descent: m.actualBoundingBoxDescent ?? fontSize * 0.22,
  };
}

/** Accurate text bounds in local (unscaled) coordinates */
export function measureTextBoundsLocal(layer: NeonLayer): TextBoundsLocal {
  const text = textForKonva(layer) || " ";
  const lines = text.split("\n");
  const lineCount = Math.max(lines.length, 1);
  const pad = neonExtentPadding(layer);
  const lineStep = layer.fontSize * layer.lineHeight;

  const ctx = canvasContext();
  if (!ctx) {
    const rtl = needsRtlShaping(layer);
    const letterSpacing = effectiveLetterSpacing(layer);
    const longest = Math.max(...lines.map((l) => [...l].length), 1);
    const innerWidth = rtl || !letterSpacing
      ? longest * layer.fontSize * 0.72
      : longest * layer.fontSize * 0.62 + letterSpacing * Math.max(longest - 1, 0);
    const innerHeight = lineCount === 1 ? layer.fontSize * 1.1 : lineStep * lineCount;
    return {
      innerWidth: Math.max(innerWidth, layer.fontSize),
      innerHeight: Math.max(innerHeight, layer.fontSize),
      width: Math.max(innerWidth, layer.fontSize) + pad * 2,
      height: Math.max(innerHeight, layer.fontSize) + pad * 2,
      padding: pad,
    };
  }

  const weight = resolveFontWeight(layer.fontId);
  const family = resolveFontFamily(layer.fontId);
  const rtl = needsRtlShaping(layer);
  const letterSpacing = effectiveLetterSpacing(layer);
  ctx.font = `${weight} ${layer.fontSize}px "${family}"`;
  if (rtl) ctx.direction = "rtl";

  let maxW = 0;
  let maxAscent = 0;
  let maxDescent = 0;

  for (const line of lines) {
    maxW = Math.max(maxW, measureLineWidth(ctx, line, letterSpacing, layer.wordSpacing, rtl));
    const v = measureLineVertical(ctx, line, layer.fontSize);
    maxAscent = Math.max(maxAscent, v.ascent);
    maxDescent = Math.max(maxDescent, v.descent);
  }

  if (layer.textLayout === "auto-wrap" && layer.wrapWidth) {
    maxW = Math.max(maxW, layer.wrapWidth);
  }

  const innerWidth = Math.max(maxW, layer.fontSize * 0.5);
  const innerHeight =
    lineCount === 1
      ? maxAscent + maxDescent
      : maxAscent + maxDescent + (lineCount - 1) * lineStep;

  const bounds: TextBoundsLocal = {
    innerWidth,
    innerHeight: Math.max(innerHeight, layer.fontSize * 0.8),
    width: innerWidth + pad * 2,
    height: Math.max(innerHeight, layer.fontSize * 0.8) + pad * 2,
    padding: pad,
  };

  if (DEBUG_TEXT_BOUNDS) {
    console.log("[text-bounds measured]", {
      text,
      font: family,
      ...bounds,
    });
  }

  return bounds;
}

export function textCenterOffset(bounds: TextBoundsLocal) {
  return {
    offsetX: bounds.width / 2,
    offsetY: bounds.height / 2,
  };
}

/** Expand bounds if Konva rendered rect exceeds pre-measure — capped to avoid font outliers. */
export function mergeWithRenderedRect(
  measured: TextBoundsLocal,
  rendered: { width: number; height: number } | null
): TextBoundsLocal {
  if (!rendered || rendered.width <= 0 || rendered.height <= 0) return measured;

  const pad = measured.padding;
  const maxGrow = 1.55;
  const innerW = Math.min(
    Math.max(measured.innerWidth, rendered.width),
    measured.innerWidth * maxGrow
  );
  const innerH = Math.min(
    Math.max(measured.innerHeight, rendered.height),
    measured.innerHeight * maxGrow
  );

  const merged: TextBoundsLocal = {
    padding: pad,
    innerWidth: innerW,
    innerHeight: innerH,
    width: innerW + pad * 2,
    height: innerH + pad * 2,
  };

  if (DEBUG_TEXT_BOUNDS && (innerW > measured.innerWidth || innerH > measured.innerHeight)) {
    console.log("[text-bounds merged]", { measured, rendered, merged });
  }

  return merged;
}
