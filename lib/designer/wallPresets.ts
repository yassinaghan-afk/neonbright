export type WallTexture = "brick" | "concrete" | "wood" | "checkerboard" | "none";

export type WallSceneKind =
  | "transparent"
  | "coffee-shop"
  | "clothing-store"
  | "night-club"
  | "restaurant"
  | "bar"
  | "gaming-room"
  | "home-interior"
  | "office";

export type WallPreset = {
  id: string;
  label: string;
  top: string;
  mid: string;
  bottom: string;
  accent: string;
  texture?: WallTexture;
  transparent?: boolean;
  scene?: WallSceneKind;
};

export const TRANSPARENT_WALL_ID = "transparent-bg";

/** Curated realistic scenes — each leaves open wall space for neon placement */
export const WALL_PRESETS: WallPreset[] = [
  {
    id: TRANSPARENT_WALL_ID,
    label: "Transparent Background",
    top: "#2a2a2a",
    mid: "#1a1a1a",
    bottom: "#2a2a2a",
    accent: "#ff2d95",
    texture: "checkerboard",
    transparent: true,
    scene: "transparent",
  },
  {
    id: "coffee-shop",
    label: "Coffee Shop",
    top: "#2a2218",
    mid: "#1f1810",
    bottom: "#120e0a",
    accent: "#c4a574",
    scene: "coffee-shop",
  },
  {
    id: "clothing-store",
    label: "Clothing Store",
    top: "#ece8e4",
    mid: "#ddd6ce",
    bottom: "#c8bfb4",
    accent: "#1a1a1a",
    scene: "clothing-store",
  },
  {
    id: "night-club",
    label: "Night Club",
    top: "#12081a",
    mid: "#0a0510",
    bottom: "#050208",
    accent: "#a855f7",
    scene: "night-club",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    top: "#1e1410",
    mid: "#140e0a",
    bottom: "#0a0604",
    accent: "#d97706",
    scene: "restaurant",
  },
  {
    id: "home-interior",
    label: "Home Interior",
    top: "#eae6e0",
    mid: "#ddd8d0",
    bottom: "#cfc8be",
    accent: "#78716c",
    scene: "home-interior",
  },
  {
    id: "bar",
    label: "Bar",
    top: "#1a1008",
    mid: "#100a04",
    bottom: "#080402",
    accent: "#f59e0b",
    scene: "bar",
  },
  {
    id: "gaming-room",
    label: "Gaming Room",
    top: "#12101e",
    mid: "#0a0814",
    bottom: "#050408",
    accent: "#22d3ee",
    scene: "gaming-room",
  },
  {
    id: "office",
    label: "Office",
    top: "#e8eaed",
    mid: "#d8dce2",
    bottom: "#c4c9d0",
    accent: "#4f46e5",
    scene: "office",
  },
];

/** Curated walls shown first in the picker */
export const FEATURED_WALL_IDS = [
  TRANSPARENT_WALL_ID,
  "coffee-shop",
  "clothing-store",
  "night-club",
  "home-interior",
  "restaurant",
] as const;

export function wallPresetGradient(p: WallPreset): string {
  if (p.texture === "checkerboard") {
    return "repeating-conic-gradient(#2a2a2a 0% 25%, #1e1e1e 0% 50%) 50% / 16px 16px";
  }
  return `linear-gradient(180deg, ${p.top} 0%, ${p.mid} 55%, ${p.bottom} 100%)`;
}

export function isTransparentWall(presetId: string | null): boolean {
  return presetId === TRANSPARENT_WALL_ID || presetId === null;
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.35) {
  const grad = ctx.createRadialGradient(w / 2, h * 0.42, w * 0.15, w / 2, h * 0.42, w * 0.72);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawSceneDecor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: WallSceneKind,
  accent: string
) {
  const floorY = h * 0.82;

  switch (scene) {
    case "coffee-shop": {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.fillStyle = "rgba(60,40,20,0.35)";
      ctx.fillRect(0, h * 0.12, w * 0.14, h * 0.55);
      ctx.fillRect(w * 0.86, h * 0.1, w * 0.14, h * 0.5);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(w * 0.08, h * 0.7, w * 0.18, 8);
      ctx.globalAlpha = 1;
      break;
    }
    case "clothing-store": {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.strokeRect(w * 0.06 + i * 4, h * 0.15, w * 0.12, h * 0.5);
        ctx.strokeRect(w * 0.82 - i * 4, h * 0.15, w * 0.12, h * 0.5);
      }
      break;
    }
    case "night-club": {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, floorY, w, h - floorY);
      const spots = [
        [w * 0.15, h * 0.2],
        [w * 0.85, h * 0.2],
        [w * 0.1, h * 0.65],
        [w * 0.9, h * 0.65],
      ];
      for (const [sx, sy] of spots) {
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.22);
        g.addColorStop(0, `${accent}33`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }
    case "restaurant": {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.fillStyle = "rgba(80,50,30,0.2)";
      ctx.fillRect(w * 0.04, h * 0.55, w * 0.92, h * 0.08);
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = accent;
      for (let i = 0; i < 5; i++) ctx.fillRect(w * 0.2 + i * w * 0.15, h * 0.18, 6, h * 0.35);
      ctx.globalAlpha = 1;
      break;
    }
    case "bar": {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.fillStyle = "rgba(40,25,10,0.45)";
      ctx.fillRect(0, h * 0.75, w, h * 0.12);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = accent;
      for (let i = 0; i < 8; i++) ctx.fillRect(w * 0.12 + i * w * 0.1, h * 0.78, 4, 30);
      ctx.globalAlpha = 1;
      break;
    }
    case "gaming-room": {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.strokeStyle = `${accent}44`;
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.05, h * 0.72, w * 0.9, h * 0.06);
      const g = ctx.createLinearGradient(0, h * 0.1, w, h * 0.1);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.5, `${accent}18`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, h * 0.08, w, h * 0.04);
      break;
    }
    case "office": {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(w * 0.05, h * 0.6, w * 0.25, h * 0.06);
      ctx.fillRect(w * 0.7, h * 0.55, w * 0.22, h * 0.1);
      break;
    }
    case "home-interior": {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(w * 0.08, h * 0.52, w * 0.22, h * 0.14);
      ctx.fillRect(w * 0.72, h * 0.48, w * 0.18, h * 0.18);
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.35, h * 0.22, w * 0.3, h * 0.28);
      break;
    }
    default:
      break;
  }
}

export async function createWallPresetFile(presetId: string): Promise<File | null> {
  if (presetId === TRANSPARENT_WALL_ID) return null;

  const preset = WALL_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error("Unknown wall preset");

  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, preset.top);
  grad.addColorStop(0.55, preset.mid);
  grad.addColorStop(1, preset.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (preset.scene && preset.scene !== "transparent") {
    drawSceneDecor(ctx, canvas.width, canvas.height, preset.scene, preset.accent);
  }

  drawVignette(ctx, canvas.width, canvas.height, preset.scene === "office" ? 0.12 : 0.28);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Wall export failed"))), "image/jpeg", 0.9);
  });

  return new File([blob], `${presetId}.jpg`, { type: "image/jpeg" });
}
