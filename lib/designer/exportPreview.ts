import type { DesignerState } from "./types";
import { buildNeonTextStyle } from "./neonStyles";

type ExportInput = {
  state: DesignerState;
  containerWidth: number;
  containerHeight: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawNeonText(
  ctx: CanvasRenderingContext2D,
  state: DesignerState,
  cx: number,
  cy: number
) {
  const { color, fontSize, glowIntensity, transform, fontFamily, text } = state;
  const scale = transform.scale * (fontSize / 48);
  const t = glowIntensity / 100;

  ctx.save();
  ctx.translate(cx + transform.x, cy + transform.y);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  const font = fontFamily.includes("var(") ? "Outfit, sans-serif" : fontFamily;
  ctx.font = `700 ${48}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = color;
  ctx.shadowBlur = 8 + t * 32;
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);

  ctx.shadowBlur = 20 + t * 40;
  ctx.fillText(text, 0, 0);

  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawNeonLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: DesignerState,
  cx: number,
  cy: number
) {
  const { color, glowIntensity, transform } = state;
  const t = glowIntensity / 100;
  const w = img.width * transform.scale * 0.5;
  const h = img.height * transform.scale * 0.5;

  ctx.save();
  ctx.translate(cx + transform.x, cy + transform.y);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 + t * 24;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.shadowBlur = 20 + t * 36;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.shadowBlur = 0;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

export async function exportPreviewImage({
  state,
  containerWidth,
  containerHeight,
}: ExportInput): Promise<Blob> {
  if (!state.wallPreviewUrl) {
    throw new Error("Wall image required");
  }

  const canvas = document.createElement("canvas");
  const w = Math.max(containerWidth, 800);
  const h = Math.max(containerHeight, 600);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const wall = await loadImage(state.wallPreviewUrl);
  const wallRatio = wall.width / wall.height;
  const canvasRatio = w / h;
  let dw = w;
  let dh = h;
  let dx = 0;
  let dy = 0;
  if (wallRatio > canvasRatio) {
    dh = w / wallRatio;
    dy = (h - dh) / 2;
  } else {
    dw = h * wallRatio;
    dx = (w - dw) / 2;
  }
  ctx.drawImage(wall, dx, dy, dw, dh);

  const cx = w / 2;
  const cy = h / 2;

  if (state.signType === "text") {
    drawNeonText(ctx, state, cx, cy);
  } else if (state.logoPreviewUrl && state.logoFile?.type.startsWith("image/")) {
    const logo = await loadImage(state.logoPreviewUrl);
    drawNeonLogo(ctx, logo, state, cx, cy);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/png",
      0.92
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
