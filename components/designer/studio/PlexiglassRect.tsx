"use client";

import { memo } from "react";
import { Group, Line, Rect } from "react-konva";
import { plexiglassRectPosition } from "@/lib/designer/plexiglass";
import type { PlexiglassPanel } from "@/lib/designer/editor/types";

type Props = {
  layerId: string;
  panel: PlexiglassPanel;
  focused: boolean;
  onSelect: () => void;
};

export const PlexiglassRect = memo(function PlexiglassRect({
  layerId,
  panel,
  focused,
  onSelect,
}: Props) {
  const { x, y } = plexiglassRectPosition(panel);
  const w = panel.width;
  const h = panel.height;
  const r = panel.cornerRadius;
  const edge = focused ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.16)";
  const glossH = Math.max(0, Math.min(h * 0.42, 36));

  const select = (e: { cancelBubble: boolean }) => {
    e.cancelBubble = true;
    onSelect();
  };

  return (
    <Group
      id={`plexiglass-${layerId}`}
      x={x}
      y={y}
      width={w}
      height={h}
      listening
      onClick={select}
      onTap={select}
    >
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        cornerRadius={r}
        fill="rgba(255,255,255,0.022)"
        stroke={edge}
        strokeWidth={focused ? 1.5 : 1}
        shadowColor="rgba(180,210,255,0.12)"
        shadowBlur={focused ? 8 : 4}
        shadowOpacity={0.35}
        listening={false}
      />

      <Rect
        x={1}
        y={1}
        width={Math.max(0, w - 2)}
        height={glossH}
        cornerRadius={[r, r, 0, 0]}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: w * 0.55, y: glossH }}
        fillLinearGradientColorStops={[
          0, "rgba(255,255,255,0.11)",
          0.35, "rgba(255,255,255,0.04)",
          1, "rgba(255,255,255,0)",
        ]}
        listening={false}
      />

      <Rect
        x={w - 4}
        y={3}
        width={2.5}
        height={Math.max(0, h - 6)}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: h }}
        fillLinearGradientColorStops={[
          0, "rgba(255,255,255,0.16)",
          0.45, "rgba(255,255,255,0.05)",
          1, "rgba(255,255,255,0.12)",
        ]}
        listening={false}
      />

      <Line
        points={[r, h - 1, w - r, h - 1]}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1}
        listening={false}
      />

      <Line
        points={[w * 0.12, h * 0.08, w * 0.38, h * 0.22]}
        stroke="rgba(255,255,255,0.09)"
        strokeWidth={1.2}
        lineCap="round"
        listening={false}
      />
    </Group>
  );
});
