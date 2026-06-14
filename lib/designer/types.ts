export type SignType = "text" | "logo";

export type DesignerTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type SizePreset = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type MountingType = "wall-mount" | "hanging" | "freestanding" | "adhesive";

export type DesignerSnapshot = {
  signType: SignType;
  text: string;
  fontFamily: string;
  color: string;
  fontSize: number;
  glowIntensity: number;
  transform: DesignerTransform;
  canvasZoom: number;
  sizePreset: SizePreset;
  quantity: number;
  mountingType: MountingType;
  estimatedPrice: number;
  wallFileName: string | null;
  logoFileName: string | null;
  editorLayers?: import("./editor/types").NeonLayer[];
};

export type DesignerState = {
  signType: SignType;
  wallImage: File | null;
  wallPreviewUrl: string | null;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  text: string;
  fontFamily: string;
  color: string;
  fontSize: number;
  glowIntensity: number;
  transform: DesignerTransform;
  canvasZoom: number;
  sizePreset: SizePreset;
  quantity: number;
  mountingType: MountingType;
};

export const INITIAL_TRANSFORM: DesignerTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

export const INITIAL_DESIGNER_STATE: DesignerState = {
  signType: "text",
  wallImage: null,
  wallPreviewUrl: null,
  logoFile: null,
  logoPreviewUrl: null,
  text: "NEON BRIGHT",
  fontFamily: "var(--font-heading)",
  color: "#ff2d95",
  fontSize: 48,
  glowIntensity: 70,
  transform: { ...INITIAL_TRANSFORM },
  canvasZoom: 1,
  sizePreset: "L",
  quantity: 1,
  mountingType: "wall-mount",
};

export type DesignerQuotePayload = {
  snapshot: DesignerSnapshot;
  wallImage: File;
  logoFile: File | null;
  previewBlob: Blob;
};

export function toSnapshot(state: DesignerState, estimatedPrice: number): DesignerSnapshot {
  return {
    signType: state.signType,
    text: state.text,
    fontFamily: state.fontFamily,
    color: state.color,
    fontSize: state.fontSize,
    glowIntensity: state.glowIntensity,
    transform: { ...state.transform },
    canvasZoom: state.canvasZoom,
    sizePreset: state.sizePreset,
    quantity: state.quantity,
    mountingType: state.mountingType,
    estimatedPrice,
    wallFileName: state.wallImage?.name ?? null,
    logoFileName: state.logoFile?.name ?? null,
  };
}
