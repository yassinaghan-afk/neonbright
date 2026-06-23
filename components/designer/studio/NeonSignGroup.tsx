"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Line, Rect, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { resolveKonvaFont, SIZE_PRESETS } from "@/lib/designer/sizes";
import { SCALE_MAX, SCALE_MIN } from "@/lib/designer/constants";
import { glowBlur, estimateTextFontSize } from "@/lib/designer/studio/glow";
import { resolveSignBounds, scaleToSizePreset } from "@/lib/designer/studio/measurements";
import type { DesignerState } from "@/lib/designer/types";

type Props = {
  state: DesignerState;
  logoImage?: HTMLImageElement;
  onDragEnd: (x: number, y: number) => void;
  onResize: (scale: number, sizePreset: DesignerState["sizePreset"]) => void;
};

function WidthMeasure({ half, label }: { half: number; label: string }) {
  return (
    <Group y={0}>
      <Line points={[-half, 0, half, 0]} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <Line points={[-half, -5, -half, 5]} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <Line points={[half, -5, half, 5]} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <Text
        text={label}
        fontSize={11}
        fill="rgba(255,255,255,0.75)"
        fontFamily="Outfit, sans-serif"
        align="center"
        width={half * 2}
        offsetX={half}
        y={10}
      />
    </Group>
  );
}

function HeightMeasure({ half, label }: { half: number; label: string }) {
  return (
    <Group x={0}>
      <Line points={[0, -half, 0, half]} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <Line points={[-5, -half, 5, -half]} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <Line points={[-5, half, 5, half]} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <Text
        text={label}
        fontSize={11}
        fill="rgba(255,255,255,0.75)"
        fontFamily="Outfit, sans-serif"
        rotation={-90}
        align="center"
        width={half * 2}
        offsetX={half}
        x={-18}
      />
    </Group>
  );
}

function LiveSizeBadge({ label }: { label: string }) {
  return (
    <Group>
      <Rect
        x={-52}
        y={-14}
        width={104}
        height={28}
        fill="rgba(0,0,0,0.72)"
        cornerRadius={6}
        stroke="rgba(255,45,149,0.5)"
        strokeWidth={1}
      />
      <Text
        text={label}
        fontSize={12}
        fill="#ff2d95"
        fontFamily="Outfit, sans-serif"
        align="center"
        width={104}
        offsetX={52}
        y={-5}
      />
    </Group>
  );
}

export const NeonSignGroup = memo(function NeonSignGroup({
  state,
  logoImage,
  onDragEnd,
  onResize,
}: Props) {
  const contentRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [liveLabel, setLiveLabel] = useState("");

  const bounds = useMemo(
    () => resolveSignBounds(state, logoImage),
    [state, logoImage]
  );

  const font = resolveKonvaFont(state.fontFamily);
  const glow = glowBlur(state.glowIntensity);

  const textFontSize = useMemo(() => {
    const base = estimateTextFontSize(state.text || "NEON", bounds.widthPx);
    return base * (state.fontSize / 48);
  }, [state.text, state.fontSize, bounds.widthPx]);

  const logoScale = useMemo(() => {
    if (!logoImage?.width) return 1;
    return bounds.widthPx / logoImage.width;
  }, [logoImage, bounds.widthPx]);

  const halfW = bounds.contentWidthPx / 2;
  const halfH = bounds.contentHeightPx / 2;
  const measurePad = 28;

  useEffect(() => {
    const tr = trRef.current;
    const node = contentRef.current;
    if (tr && node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [bounds.contentWidthPx, bounds.contentHeightPx, state.signType]);

  const handleTransformStart = () => {
    setIsResizing(true);
    setLiveLabel(`${bounds.widthCm}cm × ${bounds.heightCm}cm`);
  };

  const handleTransform = () => {
    const node = contentRef.current;
    if (!node) return;
    const sx = node.scaleX();
    const liveW = Math.round(bounds.widthCm * (sx / state.transform.scale));
    const liveH = Math.round(bounds.heightCm * (sx / state.transform.scale));
    setLiveLabel(`${liveW}cm × ${liveH}cm`);
  };

  const handleTransformEnd = () => {
    const node = contentRef.current;
    if (!node) return;
    setIsResizing(false);

    const sx = node.scaleX();
    node.scaleX(1);
    node.scaleY(1);

    const nextScale = Math.min(
      SCALE_MAX,
      Math.max(SCALE_MIN, +(state.transform.scale * sx).toFixed(3))
    );
    const presetCm = SIZE_PRESETS.find((s) => s.id === state.sizePreset)?.cm ?? 120;
    const effectiveCm = presetCm * nextScale;
    const preset = scaleToSizePreset(effectiveCm);
    const normalizedScale = effectiveCm / (SIZE_PRESETS.find((s) => s.id === preset)?.cm ?? presetCm);
    onResize(normalizedScale, preset);
  };

  return (
    <Group
      x={state.transform.x}
      y={state.transform.y}
      rotation={state.transform.rotation}
      draggable
      onDragEnd={(e) => {
        if (e.target === e.currentTarget) onDragEnd(e.target.x(), e.target.y());
      }}
    >
      <Group x={-halfW - measurePad} y={0}>
        <HeightMeasure half={halfH} label={bounds.heightLabel} />
      </Group>

      <Group
        ref={contentRef}
        scaleX={state.transform.scale}
        scaleY={state.transform.scale}
        onTransformStart={handleTransformStart}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      >
        {isResizing && (
          <Group y={-halfH - 36}>
            <LiveSizeBadge label={liveLabel} />
          </Group>
        )}

        {state.signType === "text" ? (
          <Group>
            <Text
              text={state.text || "YOUR TEXT"}
              fontFamily={font}
              fontSize={textFontSize}
              fontStyle="bold"
              fill={state.color}
              shadowColor={state.color}
              shadowBlur={glow * 2}
              shadowOpacity={0.9}
              align="center"
              offsetX={halfW}
              offsetY={halfH}
              width={bounds.contentWidthPx}
            />
            <Text
              text={state.text || "YOUR TEXT"}
              fontFamily={font}
              fontSize={textFontSize}
              fontStyle="bold"
              fill={state.color}
              shadowColor={state.color}
              shadowBlur={glow}
              shadowOpacity={1}
              align="center"
              offsetX={halfW}
              offsetY={halfH}
              width={bounds.contentWidthPx}
            />
          </Group>
        ) : logoImage ? (
          <Group shadowColor={state.color} shadowBlur={glow * 1.5} shadowOpacity={0.85}>
            <KonvaImage
              image={logoImage}
              scaleX={logoScale}
              scaleY={logoScale}
              offsetX={logoImage.width / 2}
              offsetY={logoImage.height / 2}
            />
          </Group>
        ) : (
          <Text
            text={state.logoFile?.name ?? "Upload logo"}
            fontSize={14}
            fill={state.color}
            fontFamily="Outfit"
            shadowColor={state.color}
            shadowBlur={glow}
            offsetX={halfW}
            offsetY={halfH}
          />
        )}
      </Group>

      <Group y={halfH + measurePad}>
        <WidthMeasure half={halfW} label={bounds.widthLabel} />
      </Group>

      <Transformer
        ref={trRef}
        rotateEnabled={false}
        keepRatio
        enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
        borderStroke="#ff2d95"
        borderStrokeWidth={1}
        anchorFill="#ff2d95"
        anchorStroke="#ffffff"
        anchorSize={14}
        anchorCornerRadius={4}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 40 || newBox.height < 24) return oldBox;
          return newBox;
        }}
      />
    </Group>
  );
});
