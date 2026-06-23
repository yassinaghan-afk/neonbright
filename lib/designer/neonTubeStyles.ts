import type { CSSProperties } from "react";

export type NeonTubeStyle = "open-tube" | "classic-tube" | "double-tube" | "premium-glass";
export type DisplayMode = "single" | "double";

export const DISPLAY_MODES: { id: DisplayMode; label: string }[] = [
  { id: "single", label: "Single Line" },
  { id: "double", label: "Double Line" },
];

export const NEON_TUBE_STYLES = [
  { id: "open-tube" as const, label: "Open Tube Neon", description: "Physical LED flex tube on acrylic" },
];

export const TUBE_STYLE_DEFAULT = 40;
/** UI alias — stored on layer as tubeStyle */
export const TUBE_WIDTH_DEFAULT = TUBE_STYLE_DEFAULT;
export const TUBE_STYLE_MIN = 0;
export const TUBE_STYLE_MAX = 100;

/** Fixed padding for bounds — never varies with glow/brightness/tube style */
export const MEASUREMENT_GLOW_PAD = 10;

/** White / light-grey ambient halo — never tinted by tube color */
export const NEUTRAL_AMBIENT_GLOW = "#eceef2";
export const NEUTRAL_AMBIENT_STROKE = "#d4d8e0";
export const WHITE_TUBE_EDGE = "#8e98a8";

/** Bounds / measurements — constant optimized tube diameter */
export function measurementTubeStrokeWidth(fontSize: number): number {
  const base = Math.max(5.5, Math.min(fontSize * 0.12, 16));
  return base * 0.72;
}

/** Visual-only tube width from Tube Width slider (0–100) */
export function visualTubeStrokeWidth(fontSize: number, tubeStyle: number): number {
  const m = measurementTubeStrokeWidth(fontSize);
  const t = Math.max(TUBE_STYLE_MIN, Math.min(TUBE_STYLE_MAX, tubeStyle)) / 100;
  const scale = 0.55 + t * 0.65;
  return m * scale;
}

/** @deprecated Use measurementTubeStrokeWidth for bounds, visualTubeStrokeWidth for render */
export function tubeStrokeWidth(
  fontSize: number,
  _style: NeonTubeStyle = "open-tube",
  _thickness?: number
): number {
  return measurementTubeStrokeWidth(fontSize);
}

/** Brightness 0–100 → emission intensity only */
export function tubeEmissionIntensity(brightness: number): number {
  const b = Math.max(0, Math.min(100, brightness)) / 100;
  return 0.12 + b * 0.78;
}

export function tubeAmbientIntensity(brightness: number, glow: number): number {
  const b = Math.max(0, Math.min(100, brightness)) / 100;
  const g = Math.max(0, Math.min(100, glow)) / 100;
  return (0.02 + b * 0.16) * (0.2 + g * 0.65);
}

export function tubeBrightnessMultiplier(brightness: number): number {
  return tubeEmissionIntensity(brightness);
}

/** Tight colored emission along tube path — visual only */
export function tubeEmissionBlur(glowAmount: number): number {
  return Math.min(2 + glowAmount * 0.04, 6);
}

/** Neutral ambient halo — visual only, capped */
export function tubeAmbientBlur(glowAmount: number): number {
  return Math.min(4 + glowAmount * 0.08, 14);
}

export function lightenColor(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export function darkenColor(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const dr = Math.max(0, Math.round(r * (1 - amount)));
  const dg = Math.max(0, Math.round(g * (1 - amount)));
  const db = Math.max(0, Math.round(b * (1 - amount)));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

export function isWhiteTube(color: string): boolean {
  const h = color.replace("#", "").toLowerCase();
  if (h === "ffffff" || h === "fff") return true;
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return r >= 238 && g >= 238 && b >= 238;
}

export function tubeOuterWall(color: string): string {
  if (isWhiteTube(color)) return WHITE_TUBE_EDGE;
  return darkenColor(color, 0.2);
}

export function tubeLedCore(_color: string): string {
  return "#ffffff";
}

export function neonCssPreviewStyle(color: string): CSSProperties {
  const tube = isWhiteTube(color) ? "#f0f0f0" : color;
  return {
    color: "transparent",
    WebkitTextStroke: `1.5px ${tube}`,
    filter: `drop-shadow(0 0 5px ${NEUTRAL_AMBIENT_GLOW}66)`,
    paintOrder: "stroke fill",
  } as CSSProperties;
}
