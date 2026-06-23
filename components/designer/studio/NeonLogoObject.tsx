"use client";

import { memo, useRef, useEffect } from "react";
import { Group, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { glowBlur } from "@/lib/designer/editor/measurements";
import type { NeonTubeStyle } from "@/lib/designer/neonTubeStyles";
import type { NeonLayer } from "@/lib/designer/editor/types";

type Props = {
  layer: NeonLayer;
  image?: HTMLImageElement;
  neonStyle?: NeonTubeStyle;
  onSelect: () => void;
  onChange: (patch: Partial<NeonLayer>) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
};

export const NeonLogoObject = memo(function NeonLogoObject({
  layer,
  image,
  neonStyle = "open-tube",
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
}: Props) {
  const edgeRef = useRef<Konva.Image>(null);
  const glow = glowBlur(layer.glow);

  useEffect(() => {
    const node = edgeRef.current;
    if (!node || !image) return;
    node.cache();
    node.getLayer()?.batchDraw();
  }, [image, layer.color, layer.glow, neonStyle]);

  if (!image) return null;

  const ox = image.width / 2;
  const oy = image.height / 2;
  const bloom = neonStyle === "premium-glass" ? glow * 3.2 : glow * 2.4;
  const midBloom = neonStyle === "double-tube" ? glow * 2 : glow * 1.5;

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
        offsetX={ox}
        offsetY={oy}
        shadowColor={layer.color}
        shadowBlur={bloom}
        shadowOpacity={0.5 * layer.opacity}
        opacity={0.65}
      />
      <KonvaImage
        image={image}
        offsetX={ox}
        offsetY={oy}
        shadowColor={layer.color}
        shadowBlur={midBloom}
        shadowOpacity={0.82 * layer.opacity}
        opacity={0.8}
      />
      <KonvaImage
        ref={edgeRef}
        image={image}
        offsetX={ox}
        offsetY={oy}
        shadowColor={layer.color}
        shadowBlur={glow * 0.5}
        shadowOpacity={layer.opacity}
        filters={[Konva.Filters.Brighten, Konva.Filters.Contrast]}
        brightness={neonStyle === "open-tube" ? 0.3 : 0.18}
        contrast={neonStyle === "premium-glass" ? 55 : 38}
      />
      {neonStyle === "double-tube" && (
        <KonvaImage
          image={image}
          offsetX={ox}
          offsetY={oy}
          scaleX={0.96}
          scaleY={0.96}
          shadowColor="#ffffff"
          shadowBlur={4}
          shadowOpacity={0.4 * layer.opacity}
          filters={[Konva.Filters.Brighten]}
          brightness={0.45}
        />
      )}
    </Group>
  );
});
