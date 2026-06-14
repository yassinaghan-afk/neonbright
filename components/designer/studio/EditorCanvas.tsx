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
import { measureLayer } from "@/lib/designer/editor/measurements";
import type { NeonLayer } from "@/lib/designer/editor/types";

const SNAP = 10;

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
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
}: {
  layer: NeonLayer;
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
      onSelect={onSelect}
      onChange={onChange}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    />
  );
}

export default function EditorCanvas() {
  const { state, selectLayer, updateLayer, stageRef: ctxStageRef, setViewportSize, setCanvasZoom } =
    useDesigner();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const { width, height } = useContainerSize(containerRef);
  const wallImage = useKonvaImage(state.wallPreviewUrl);

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

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage || !state.selectedId) {
      tr?.nodes([]);
      return;
    }
    const node = stage.findOne(`#${state.selectedId}`);
    if (node) {
      tr.nodes([node as Konva.Node]);
      tr.getLayer()?.batchDraw();
    }
  }, [state.selectedId, sorted, state.layers]);

  const clearGuides = useCallback(() => setGuides({ v: false, h: false }), []);

  const handleDragMove = useCallback(
    (id: string, x: number, y: number) => {
      const sx = snapValue(x);
      const sy = snapValue(y);
      setGuides({ v: sx.snapped, h: sy.snapped });
      updateLayer(id, { x: sx.value, y: sy.value }, false);
    },
    [updateLayer]
  );

  const syncTransform = useCallback(() => {
    const node = trRef.current?.nodes()[0];
    if (!node || !state.selectedId) return;
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
  }, [state.selectedId, updateLayer]);

  const commitTransform = useCallback(() => {
    const node = trRef.current?.nodes()[0];
    if (!node || !state.selectedId) return;
    updateLayer(state.selectedId, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
    setResizing(false);
  }, [state.selectedId, updateLayer]);

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
    if (editing) {
      updateLayer(editing.id, { text: editText, name: editText.slice(0, 20) || "Text" });
      setEditing(null);
    }
  }, [editing, editText, updateLayer]);

  const reselectDefault = useCallback(() => {
    const target =
      state.layers.find((l) => l.type === "text") ?? state.layers[0];
    if (target) selectLayer(target.id);
  }, [state.layers, selectLayer]);

  const viewportW = width / state.canvasZoom;
  const viewportH = height / state.canvasZoom;
  const wallFit =
    wallImage && coverImage(wallImage.width, wallImage.height, viewportW, viewportH);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[55dvh] overflow-hidden rounded-xl border border-white/10 bg-[#080808] touch-none md:min-h-[calc(100dvh-10rem)]"
      onClick={reselectDefault}
    >
      {editing && (
        <textarea
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") setEditing(null);
          }}
          className="fixed z-50 rounded-lg border border-neon-pink/50 bg-black/90 px-3 py-2 text-center text-white outline-none"
          style={{
            left: editing.x,
            top: editing.y,
            width: editing.w,
            minHeight: editing.h,
            fontSize: 18,
          }}
        />
      )}

      <Stage ref={bindStage} width={width} height={height}>
        <Layer>
          <Group x={width / 2} y={height / 2} scaleX={state.canvasZoom} scaleY={state.canvasZoom}>
            <Group x={-viewportW / 2} y={-viewportH / 2}>
              {wallImage && wallFit ? (
                <KonvaImage {...wallFit} image={wallImage} />
              ) : (
                <>
                  <Rect width={viewportW} height={viewportH} fill="#0a0a0a" />
                  <Rect
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

            {sorted.map((layer) =>
              layer.type === "text" ? (
                <NeonTextObject
                  key={layer.id}
                  layer={layer}
                  onSelect={() => selectLayer(layer.id)}
                  onChange={(p) => updateLayer(layer.id, p)}
                  onDragMove={(x, y) => handleDragMove(layer.id, x, y)}
                  onDragEnd={clearGuides}
                  onDoubleClick={() => openEditor(layer)}
                />
              ) : (
                <LogoLayerItem
                  key={layer.id}
                  layer={layer}
                  onSelect={() => selectLayer(layer.id)}
                  onChange={(p) => updateLayer(layer.id, p)}
                  onDragMove={(x, y) => handleDragMove(layer.id, x, y)}
                  onDragEnd={clearGuides}
                />
              )
            )}

            {resizing && activeLayer && transformDims && (
              <TransformMeasures
                x={activeLayer.x}
                y={activeLayer.y}
                dims={transformDims}
              />
            )}

            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              borderStroke="#ff2d95"
              anchorFill="#ff2d95"
              anchorSize={12}
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
