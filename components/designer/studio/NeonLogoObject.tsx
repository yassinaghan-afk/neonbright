"use client";

import { memo } from "react";
import { Group, Image as KonvaImage } from "react-konva";
import { glowBlur } from "@/lib/designer/editor/measurements";
import type { NeonLayer } from "@/lib/designer/editor/types";

type Props = {
  layer: NeonLayer;
  image?: HTMLImageElement;
  onSelect: () => void;
  onChange: (patch: Partial<NeonLayer>) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
};

export const NeonLogoObject = memo(function NeonLogoObject({
  layer,
  image,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
}: Props) {
  const glow = glowBlur(layer.glow);

  if (!image) return null;

  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      opacity={layer.opacity}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onDragEnd();
      }}
    >
      <KonvaImage
        image={image}
        offsetX={image.width / 2}
        offsetY={image.height / 2}
        shadowColor={layer.color}
        shadowBlur={glow * 1.5}
        shadowOpacity={0.85 * layer.opacity}
      />
    </Group>
  );
});
