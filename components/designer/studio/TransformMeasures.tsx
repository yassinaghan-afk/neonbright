"use client";

import { Group, Rect, Text } from "react-konva";
import type { LayerDimensions } from "@/lib/designer/editor/measurements";

type Props = {
  x: number;
  y: number;
  dims: LayerDimensions;
  /** Highlight while actively resizing */
  active?: boolean;
};

export function TransformMeasures({ x, y, dims, active }: Props) {
  const halfH = dims.heightPx / 2;
  const labelW = 152;
  const labelH = 40;
  const labelY = y - halfH - 22;

  return (
    <Group listening={false}>
      <Rect
        x={x - labelW / 2}
        y={labelY - labelH / 2}
        width={labelW}
        height={labelH}
        fill="rgba(8,8,8,0.88)"
        cornerRadius={8}
        stroke={active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)"}
        strokeWidth={1}
      />
      <Text
        x={x}
        y={labelY - 12}
        text={`${dims.widthCm} × ${dims.heightCm} cm`}
        fontSize={11}
        fontFamily="Outfit, sans-serif"
        fontStyle="bold"
        fill="rgba(255,255,255,0.92)"
        align="center"
        width={labelW}
        offsetX={labelW / 2}
      />
      <Text
        x={x}
        y={labelY + 4}
        text={active ? "Resizing…" : "Drag · Resize · Rotate"}
        fontSize={9}
        fontFamily="Outfit, sans-serif"
        fill="rgba(255,255,255,0.45)"
        align="center"
        width={labelW}
        offsetX={labelW / 2}
      />
    </Group>
  );
}
