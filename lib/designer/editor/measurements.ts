import { PX_PER_CM } from "../sizes";
import { resolveFontFamily } from "../fonts";
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
  const len = Math.max(layer.text.length, 1);
  const spacing = layer.letterSpacing;
  const widthPx =
    (len * layer.fontSize * 0.55 + spacing * Math.max(len - 1, 0)) *
    layer.scaleX;
  const heightPx = layer.fontSize * layer.lineHeight * layer.scaleY;
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
