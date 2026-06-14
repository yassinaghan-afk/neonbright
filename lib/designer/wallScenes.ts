import { WALL_SCENES } from "./sizes";

export type WallScene = (typeof WALL_SCENES)[number];

const SCENE_STYLES: Record<
  Exclude<WallScene, "Custom Upload">,
  { top: string; mid: string; bottom: string; accent: string }
> = {
  "Restaurant Wall": {
    top: "#1a1410",
    mid: "#2d2218",
    bottom: "#120e0a",
    accent: "#ff6b35",
  },
  "Hotel Lobby": {
    top: "#0f1419",
    mid: "#1c2834",
    bottom: "#0a0e12",
    accent: "#c9a962",
  },
  "Office Space": {
    top: "#e8eaed",
    mid: "#d1d5db",
    bottom: "#9ca3af",
    accent: "#6366f1",
  },
  "Shop Front": {
    top: "#111827",
    mid: "#1f2937",
    bottom: "#030712",
    accent: "#f472b6",
  },
  "Salon Interior": {
    top: "#1a1020",
    mid: "#2d1f3d",
    bottom: "#0d0812",
    accent: "#e879f9",
  },
};

export async function createWallSceneFile(scene: Exclude<WallScene, "Custom Upload">): Promise<File> {
  const style = SCENE_STYLES[scene];
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, style.top);
  grad.addColorStop(0.55, style.mid);
  grad.addColorStop(1, style.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = style.accent;
    ctx.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      80 + Math.random() * 200,
      2 + Math.random() * 4
    );
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Scene export failed"))), "image/jpeg", 0.88);
  });

  const slug = scene.toLowerCase().replace(/\s+/g, "-");
  return new File([blob], `${slug}-wall.jpg`, { type: "image/jpeg" });
}
