"use client";

import { memo, useRef, useEffect } from "react";
import { Group, Text } from "react-konva";
import type Konva from "konva";
import { glowBlur, layerFontFamily, measureTextLayer } from "@/lib/designer/editor/measurements";
import type { NeonLayer } from "@/lib/designer/editor/types";

type Props = {
  layer: NeonLayer;
  onSelect: () => void;
  onChange: (patch: Partial<NeonLayer>) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
  onDoubleClick: () => void;
};

export const NeonTextObject = memo(function NeonTextObject({
  layer,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
  onDoubleClick,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const font = layerFontFamily(layer);
  const glow = glowBlur(layer.glow);
  const dims = measureTextLayer(layer);
  const halfW = dims.widthPx / 2;
  const halfH = dims.heightPx / 2;

  useEffect(() => {
    groupRef.current?.getStage()?.batchDraw();
  }, [layer]);

  return (
    <Group
      ref={groupRef}
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
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onDragEnd();
      }}
    >
      <Text
        text={layer.text || "Double-click to edit"}
        fontFamily={font}
        fontSize={layer.fontSize}
        fontStyle="bold"
        fill={layer.color}
        letterSpacing={layer.letterSpacing}
        lineHeight={layer.lineHeight}
        align={layer.align}
        shadowColor={layer.color}
        shadowBlur={glow * 2}
        shadowOpacity={0.85 * layer.opacity}
        offsetX={halfW / layer.scaleX}
        offsetY={halfH / layer.scaleY}
        width={dims.widthPx / layer.scaleX}
      />
      <Text
        text={layer.text || "Double-click to edit"}
        fontFamily={font}
        fontSize={layer.fontSize}
        fontStyle="bold"
        fill={layer.color}
        letterSpacing={layer.letterSpacing}
        lineHeight={layer.lineHeight}
        align={layer.align}
        shadowColor={layer.color}
        shadowBlur={glow}
        shadowOpacity={layer.opacity}
        offsetX={halfW / layer.scaleX}
        offsetY={halfH / layer.scaleY}
        width={dims.widthPx / layer.scaleX}
      />
    </Group>
  );
});
