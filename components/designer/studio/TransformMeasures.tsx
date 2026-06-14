"use client";

import { Group, Line, Text } from "react-konva";
import type { LayerDimensions } from "@/lib/designer/editor/measurements";

type Props = {
  x: number;
  y: number;
  dims: LayerDimensions;
};

export function TransformMeasures({ x, y, dims }: Props) {
  const halfW = dims.widthPx / 2;
  const halfH = dims.heightPx / 2;
  const pad = 20;

  return (
    <>
      <Group x={x - halfW - pad} y={y}>
        <Line points={[0, -halfH, 0, halfH]} stroke="rgba(255,45,149,0.8)" strokeWidth={1} />
        <Line points={[-4, -halfH, 4, -halfH]} stroke="rgba(255,45,149,0.8)" strokeWidth={1} />
        <Line points={[-4, halfH, 4, halfH]} stroke="rgba(255,45,149,0.8)" strokeWidth={1} />
        <Text
          text={`${dims.heightCm}cm`}
          fontSize={10}
          fill="#ff2d95"
          rotation={-90}
          align="center"
          width={halfH * 2}
          offsetX={halfH}
          x={-14}
        />
      </Group>
      <Group x={x} y={y + halfH + pad}>
        <Line points={[-halfW, 0, halfW, 0]} stroke="rgba(255,45,149,0.8)" strokeWidth={1} />
        <Line points={[-halfW, -4, -halfW, 4]} stroke="rgba(255,45,149,0.8)" strokeWidth={1} />
        <Line points={[halfW, -4, halfW, 4]} stroke="rgba(255,45,149,0.8)" strokeWidth={1} />
        <Text
          text={`${dims.widthCm}cm`}
          fontSize={10}
          fill="#ff2d95"
          align="center"
          width={halfW * 2}
          offsetX={halfW}
          y={6}
        />
      </Group>
      <Group x={x} y={y - halfH - 28}>
        <Text
          text={`${dims.widthCm}cm × ${dims.heightCm}cm`}
          fontSize={11}
          fill="#ff2d95"
          align="center"
          width={120}
          offsetX={60}
        />
      </Group>
    </>
  );
}
