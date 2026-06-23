"use client";

import { memo, useRef, useEffect, useMemo, type RefObject } from "react";
import { Group, Rect } from "react-konva";
import type Konva from "konva";
import { layerFontFamily, layerFontStyle } from "@/lib/designer/editor/measurements";
import { DEBUG_TEXT_BOUNDS } from "@/lib/designer/editor/textMetrics";
import { textForKonva, konvaWrapWidth } from "@/lib/designer/editor/textLayout";
import { effectiveLetterSpacing, needsRtlShaping } from "@/lib/designer/editor/arabicText";
import { BackboardShape } from "./BackboardShape";
import { PlexiglassRect } from "./PlexiglassRect";
import { NeonTubeText } from "./NeonTubeText";
import { useTextBounds } from "./useTextBounds";
import { isPlexiglassBackboard } from "@/lib/designer/plexiglass";
import { normalizeBackboardType, type BackboardType } from "@/lib/designer/backboards";
import type { NeonTubeStyle, DisplayMode } from "@/lib/designer/neonTubeStyles";
import type { EditorFocus, NeonLayer, PlexiglassPanel } from "@/lib/designer/editor/types";

type Props = {
  layer: NeonLayer;
  neonStyle?: NeonTubeStyle;
  displayMode?: DisplayMode;
  backboardType?: BackboardType;
  showBackboard?: boolean;
  plexiglass?: PlexiglassPanel | null;
  focus?: EditorFocus;
  onSelect: () => void;
  onSelectPlexiglass: () => void;
  onChange: (patch: Partial<NeonLayer>) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
  onDoubleClick: () => void;
};

function NeonTextContent({
  layer,
  bounds,
  wrapW,
  neonStyle,
  displayMode,
  acrylicMount,
  contentRef,
}: {
  layer: NeonLayer;
  bounds: { innerWidth: number; innerHeight: number; width: number; height: number };
  wrapW: number | undefined;
  neonStyle: NeonTubeStyle;
  displayMode: DisplayMode;
  acrylicMount?: boolean;
  contentRef: RefObject<Konva.Group | null>;
}) {
  const font = layerFontFamily(layer);
  const fontStyle = layerFontStyle(layer);
  const displayText = textForKonva(layer) || "Double-click to edit";
  const { innerWidth, innerHeight } = bounds;
  const letterSpacing = effectiveLetterSpacing(layer);
  const rtl = needsRtlShaping(layer);
  const tubeDisplayMode: DisplayMode = rtl ? "single" : displayMode;

  const common = {
    fontFamily: font,
    fontSize: layer.fontSize,
    fontStyle,
    color: layer.color,
    glow: layer.glow,
    brightness: layer.brightness ?? 80,
    tubeStyle: layer.tubeStyle ?? 40,
    displayMode: tubeDisplayMode,
    opacity: layer.opacity,
    neonStyle,
    acrylicMount,
    letterSpacing,
    direction: rtl ? ("rtl" as const) : ("ltr" as const),
    lineHeight: layer.lineHeight,
    align: "center" as const,
    verticalAlign: "middle" as const,
    x: -innerWidth / 2,
    y: -innerHeight / 2,
    width: innerWidth,
    height: innerHeight,
    offsetX: 0,
    offsetY: 0,
    ...(wrapW !== undefined ? { width: wrapW } : {}),
  };

  return (
    <Group ref={contentRef} listening={false}>
      <NeonTubeText text={displayText} {...common} />
    </Group>
  );
}

export const NeonTextObject = memo(function NeonTextObject({
  layer,
  neonStyle = "open-tube",
  displayMode = "single",
  backboardType = "none",
  showBackboard = false,
  plexiglass = null,
  focus = "sign",
  onSelect,
  onSelectPlexiglass,
  onChange,
  onDragMove,
  onDragEnd,
  onDoubleClick,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const contentRef = useRef<Konva.Group>(null);
  const bounds = useTextBounds(layer, contentRef);

  const wrapW = useMemo(() => {
    if (layer.textLayout === "single") return undefined;
    return konvaWrapWidth(layer, bounds.innerWidth) ?? bounds.innerWidth;
  }, [layer, bounds.innerWidth]);

  const board = normalizeBackboardType(backboardType);
  const showPlexiglass = showBackboard && isPlexiglassBackboard(board) && plexiglass;
  const showSolidBoard = showBackboard && !isPlexiglassBackboard(board);

  useEffect(() => {
    groupRef.current?.getStage()?.batchDraw();
  }, [layer, backboardType, neonStyle, bounds, plexiglass]);

  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const innerHalfW = bounds.innerWidth / 2;
  const innerHalfH = bounds.innerHeight / 2;

  const canEdit = focus === "sign";

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
      draggable={canEdit}
      dragDistance={6}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragStart={(e) => {
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
      {showSolidBoard && (
        <BackboardShape
          type={backboardType}
          layer={layer}
          dims={{
            widthPx: bounds.width * layer.scaleX,
            heightPx: bounds.height * layer.scaleY,
            widthCm: 0,
            heightCm: 0,
          }}
          scaleX={layer.scaleX}
          scaleY={layer.scaleY}
        />
      )}

      {showPlexiglass && (
        <PlexiglassRect
          layerId={layer.id}
          panel={plexiglass}
          focused={focus === "plexiglass"}
          onSelect={onSelectPlexiglass}
        />
      )}

      {DEBUG_TEXT_BOUNDS && (
        <Group listening={false}>
          <Rect
            x={-halfW}
            y={-halfH}
            width={bounds.width}
            height={bounds.height}
            stroke="#00e5ff"
            strokeWidth={1}
            dash={[6, 4]}
          />
          <Rect
            x={-innerHalfW}
            y={-innerHalfH}
            width={bounds.innerWidth}
            height={bounds.innerHeight}
            stroke="#76ff03"
            strokeWidth={1}
            dash={[3, 3]}
          />
        </Group>
      )}

      <NeonTextContent
        layer={layer}
        bounds={bounds}
        wrapW={wrapW}
        neonStyle={neonStyle}
        displayMode={displayMode}
        acrylicMount={Boolean(showPlexiglass)}
        contentRef={contentRef}
      />

      <Rect
        x={-halfW}
        y={-halfH}
        width={bounds.width}
        height={bounds.height}
        fill="#ffffff"
        opacity={0}
        listening={canEdit}
      />
    </Group>
  );
});
