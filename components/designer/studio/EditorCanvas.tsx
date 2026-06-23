"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { Stage, Layer, Group, Rect, Image as KonvaImage, Line, Transformer } from "react-konva";
import type Konva from "konva";
import { useDesigner } from "../DesignerContext";
import { useContainerSize, useKonvaImage } from "./hooks";
import { useViewportZoom } from "./useViewportZoom";
import { NeonTextObject } from "./NeonTextObject";
import { NeonLogoObject } from "./NeonLogoObject";
import { TransformMeasures } from "./TransformMeasures";
import { clampLayer } from "@/lib/designer/editor/canvasBounds";
import { measureLayer } from "@/lib/designer/editor/measurements";
import { normalizeTextForLayout } from "@/lib/designer/editor/textLayout";
import { normalizeArabicText, needsRtlShaping } from "@/lib/designer/editor/arabicText";
import { isTransparentWall } from "@/lib/designer/wallPresets";
import { clampPlexiglassSize } from "@/lib/designer/plexiglass";
import type { NeonLayer } from "@/lib/designer/editor/types";
import type { NeonTubeStyle } from "@/lib/designer/neonTubeStyles";

const SNAP = 0;

function makeCheckerCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, 24, 24);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, 12, 12);
    ctx.fillRect(12, 12, 12, 12);
  }
  return canvas;
}

function coverImage(imgW: number, imgH: number, boxW: number, boxH: number) {
  const ratio = Math.max(boxW / imgW, boxH / imgH);
  const w = imgW * ratio;
  const h = imgH * ratio;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, width: w, height: h };
}

function snapValue(v: number): { value: number; snapped: boolean } {
  if (Math.abs(v) < SNAP) return { value: 0, snapped: true };
  return { value: v, snapped: false };
}

function LogoLayerItem({
  layer,
  neonStyle,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
}: {
  layer: NeonLayer;
  neonStyle: NeonTubeStyle;
  onSelect: () => void;
  onChange: (p: Partial<NeonLayer>) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
}) {
  const img = useKonvaImage(layer.imageUrl);
  return (
    <NeonLogoObject
      layer={layer}
      image={img}
      neonStyle={neonStyle}
      onSelect={onSelect}
      onChange={onChange}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    />
  );
}

export default function EditorCanvas() {
  const {
    state,
    selectLayer,
    selectFocus,
    updateLayer,
    updatePlexiglass,
    stageRef: ctxStageRef,
    setViewportSize,
    setCanvasZoom,
    setBoundaryWarning,
  } = useDesigner();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const { width, height } = useContainerSize(containerRef);
  const wallImage = useKonvaImage(state.wallPreviewUrl);
  const transparentWall = isTransparentWall(state.wallPresetId);
  const [checkerPattern, setCheckerPattern] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = makeCheckerCanvas();
    const img = new Image();
    img.onload = () => setCheckerPattern(img);
    img.src = canvas.toDataURL();
  }, []);

  const [guides, setGuides] = useState({ v: false, h: false });
  const [resizing, setResizing] = useState(false);
  const [editing, setEditing] = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(null);
  const [editText, setEditText] = useState("");

  const activeLayer =
    state.layers.find((l) => l.id === state.selectedId) ??
    state.layers.find((l) => l.type === "text") ??
    state.layers[0];

  const sorted = useMemo(
    () => [...state.layers].sort((a, b) => a.zIndex - b.zIndex),
    [state.layers]
  );

  const activeLogoImage = useKonvaImage(
    activeLayer?.type === "logo" ? activeLayer.imageUrl : null
  );

  const transformDims = activeLayer
    ? measureLayer(activeLayer, activeLogoImage)
    : null;

  const bindStage = useCallback(
    (node: Konva.Stage | null) => {
      stageRef.current = node;
      ctxStageRef.current = node;
    },
    [ctxStageRef]
  );

  useViewportZoom(containerRef, state.canvasZoom, setCanvasZoom);

  useEffect(() => {
    if (width > 0 && height > 0) setViewportSize({ width, height });
  }, [width, height, setViewportSize]);

  const plexiglassFocus =
    state.focus === "plexiglass" &&
    Boolean(state.plexiglass) &&
    activeLayer?.type === "text";

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage || !state.selectedId) {
      tr?.nodes([]);
      return;
    }
    const selected = state.layers.find((l) => l.id === state.selectedId);
    if (!selected) {
      tr.nodes([]);
      return;
    }
    const targetId = plexiglassFocus ? `plexiglass-${state.selectedId}` : state.selectedId;
    const node = stage.findOne(`#${targetId}`);
    if (node) {
      tr.nodes([node as Konva.Node]);
      tr.getLayer()?.batchDraw();
    }
  }, [
    plexiglassFocus,
    state.focus,
    state.selectedId,
    sorted,
    activeLayer?.text,
    activeLayer?.fontSize,
    activeLayer?.fontId,
  ]);

  const clearGuides = useCallback(() => setGuides({ v: false, h: false }), []);

  const handleDragMove = useCallback(
    (id: string, x: number, y: number) => {
      const layer = state.layers.find((l) => l.id === id);
      if (!layer) return;

      const vw = width / state.canvasZoom;
      const vh = height / state.canvasZoom;
      const clamped = clampLayer(layer, x, y, vw, vh);

      if (clamped.clamped) {
        setBoundaryWarning("Text kept inside canvas — drag within the visible area");
      }

      const sx = snapValue(clamped.x);
      const sy = snapValue(clamped.y);
      setGuides({ v: sx.snapped, h: sy.snapped });
      updateLayer(id, { x: sx.value, y: sy.value }, false);
    },
    [updateLayer, state.layers, state.canvasZoom, width, height, setBoundaryWarning]
  );

  const syncTransform = useCallback(() => {
    const node = trRef.current?.nodes()[0];
    if (!node || !state.selectedId) return;

    if (plexiglassFocus) {
      const group = node as Konva.Group;
      const layer = state.layers.find((l) => l.id === state.selectedId && l.type === "text");
      let w = Math.max(40, group.width() * group.scaleX());
      let h = Math.max(30, group.height() * group.scaleY());
      if (layer) {
        const clamped = clampPlexiglassSize(layer, w, h);
        w = clamped.width;
        h = clamped.height;
      }
      group.scaleX(1);
      group.scaleY(1);
      group.width(w);
      group.height(h);
      group.x(-w / 2);
      group.y(-h / 2);
      updatePlexiglass({ width: w, height: h, offsetX: 0, offsetY: 0, manual: true }, false);
      return;
    }

    updateLayer(
      state.selectedId,
      {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      },
      false
    );
  }, [plexiglassFocus, state.selectedId, state.layers, updateLayer, updatePlexiglass]);

  const commitTransform = useCallback(() => {
    const node = trRef.current?.nodes()[0];
    if (!node || !state.selectedId) return;

    if (plexiglassFocus) {
      const group = node as Konva.Group;
      const layer = state.layers.find((l) => l.id === state.selectedId && l.type === "text");
      let w = Math.max(40, group.width() * group.scaleX());
      let h = Math.max(30, group.height() * group.scaleY());
      if (layer) {
        const clamped = clampPlexiglassSize(layer, w, h);
        w = clamped.width;
        h = clamped.height;
      }
      group.scaleX(1);
      group.scaleY(1);
      group.width(w);
      group.height(h);
      group.x(-w / 2);
      group.y(-h / 2);
      updatePlexiglass({
        width: w,
        height: h,
        offsetX: 0,
        offsetY: 0,
        manual: true,
      });
      setResizing(false);
      return;
    }

    const layer = state.layers.find((l) => l.id === state.selectedId);
    const vw = width / state.canvasZoom;
    const vh = height / state.canvasZoom;
    let x = node.x();
    let y = node.y();

    if (layer) {
      const clamped = clampLayer(layer, x, y, vw, vh);
      x = clamped.x;
      y = clamped.y;
      if (clamped.clamped) {
        node.x(x);
        node.y(y);
        setBoundaryWarning("Text kept inside canvas — drag within the visible area");
      }
    }

    updateLayer(state.selectedId, {
      x,
      y,
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
    setResizing(false);
  }, [plexiglassFocus, state.selectedId, state.layers, state.canvasZoom, width, height, updateLayer, updatePlexiglass, setBoundaryWarning]);

  const openEditor = useCallback(
    (layer: NeonLayer) => {
      if (layer.type !== "text" || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = width / 2 + layer.x * state.canvasZoom;
      const cy = height / 2 + layer.y * state.canvasZoom;
      setEditing({
        id: layer.id,
        x: rect.left + cx - 120,
        y: rect.top + cy - 20,
        w: 240,
        h: 40,
      });
      setEditText(layer.text);
      selectLayer(layer.id);
    },
    [width, height, state.canvasZoom, selectLayer]
  );

  const commitEdit = useCallback(() => {
    if (!editing) return;
    const layer = state.layers.find((l) => l.id === editing.id);
    let text = layer
      ? normalizeTextForLayout(editText, layer.textLayout)
      : editText.replace(/\n/g, " ").replace(/\s+/g, " ");
    if (layer && needsRtlShaping(layer)) {
      text = normalizeArabicText(text);
    }
    updateLayer(editing.id, { text, name: text.slice(0, 20) || "Text" });
    setEditing(null);
  }, [editing, editText, updateLayer, state.layers]);

  const viewportW = width / state.canvasZoom;
  const viewportH = height / state.canvasZoom;
  const wallFit =
    wallImage && coverImage(wallImage.width, wallImage.height, viewportW, viewportH);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#080808] touch-none"
    >
      {editing && (() => {
        const editLayer = state.layers.find((l) => l.id === editing.id);
        const isSingle = editLayer?.textLayout === "single";
        const rtl = editLayer ? needsRtlShaping(editLayer) : false;
        return (
        <textarea
          autoFocus
          value={editText}
          dir={rtl ? "rtl" : "ltr"}
          onChange={(e) => {
            let v = e.target.value;
            if (isSingle) v = v.replace(/\n/g, " ");
            setEditText(v);
          }}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isSingle) {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") setEditing(null);
          }}
          className="fixed z-50 rounded-lg border border-neon-pink/50 bg-black/90 px-3 py-2 text-white outline-none"
          style={{
            left: editing.x,
            top: editing.y,
            width: editing.w,
            minHeight: editing.h,
            fontSize: 18,
            whiteSpace: isSingle ? "nowrap" : "pre-wrap",
            textAlign: rtl ? "right" : "left",
          }}
        />
        );
      })()}

      <Stage
        ref={bindStage}
        width={width}
        height={height}
      >
        <Layer>
          <Group x={width / 2} y={height / 2} scaleX={state.canvasZoom} scaleY={state.canvasZoom}>
            <Group x={-viewportW / 2} y={-viewportH / 2}>
              {transparentWall && checkerPattern ? (
                <Rect
                  name="canvas-bg"
                  width={viewportW}
                  height={viewportH}
                  fillPatternImage={checkerPattern}
                  fillPatternRepeat="repeat"
                />
              ) : wallImage && wallFit ? (
                <KonvaImage {...wallFit} image={wallImage} name="canvas-bg" />
              ) : (
                <>
                  <Rect name="canvas-bg" width={viewportW} height={viewportH} fill="#0a0a0a" />
                  <Rect
                    name="canvas-bg"
                    width={viewportW}
                    height={viewportH}
                    fillLinearGradientColorStops={[0, "#111", 1, "#050505"]}
                    fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                    fillLinearGradientEndPoint={{ x: viewportW, y: viewportH }}
                  />
                </>
              )}
            </Group>

            {guides.v && (
              <Line
                points={[0, -viewportH, 0, viewportH]}
                stroke="#ff2d95"
                strokeWidth={1}
                dash={[6, 4]}
                listening={false}
              />
            )}
            {guides.h && (
              <Line
                points={[-viewportW, 0, viewportW, 0]}
                stroke="#ff2d95"
                strokeWidth={1}
                dash={[6, 4]}
                listening={false}
              />
            )}

            {sorted.map((layer) => {
              if (layer.type === "text") {
                return (
                <NeonTextObject
                  key={layer.id}
                  layer={layer}
                  neonStyle={state.neonStyle}
                  displayMode={state.displayMode}
                  backboardType={state.backboardType}
                  showBackboard={state.selectedId === layer.id}
                  plexiglass={state.plexiglass}
                  focus={state.focus}
                  onSelect={() => {
                    selectLayer(layer.id);
                    selectFocus("sign");
                  }}
                  onSelectPlexiglass={() => {
                    selectLayer(layer.id);
                    selectFocus("plexiglass");
                  }}
                  onChange={(p) => updateLayer(layer.id, p)}
                  onDragMove={(x, y) => handleDragMove(layer.id, x, y)}
                  onDragEnd={clearGuides}
                  onDoubleClick={() => openEditor(layer)}
                />
                );
              }
              return (
                <LogoLayerItem
                  key={layer.id}
                  layer={layer}
                  neonStyle={state.neonStyle}
                  onSelect={() => selectLayer(layer.id)}
                  onChange={(p) => updateLayer(layer.id, p)}
                  onDragMove={(x, y) => handleDragMove(layer.id, x, y)}
                  onDragEnd={clearGuides}
                />
              );
            })}

            {activeLayer && transformDims && state.selectedId === activeLayer.id && !plexiglassFocus && resizing && (
              <TransformMeasures
                x={activeLayer.x}
                y={activeLayer.y}
                dims={transformDims}
                active={resizing}
              />
            )}

            <Transformer
              ref={trRef}
              rotateEnabled={!plexiglassFocus}
              keepRatio={false}
              centeredScaling={plexiglassFocus}
              enabledAnchors={
                plexiglassFocus
                  ? [
                      "top-left",
                      "top-right",
                      "bottom-left",
                      "bottom-right",
                      "middle-left",
                      "middle-right",
                      "top-center",
                      "bottom-center",
                    ]
                  : [
                      "top-left",
                      "top-right",
                      "bottom-left",
                      "bottom-right",
                      "middle-left",
                      "middle-right",
                      "top-center",
                      "bottom-center",
                    ]
              }
              borderStroke={plexiglassFocus ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.35)"}
              anchorFill={plexiglassFocus ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.9)"}
              anchorStroke={plexiglassFocus ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.4)"}
              borderDash={plexiglassFocus ? undefined : [4, 4]}
              anchorSize={
                typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
                  ? 22
                  : 12
              }
              anchorCornerRadius={plexiglassFocus ? 3 : 2}
              borderStrokeWidth={plexiglassFocus ? 1.5 : 1}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 16) return oldBox;
                return newBox;
              }}
              onTransformStart={() => setResizing(true)}
              onTransform={syncTransform}
              onTransformEnd={commitTransform}
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
