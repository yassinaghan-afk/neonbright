import type Konva from "konva";
import { normalizeBackboardType } from "../backboards";
import { measureLayer } from "./measurements";
import type { EditorState, NeonLayer } from "./types";
import { resolveFontFamily } from "../fonts";
import type { DesignerSnapshot } from "../types";

const BACKBOARD_FEES: Record<string, number> = {
  none: 0,
  "transparent-acrylic": 85,
  "transparent-acrylic-offset": 85,
  "black-acrylic": 70,
  "white-acrylic": 70,
};

export function editorToSnapshot(state: EditorState, estimatedPrice: number): DesignerSnapshot {
  const selected =
    state.layers.find((l) => l.id === state.selectedId) ??
    state.layers.find((l) => l.type === "text") ??
    state.layers[0];
  const textLayer = state.layers.find((l) => l.type === "text");
  const logoLayer = state.layers.find((l) => l.type === "logo");

  return {
    signType: selected?.type === "logo" ? "logo" : "text",
    text: textLayer?.text ?? selected?.text ?? "",
    fontFamily: resolveFontFamily(selected?.fontId ?? "kaushan-script"),
    color: selected?.color ?? "#ff2d95",
    fontSize: selected?.fontSize ?? 64,
    glowIntensity: selected?.glow ?? 70,
    transform: {
      x: selected?.x ?? 0,
      y: selected?.y ?? 0,
      scale: selected?.scaleX ?? 1,
      rotation: selected?.rotation ?? 0,
    },
    canvasZoom: state.canvasZoom,
    sizePreset: "L",
    quantity: 1,
    mountingType: "wall-mount",
    estimatedPrice,
    wallFileName: state.wallImage?.name ?? null,
    logoFileName: logoLayer?.fileName ?? null,
    editorLayers: state.layers,
  };
}

export function estimateEditorPrice(state: EditorState): number {
  const layer =
    state.layers.find((l) => l.id === state.selectedId) ??
    state.layers.find((l) => l.type === "text") ??
    state.layers[0];
  if (!layer) return 640;

  const dims = measureLayer(layer);
  const area = dims.widthCm * dims.heightCm;
  let base = 380 + area * 2.8;

  if (layer.type === "logo") base *= 1.18;
  if (layer.glow > 80) base *= 1.04;

  const board = normalizeBackboardType(state.backboardType);
  base += BACKBOARD_FEES[board] ?? 0;

  const textLen = (layer.text ?? "").length;
  if (textLen > 12) base += (textLen - 12) * 8;

  return Math.round(base * Math.max(1, state.layers.length * 0.9) + 100);
}

export type ExtendedSnapshot = DesignerSnapshot & { editorLayers?: NeonLayer[] };

export async function exportStageAs(
  stage: Konva.Stage,
  format: "png" | "jpeg"
): Promise<Blob> {
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const uri = stage.toDataURL({ pixelRatio: 2, mimeType: mime });
  const res = await fetch(uri);
  return res.blob();
}

export async function exportStagePreview(stage: Konva.Stage): Promise<Blob> {
  return exportStageAs(stage, "png");
}
