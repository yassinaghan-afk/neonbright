import { measureTextBoundsLocal } from "./textMetrics";
import type { NeonLayer } from "./types";

export type ClampedPosition = {
  x: number;
  y: number;
  clamped: boolean;
};

export function layerHalfExtents(layer: NeonLayer): { halfW: number; halfH: number } {
  const bounds = measureTextBoundsLocal(layer);
  return {
    halfW: (bounds.width * Math.abs(layer.scaleX)) / 2,
    halfH: (bounds.height * Math.abs(layer.scaleY)) / 2,
  };
}

/** Keep layer center inside visible viewport (stage coords, pre-zoom group space). */
export function clampLayerPosition(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  viewportHalfW: number,
  viewportHalfH: number,
  margin = 8
): ClampedPosition {
  const maxX = Math.max(margin, viewportHalfW - halfW - margin);
  const maxY = Math.max(margin, viewportHalfH - halfH - margin);
  const minX = -maxX;
  const minY = -maxY;

  const cx = Math.min(maxX, Math.max(minX, x));
  const cy = Math.min(maxY, Math.max(minY, y));

  return {
    x: cx,
    y: cy,
    clamped: cx !== x || cy !== y,
  };
}

export function clampLayer(
  layer: NeonLayer,
  x: number,
  y: number,
  viewportW: number,
  viewportH: number
): ClampedPosition {
  const { halfW, halfH } = layerHalfExtents(layer);
  return clampLayerPosition(x, y, halfW, halfH, viewportW / 2, viewportH / 2);
}

export function isLayerOutsideViewport(
  layer: NeonLayer,
  viewportW: number,
  viewportH: number
): boolean {
  const { halfW, halfH } = layerHalfExtents(layer);
  const maxX = viewportW / 2 - halfW;
  const maxY = viewportH / 2 - halfH;
  return (
    Math.abs(layer.x) > maxX + 1 ||
    Math.abs(layer.y) > maxY + 1
  );
}
