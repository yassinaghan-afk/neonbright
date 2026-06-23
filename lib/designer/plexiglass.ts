import { ACRYLIC_OFFSET_CM } from "./backboards";
import { measureTextBoundsLocal } from "./editor/textMetrics";
import type { PlexiglassPanel, NeonLayer } from "./editor/types";
import { normalizeBackboardType, type BackboardType } from "./backboards";
import { PX_PER_CM } from "./sizes";

export function isPlexiglassBackboard(type: BackboardType | string): boolean {
  const t = normalizeBackboardType(type);
  return t === "transparent-acrylic-offset" || t === "transparent-acrylic";
}

export function defaultPlexiglassForLayer(layer: NeonLayer): PlexiglassPanel {
  const bounds = measureTextBoundsLocal(layer);
  const margin = ACRYLIC_OFFSET_CM * PX_PER_CM;
  return {
    offsetX: 0,
    offsetY: 0,
    width: bounds.width + margin * 2,
    height: bounds.height + margin * 2,
    cornerRadius: 8,
    manual: false,
  };
}

export function autoPlexiglassSize(layer: NeonLayer, current: PlexiglassPanel): PlexiglassPanel {
  const next = defaultPlexiglassForLayer(layer);
  return {
    ...current,
    width: next.width,
    height: next.height,
    offsetX: 0,
    offsetY: 0,
    manual: false,
  };
}

export function clampPlexiglassSize(layer: NeonLayer, width: number, height: number) {
  const min = defaultPlexiglassForLayer(layer);
  return {
    width: Math.max(width, min.width),
    height: Math.max(height, min.height),
  };
}

export function plexiglassRectPosition(panel: PlexiglassPanel) {
  return {
    x: -panel.width / 2 + panel.offsetX,
    y: -panel.height / 2 + panel.offsetY,
  };
}
