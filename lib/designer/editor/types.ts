import type { BackboardType } from "../backboards";
import { TUBE_STYLE_DEFAULT, type DisplayMode, type NeonTubeStyle } from "../neonTubeStyles";
import { TRANSPARENT_WALL_ID } from "../wallPresets";

export type LayerType = "text" | "logo";
export type TextAlign = "left" | "center" | "right";
export type TextLayoutMode = "single" | "multiline" | "auto-wrap" | "manual";
export type EditorFocus = "sign" | "plexiglass";

export type PlexiglassPanel = {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  cornerRadius: number;
  manual: boolean;
};

export type NeonLayer = {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  zIndex: number;
  text: string;
  fontId: string;
  fontSize: number;
  color: string;
  glow: number;
  brightness: number;
  tubeStyle: number;
  letterSpacing: number;
  wordSpacing: number;
  lineHeight: number;
  align: TextAlign;
  textLayout: TextLayoutMode;
  wrapWidth: number;
  curved: boolean;
  imageUrl: string | null;
  fileName: string | null;
  file?: File | null;
};

export type EditorState = {
  layers: NeonLayer[];
  selectedId: string | null;
  focus: EditorFocus;
  plexiglass: PlexiglassPanel | null;
  displayMode: DisplayMode;
  canvasZoom: number;
  wallPreviewUrl: string | null;
  wallImage: File | null;
  wallPresetId: string | null;
  backboardType: BackboardType;
  neonStyle: NeonTubeStyle;
};

export const DEFAULT_LAYER_PROPS = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  fontSize: 64,
  color: "#ff2d95",
  glow: 35,
  brightness: 80,
  tubeStyle: TUBE_STYLE_DEFAULT,
  letterSpacing: 0,
  wordSpacing: 0,
  lineHeight: 1.2,
  align: "left" as TextAlign,
  textLayout: "single" as TextLayoutMode,
  wrapWidth: 320,
  curved: false,
  imageUrl: null,
  fileName: null,
};

let layerCounter = 0;
export function newLayerId(type: LayerType): string {
  layerCounter += 1;
  return `${type}-${Date.now()}-${layerCounter}`;
}

export function createTextLayer(partial?: Partial<NeonLayer>): NeonLayer {
  const id = newLayerId("text");
  return {
    ...DEFAULT_LAYER_PROPS,
    id,
    type: "text",
    name: "Text",
    x: 0,
    y: 0,
    zIndex: 1,
    text: "NEON BRIGHT",
    fontId: "kaushan-script",
    ...partial,
  };
}

export function createLogoLayer(
  imageUrl: string,
  fileName: string,
  file: File,
  partial?: Partial<NeonLayer>
): NeonLayer {
  const id = newLayerId("logo");
  return {
    ...DEFAULT_LAYER_PROPS,
    id,
    type: "logo",
    name: fileName.replace(/\.[^.]+$/, "") || "Logo",
    x: 0,
    y: 0,
    zIndex: 2,
    text: "",
    fontId: "kaushan-script",
    imageUrl,
    fileName,
    file,
    ...partial,
  };
}

const firstLayer = createTextLayer({ zIndex: 1 });

export const INITIAL_EDITOR_STATE: EditorState = {
  layers: [firstLayer],
  selectedId: firstLayer.id,
  focus: "sign",
  plexiglass: null,
  displayMode: "single",
  canvasZoom: 1,
  wallPreviewUrl: null,
  wallImage: null,
  wallPresetId: TRANSPARENT_WALL_ID,
  backboardType: "none",
  neonStyle: "open-tube",
};
