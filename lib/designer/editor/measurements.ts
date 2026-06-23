import { PX_PER_CM } from "../sizes";
import { ACRYLIC_OFFSET_CM } from "../backboards";
import { resolveFontFamily, resolveFontWeight } from "../fonts";
import { measureTextBoundsLocal } from "./textMetrics";
import { textForKonva } from "./textLayout";
import type { NeonLayer } from "./types";

export type LayerDimensions = {
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
};

export function pxToCm(px: number): number {
  return Math.max(1, Math.round(px / PX_PER_CM));
}

export function measureTextLayer(layer: NeonLayer): LayerDimensions {
  const local = measureTextBoundsLocal(layer);
  const widthPx = local.width * layer.scaleX;
  const heightPx = local.height * layer.scaleY;

  return {
    widthPx,
    heightPx,
    widthCm: pxToCm(widthPx),
    heightCm: pxToCm(heightPx),
  };
}

export function measureLogoLayer(
  layer: NeonLayer,
  img?: HTMLImageElement
): LayerDimensions {
  const w = (img?.width ?? 200) * layer.scaleX;
  const h = (img?.height ?? 100) * layer.scaleY;
  return { widthPx: w, heightPx: h, widthCm: pxToCm(w), heightCm: pxToCm(h) };
}

export function measureLayer(layer: NeonLayer, img?: HTMLImageElement): LayerDimensions {
  if (layer.type === "logo" && layer.imageUrl) {
    return measureLogoLayer(layer, img);
  }
  return measureTextLayer(layer);
}

export function glowBlur(intensity: number): number {
  return 4 + (intensity / 100) * 24;
}

export function layerFontFamily(layer: NeonLayer): string {
  return resolveFontFamily(layer.fontId);
}

export function layerFontStyle(layer: NeonLayer): string {
  return resolveFontWeight(layer.fontId);
}

/** Support panel size: full text bounds + 2 cm margin on every side */
export function supportPanelSize(
  layer: NeonLayer,
  scaleX: number,
  scaleY: number
): { w: number; h: number; halfW: number; halfH: number } {
  const local = measureTextBoundsLocal(layer);
  const marginPx = ACRYLIC_OFFSET_CM * PX_PER_CM;
  const w = local.width + marginPx * 2;
  const h = local.height + marginPx * 2;
  return { w, h, halfW: w / 2, halfH: h / 2 };
}

export { measureTextBoundsLocal };
