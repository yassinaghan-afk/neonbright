"use client";

import { useRef, useEffect } from "react";
import { Group, Text } from "react-konva";
import type Konva from "konva";
import type { TextAlign } from "@/lib/designer/editor/types";
import {
  isWhiteTube,
  NEUTRAL_AMBIENT_GLOW,
  NEUTRAL_AMBIENT_STROKE,
  tubeAmbientBlur,
  tubeAmbientIntensity,
  tubeOuterWall,
  visualTubeStrokeWidth,
  WHITE_TUBE_EDGE,
  TUBE_STYLE_DEFAULT,
  type DisplayMode,
  type NeonTubeStyle,
} from "@/lib/designer/neonTubeStyles";

export type NeonTubeTextProps = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  color: string;
  glow: number;
  brightness: number;
  tubeStyle?: number;
  displayMode?: DisplayMode;
  opacity: number;
  neonStyle: NeonTubeStyle;
  letterSpacing?: number;
  lineHeight?: number;
  align?: TextAlign;
  verticalAlign?: "top" | "middle" | "bottom";
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  direction?: "ltr" | "rtl" | "inherit";
};

const TUBE_CORE = "#ffffff";

export function NeonTubeText(props: NeonTubeTextProps) {
  const {
    text,
    fontFamily,
    fontSize,
    fontStyle,
    color,
    glow,
    brightness,
    tubeStyle = TUBE_STYLE_DEFAULT,
    displayMode = "single",
    opacity,
    letterSpacing,
    lineHeight,
    align = "center",
    verticalAlign = "middle",
    width,
    height,
    x = 0,
    y = 0,
    offsetX = 0,
    offsetY = 0,
    direction = "inherit",
  } = props;

  const tubeRef = useRef<Konva.Group>(null);
  const tubeW = visualTubeStrokeWidth(fontSize, tubeStyle);
  const coreW = Math.max(1.2, tubeW * (displayMode === "double" ? 0.22 : 0.32));
  const white = isWhiteTube(color);
  const tubeColor = white ? "#f4f4f4" : color;
  const outerWall = white ? WHITE_TUBE_EDGE : tubeOuterWall(color);
  const ambientBlur = tubeAmbientBlur(glow);
  const ambient = tubeAmbientIntensity(brightness, glow);

  const base = {
    text: text || " ",
    fontFamily,
    fontSize,
    fontStyle,
    ...(letterSpacing ? { letterSpacing } : {}),
    lineHeight,
    align,
    verticalAlign,
    width,
    height,
    x,
    y,
    offsetX,
    offsetY,
    direction,
    fill: "transparent",
    fillEnabled: false,
    lineJoin: "round" as const,
    lineCap: "round" as const,
    shadowForFillEnabled: false,
    perfectDrawEnabled: false,
    listening: false,
  };

  useEffect(() => {
    tubeRef.current?.getLayer()?.batchDraw();
  }, [text, fontFamily, fontSize, width, height, color, glow, brightness, tubeStyle, displayMode]);

  const ambientLayer = (
    <Text
      {...base}
      stroke={NEUTRAL_AMBIENT_STROKE}
      strokeWidth={tubeW}
      strokeOpacity={0}
      shadowForStrokeEnabled
      shadowColor={NEUTRAL_AMBIENT_GLOW}
      shadowBlur={ambientBlur}
      shadowOpacity={ambient}
    />
  );

  if (displayMode === "single") {
    return (
      <Group ref={tubeRef} listening={false}>
        {ambientLayer}
        <Text
          {...base}
          stroke={tubeColor}
          strokeWidth={tubeW}
          strokeOpacity={opacity}
          shadowForStrokeEnabled={false}
        />
        <Text
          {...base}
          stroke={TUBE_CORE}
          strokeWidth={coreW}
          strokeOpacity={opacity * (white ? 0.95 : 0.88)}
          shadowForStrokeEnabled={false}
        />
      </Group>
    );
  }

  return (
    <Group ref={tubeRef} listening={false}>
      {ambientLayer}
      <Text
        {...base}
        stroke={outerWall}
        strokeWidth={tubeW}
        strokeOpacity={opacity}
        shadowForStrokeEnabled={false}
      />
      <Text
        {...base}
        stroke={tubeColor}
        strokeWidth={tubeW * 0.72}
        strokeOpacity={opacity}
        shadowForStrokeEnabled={false}
      />
      <Text
        {...base}
        stroke={TUBE_CORE}
        strokeWidth={coreW}
        strokeOpacity={opacity * (white ? 0.95 : 0.9)}
        shadowForStrokeEnabled={false}
      />
    </Group>
  );
}
