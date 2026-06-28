import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SOURCE = process.argv[2] ?? path.join(
  process.env.HOME ?? "",
  ".cursor/projects/Users-herofamily1-Documents-BSN-neon-bright/assets/neonbright-dd4a45b4-8aae-4735-bed0-cb7ab7999f7c.png"
);

const OUT_WIDE = path.join(root, "public/brand/logo-wide.png");
const OUT_ICON = path.join(root, "public/brand/logo-icon.png");
const OUT_APP_ICON = path.join(root, "app/icon.png");
const OUT_APPLE = path.join(root, "app/apple-icon.png");

/** Flood-fill near-black pixels to transparent; soften dark fringe for clean edges */
async function removeBlackBackground(inputPath) {
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const px = Buffer.from(data);

  for (let i = 0; i < px.length; i += channels) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Pure / near-black background
    if (max < 45) {
      px[i + 3] = 0;
      continue;
    }

    // Desaturated dark fringe / compression halo around black
    if (max < 95 && max - min < 25) {
      const t = Math.max(0, (max - 45) / 50);
      px[i + 3] = Math.round(Math.min(255, px[i + 3]) * t * t);
    }
  }

  return sharp(px, { raw: { width, height, channels } })
    .trim({ threshold: 15, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 100, effort: 10 });
}

async function main() {
  console.log("Processing:", SOURCE);
  const processed = await removeBlackBackground(SOURCE);
  const pngBuffer = await processed.png().toBuffer();
  const meta2 = await sharp(pngBuffer).metadata();
  const w = meta2.width ?? 850;
  const h = meta2.height ?? 280;
  console.log("Trimmed size:", w, "x", h);

  await sharp(pngBuffer).toFile(OUT_WIDE);
  console.log("Wrote", OUT_WIDE);

  const iconWidth = Math.min(w, Math.max(1, Math.round(w * 0.38)));
  await sharp(pngBuffer)
    .extract({ left: 0, top: 0, width: iconWidth, height: h })
    .trim({ threshold: 15, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(OUT_ICON);
  console.log("Wrote", OUT_ICON);

  await sharp(OUT_ICON)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(OUT_APP_ICON);
  console.log("Wrote", OUT_APP_ICON);

  await sharp(OUT_ICON)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(OUT_APPLE);
  console.log("Wrote", OUT_APPLE);

  const dims = { width: w, height: h };
  writeFileSync(
    path.join(root, "public/brand/logo-meta.json"),
    JSON.stringify(dims, null, 2)
  );
  console.log("Done.", dims);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
