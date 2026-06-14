export type WallPreset = {
  id: string;
  label: string;
  top: string;
  mid: string;
  bottom: string;
  accent: string;
  texture?: "brick" | "concrete" | "none";
};

export const WALL_PRESETS: WallPreset[] = [
  { id: "black-wall", label: "Black Wall", top: "#0a0a0a", mid: "#111111", bottom: "#050505", accent: "#ff2d95" },
  { id: "white-wall", label: "White Wall", top: "#f5f5f5", mid: "#e8e8e8", bottom: "#d4d4d4", accent: "#a855f7" },
  { id: "concrete-wall", label: "Concrete Wall", top: "#9ca3af", mid: "#6b7280", bottom: "#4b5563", accent: "#38bdf8", texture: "concrete" },
  { id: "brick-wall", label: "Brick Wall", top: "#7c2d12", mid: "#9a3412", bottom: "#431407", accent: "#f97316", texture: "brick" },
  { id: "restaurant", label: "Restaurant Wall", top: "#1a1410", mid: "#2d2218", bottom: "#120e0a", accent: "#ff6b35" },
  { id: "hotel-reception", label: "Hotel Reception", top: "#0f1419", mid: "#1c2834", bottom: "#0a0e12", accent: "#c9a962" },
  { id: "beauty-salon", label: "Beauty Salon", top: "#1a1020", mid: "#2d1f3d", bottom: "#0d0812", accent: "#e879f9" },
  { id: "retail-store", label: "Retail Store", top: "#111827", mid: "#1f2937", bottom: "#030712", accent: "#f472b6" },
  { id: "gym-wall", label: "Gym Wall", top: "#0f172a", mid: "#1e293b", bottom: "#020617", accent: "#22d3ee" },
  { id: "bar-interior", label: "Bar Interior", top: "#1c0a0a", mid: "#2d1515", bottom: "#0a0505", accent: "#ef4444" },
  { id: "office-reception", label: "Office Reception", top: "#e8eaed", mid: "#d1d5db", bottom: "#9ca3af", accent: "#6366f1" },
  { id: "outdoor-storefront", label: "Outdoor Storefront", top: "#374151", mid: "#1f2937", bottom: "#111827", accent: "#fde047" },
];

export async function createWallPresetFile(presetId: string): Promise<File> {
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

  if (preset.texture === "brick") {
    ctx.globalAlpha = 0.15;
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 12; col++) {
        const ox = col * 140 + (row % 2) * 70;
        const oy = row * 50;
        ctx.strokeStyle = "#000";
        ctx.strokeRect(ox, oy, 130, 45);
      }
    }
    ctx.globalAlpha = 1;
  }

  if (preset.texture === "concrete") {
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = preset.accent;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 120, 2);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Wall export failed"))), "image/jpeg", 0.9);
  });

  return new File([blob], `${presetId}.jpg`, { type: "image/jpeg" });
}
