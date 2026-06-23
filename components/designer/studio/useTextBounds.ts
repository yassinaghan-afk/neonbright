"use client";

import { useEffect, useState, type RefObject } from "react";
import type Konva from "konva";
import { resolveFontFamily, resolveFontWeight, resolveSafeFontId } from "@/lib/designer/fonts";
import {
  ensureFontLoaded,
  measureTextBoundsLocal,
  mergeWithRenderedRect,
  type TextBoundsLocal,
} from "@/lib/designer/editor/textMetrics";
import type { NeonLayer } from "@/lib/designer/editor/types";

function layerBoundsKey(layer: NeonLayer): string {
  return [
    layer.text,
    layer.fontId,
    layer.fontSize,
    layer.letterSpacing,
    layer.wordSpacing,
    layer.lineHeight,
    layer.textLayout,
    layer.wrapWidth,
  ].join("|");
}

const MIN_BOUNDS = {
  innerWidth: 48,
  innerHeight: 32,
  width: 64,
  height: 48,
  padding: 8,
};

function safeBounds(bounds: TextBoundsLocal): TextBoundsLocal {
  return {
    padding: Math.max(bounds.padding, MIN_BOUNDS.padding),
    innerWidth: Math.max(bounds.innerWidth, MIN_BOUNDS.innerWidth),
    innerHeight: Math.max(bounds.innerHeight, MIN_BOUNDS.innerHeight),
    width: Math.max(bounds.width, MIN_BOUNDS.width),
    height: Math.max(bounds.height, MIN_BOUNDS.height),
  };
}

/**
 * Measures text bounds after fonts load, then syncs with Konva rendered rect.
 */
export function useTextBounds(
  layer: NeonLayer,
  contentRef: RefObject<Konva.Group | null>
): TextBoundsLocal {
  const [bounds, setBounds] = useState<TextBoundsLocal>(() =>
    safeBounds(measureTextBoundsLocal(layer))
  );
  const key = layerBoundsKey(layer);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;

    const measure = async () => {
      const safeId = resolveSafeFontId(layer.fontId);
      const family = resolveFontFamily(safeId);
      const weight = resolveFontWeight(safeId);
      await ensureFontLoaded(family, weight, layer.fontSize);
      if (cancelled) return;

      const measuredLayer =
        safeId !== layer.fontId ? { ...layer, fontId: safeId } : layer;
      let next = safeBounds(measureTextBoundsLocal(measuredLayer));

      rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        const node = contentRef.current;
        if (node) {
          const rect = node.getClientRect({ skipTransform: true, skipShadow: true });
          next = safeBounds(mergeWithRenderedRect(next, rect));
        }
        setBounds(next);
        node?.getStage()?.batchDraw();
      });
    };

    void measure();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [key, contentRef, layer.fontId]);

  return bounds;
}
