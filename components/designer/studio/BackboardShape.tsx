"use client";

import { memo } from "react";
import { Group, Rect, Ellipse, Line } from "react-konva";
import {
  ACRYLIC_OFFSET_CM,
  normalizeBackboardType,
  type BackboardType,
} from "@/lib/designer/backboards";
import { supportPanelSize } from "@/lib/designer/editor/measurements";
import type { LayerDimensions } from "@/lib/designer/editor/measurements";
import { cmToPreviewPx } from "@/lib/designer/sizes";
import type { NeonLayer } from "@/lib/designer/editor/types";

type Props = {
  type: BackboardType | string;
  layer: NeonLayer;
  dims: LayerDimensions;
  scaleX: number;
  scaleY: number;
};

export const BackboardShape = memo(function BackboardShape({
  type: rawType,
  layer,
  dims,
  scaleX,
  scaleY,
}: Props) {
  const type = normalizeBackboardType(rawType);

  if (type === "none" || type === "transparent-acrylic-offset" || type === "transparent-acrylic") {
    return null;
  }

  const marginPx = cmToPreviewPx(ACRYLIC_OFFSET_CM);
  const panel = supportPanelSize(layer, scaleX, scaleY);
  const { w, h, halfW, halfH } = panel;

  const legacyPad = 16;
  const legacyW = dims.widthPx / scaleX + legacyPad * 2;
  const legacyH = dims.heightPx / scaleY + legacyPad * 2;
  const legacyHalfW = legacyW / 2;
  const legacyHalfH = legacyH / 2;

  if (type === "black-acrylic") {
    return (
      <Group offsetX={halfW} offsetY={halfH}>
        <Rect width={w} height={h} cornerRadius={6} fill="#0a0a0a" opacity={0.86} />
        <Rect
          x={1}
          y={1}
          width={w - 2}
          height={h - 2}
          cornerRadius={5}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      </Group>
    );
  }

  if (type === "white-acrylic") {
    return (
      <Group offsetX={halfW} offsetY={halfH}>
        <Rect width={w} height={h} cornerRadius={6} fill="#f5f5f5" opacity={0.9} />
      </Group>
    );
  }

  if (type === "rectangle") {
    return (
      <Group offsetX={halfW} offsetY={halfH}>
        <Rect
          width={w}
          height={h}
          cornerRadius={2}
          fill="rgba(10,10,10,0.88)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
      </Group>
    );
  }

  if (type === "rounded-rectangle") {
    return (
      <Group offsetX={halfW} offsetY={halfH}>
        <Rect
          width={w}
          height={h}
          cornerRadius={18}
          fill="rgba(10,10,10,0.88)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
      </Group>
    );
  }

  if (type === "circle") {
    const r = Math.max(halfW, halfH);
    return (
      <Group offsetX={halfW} offsetY={halfH}>
        <Ellipse x={halfW} y={halfH} radiusX={r} radiusY={r} fill="#0a0a0a" opacity={0.92} />
      </Group>
    );
  }

  if (type === "oval") {
    return (
      <Group offsetX={halfW} offsetY={halfH}>
        <Ellipse x={halfW} y={halfH} radiusX={halfW + marginPx} radiusY={halfH + marginPx * 0.5} fill="#0a0a0a" opacity={0.92} />
      </Group>
    );
  }

  if (type === "custom-shape") {
    return (
      <Group offsetX={legacyHalfW} offsetY={legacyHalfH}>
        <Line
          points={[
            0, legacyHalfH * 0.3,
            legacyHalfW * 0.2, 0,
            legacyHalfW * 0.8, legacyHalfH * 0.1,
            legacyW, legacyHalfH * 0.4,
            legacyW * 0.95, legacyH * 0.85,
            legacyHalfW * 0.7, legacyH,
            legacyHalfW * 0.15, legacyH * 0.9,
            0, legacyHalfH * 0.7,
          ]}
          closed
          fill="rgba(10,10,10,0.88)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          dash={[4, 3]}
        />
      </Group>
    );
  }

  return null;
});
