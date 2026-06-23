import { ACRYLIC_OFFSET_CM } from "../backboards";
import { resolveFontFamily, resolveFontWeight } from "../fonts";
import { cmToPreviewPx } from "../sizes";
import { textForKonva } from "./textLayout";
import { measureTextBoundsLocal } from "./textMetrics";
import { measurementTubeStrokeWidth } from "../neonTubeStyles";
import type { NeonLayer } from "./types";

export type AcrylicSilhouette = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

function dilateMask(source: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d")!;
  const steps = Math.max(16, Math.ceil(radius * 2.5));

  for (let r = 1; r <= radius; r++) {
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      ctx.drawImage(source, Math.round(Math.cos(angle) * r), Math.round(Math.sin(angle) * r));
    }
  }
  ctx.drawImage(source, 0, 0);
  return out;
}

function drawLineWithSpacing(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  letterSpacing: number,
  align: "left" | "center" | "right",
  mode: "stroke"
) {
  if (!line) return;
  const chars = [...line];
  const advances: number[] = chars.map((ch) => ctx.measureText(ch).width);
  let lineW = advances.reduce((s, a) => s + a, 0);
  if (chars.length > 1) lineW += letterSpacing * (chars.length - 1);

  let cx = x;
  if (align === "center") cx = x - lineW / 2;
  else if (align === "right") cx = x - lineW;

  for (let i = 0; i < chars.length; i++) {
    ctx.strokeText(chars[i], cx, y);
    cx += advances[i] + letterSpacing;
  }
}

/** Stroke mask along neon tube outer edge — panel sits outside the tube, not on it. */
function drawTubeStrokeMask(
  ctx: CanvasRenderingContext2D,
  layer: NeonLayer,
  cx: number,
  cy: number
) {
  const text = textForKonva(layer);
  const lines = text.split("\n");
  const lineH = layer.fontSize * layer.lineHeight;
  const blockH = lineH * (lines.length - 1);
  const startY = cy - blockH / 2;
  const tubeW = measurementTubeStrokeWidth(layer.fontSize);

  ctx.strokeStyle = "#000";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = tubeW * 1.15;

  lines.forEach((line, li) => {
    const y = startY + li * lineH;
    if (layer.wordSpacing === 0) {
      drawLineWithSpacing(ctx, line, cx, y, layer.letterSpacing, layer.align, "stroke");
      return;
    }

    const words = line.split(/\s+/).filter(Boolean);
    let wx = cx;
    if (layer.align === "center") {
      let tw = 0;
      words.forEach((w, i) => {
        tw += ctx.measureText(w).width + (i > 0 ? layer.wordSpacing : 0);
      });
      wx = cx - tw / 2;
    } else if (layer.align === "right") {
      let tw = 0;
      words.forEach((w, i) => {
        tw += ctx.measureText(w).width + (i > 0 ? layer.wordSpacing : 0);
      });
      wx = cx - tw;
    }
    words.forEach((word, wi) => {
      drawLineWithSpacing(ctx, word, wx, y, layer.letterSpacing, "left", "stroke");
      wx += ctx.measureText(word).width + (wi < words.length - 1 ? layer.wordSpacing : 0);
    });
  });
}

function drawOuterEdgeHighlight(
  ctx: CanvasRenderingContext2D,
  dilated: HTMLCanvasElement,
  w: number,
  h: number
) {
  const offsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ];

  const ring = document.createElement("canvas");
  ring.width = w;
  ring.height = h;
  const rctx = ring.getContext("2d")!;
  for (const [dx, dy] of offsets) rctx.drawImage(dilated, dx, dy);
  rctx.globalCompositeOperation = "destination-out";
  rctx.drawImage(dilated, 0, 0);

  const rim = document.createElement("canvas");
  rim.width = w;
  rim.height = h;
  const rimCtx = rim.getContext("2d")!;
  rimCtx.drawImage(ring, 0, 0);
  rimCtx.globalCompositeOperation = "source-in";
  rimCtx.fillStyle = "rgba(255, 255, 255, 0.32)";
  rimCtx.fillRect(0, 0, w, h);
  ctx.drawImage(rim, 0, 0);

  const ring2 = document.createElement("canvas");
  ring2.width = w;
  ring2.height = h;
  const r2ctx = ring2.getContext("2d")!;
  for (const [dx, dy] of offsets) r2ctx.drawImage(dilated, dx * 2, dy * 2);
  r2ctx.globalCompositeOperation = "destination-out";
  r2ctx.drawImage(dilated, 0, 0);

  const rim2 = document.createElement("canvas");
  rim2.width = w;
  rim2.height = h;
  const rim2Ctx = rim2.getContext("2d")!;
  rim2Ctx.drawImage(ring2, 0, 0);
  rim2Ctx.globalCompositeOperation = "source-in";
  rim2Ctx.fillStyle = "rgba(210, 225, 255, 0.1)";
  rim2Ctx.fillRect(0, 0, w, h);
  ctx.drawImage(rim2, 0, 0);
}

function drawAcrylicPanel(
  ctx: CanvasRenderingContext2D,
  dilated: HTMLCanvasElement,
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);

  const fillCanvas = document.createElement("canvas");
  fillCanvas.width = w;
  fillCanvas.height = h;
  const fctx = fillCanvas.getContext("2d")!;
  fctx.drawImage(dilated, 0, 0);
  fctx.globalCompositeOperation = "source-in";
  fctx.fillStyle = "rgba(255, 255, 255, 0.028)";
  fctx.fillRect(0, 0, w, h);
  ctx.drawImage(fillCanvas, 0, 0);

  drawOuterEdgeHighlight(ctx, dilated, w, h);

  const gloss = document.createElement("canvas");
  gloss.width = w;
  gloss.height = h;
  const gctx = gloss.getContext("2d")!;
  gctx.drawImage(dilated, 0, 0);
  gctx.globalCompositeOperation = "source-in";
  const grad = gctx.createLinearGradient(0, 0, w * 0.35, h * 0.4);
  grad.addColorStop(0, "rgba(255,255,255,0.07)");
  grad.addColorStop(0.45, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, w, h);
  ctx.drawImage(gloss, 0, 0);
}

/**
 * Generates transparent plexiglass panel from tube contour + ~2 cm offset.
 * Panel sits behind neon — stroke-based mask keeps acrylic outside the tube path.
 */
export function generateAcrylicSilhouette(
  layer: NeonLayer,
  _wrapW?: number
): AcrylicSilhouette | null {
  if (typeof document === "undefined") return null;

  const offsetPx = Math.round(cmToPreviewPx(ACRYLIC_OFFSET_CM));
  const bounds = measureTextBoundsLocal(layer);
  const edgeMargin = offsetPx + bounds.padding + 8;

  const canvasW = Math.ceil(bounds.width + edgeMargin * 2);
  const canvasH = Math.ceil(bounds.height + edgeMargin * 2);
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  const mask = document.createElement("canvas");
  mask.width = canvasW;
  mask.height = canvasH;
  const mctx = mask.getContext("2d");
  if (!mctx) return null;

  const weight = resolveFontWeight(layer.fontId);
  const family = resolveFontFamily(layer.fontId);
  mctx.font = `${weight} ${layer.fontSize}px "${family}"`;
  mctx.textBaseline = "middle";
  drawTubeStrokeMask(mctx, layer, cx, cy);

  const dilated = dilateMask(mask, offsetPx);

  const acrylic = document.createElement("canvas");
  acrylic.width = canvasW;
  acrylic.height = canvasH;
  const actx = acrylic.getContext("2d");
  if (!actx) return null;

  drawAcrylicPanel(actx, dilated, canvasW, canvasH);

  return { canvas: acrylic, width: canvasW, height: canvasH };
}

export function acrylicImageOffset(silhouette: AcrylicSilhouette) {
  return {
    offsetX: silhouette.width / 2,
    offsetY: silhouette.height / 2,
  };
}
