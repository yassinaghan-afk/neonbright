export type LayerType = "text" | "logo";
export type TextAlign = "left" | "center" | "right";

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
  letterSpacing: number;
  lineHeight: number;
  align: TextAlign;
  curved: boolean;
  imageUrl: string | null;
  fileName: string | null;
  file?: File | null;
};

export type EditorState = {
  layers: NeonLayer[];
  selectedId: string | null;
  canvasZoom: number;
  wallPreviewUrl: string | null;
  wallImage: File | null;
  wallPresetId: string | null;
};

export const DEFAULT_LAYER_PROPS = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  fontSize: 64,
  color: "#ff2d95",
  glow: 70,
  letterSpacing: 0,
  lineHeight: 1.2,
  align: "center" as TextAlign,
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
    fontId: "outfit-modern",
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
    fontId: "outfit-modern",
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
  canvasZoom: 1,
  wallPreviewUrl: null,
  wallImage: null,
  wallPresetId: "black-wall",
};
