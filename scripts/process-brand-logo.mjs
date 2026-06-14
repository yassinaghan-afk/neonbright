/**
 * Brand logo processor: flood-fill background removal + tight crop + OG/icon export.
 * Usage: node scripts/process-brand-logo.mjs [/path/to/source.png|jpg]
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const src =
  process.argv[2] ||
  "/Users/herofamily1/.cursor/projects/Users-herofamily1-Documents-BSN-neon-bright/assets/neonbright-8f4dfa3e-bf3c-42de-a754-63ca0ce40a31.png";

const brandDir = path.join(root, "public/brand");
fs.mkdirSync(brandDir, { recursive: true });

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sat(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx > 0 ? (mx - mn) / mx : 0;
}

/**
 * Flood-fill from all four edges, marking background pixels transparent.
 * Background = any pixel reachable from an edge whose luminance < LUM_THRESH.
 * Then also zap isolated dark low-saturation pixels anywhere in the image.
 */
function removeBackground(pixels, w, h, { lumThresh = 32, satThresh = 0.18 } = {}) {
  const stride = 4;
  const n = w * h;
  const visited = new Uint8Array(n);
  const queue = [];

  function isBackground(idx) {
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const l = lum(r, g, b);
    const s = sat(r, g, b);
    // Very dark pixels are always background regardless of saturation
    if (l < 18) return true;
    // Dark + low saturation = background shadow/glow
    if (l < lumThresh && s < satThresh) return true;
    return false;
  }

  function enqueue(x, y) {
    const pi = y * w + x;
    if (visited[pi]) return;
    visited[pi] = 1;
    const idx = pi * stride;
    if (isBackground(idx)) {
      queue.push(pi);
    }
  }

  // Seed from all 4 edges
  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  // BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const pi = queue[head++];
    const px = pi % w;
    const py = Math.floor(pi / w);
    // Make this pixel transparent
    pixels[pi * stride + 3] = 0;

    // 4-connected neighbors
    if (px > 0) enqueue(px - 1, py);
    if (px < w - 1) enqueue(px + 1, py);
    if (py > 0) enqueue(px, py - 1);
    if (py < h - 1) enqueue(px, py + 1);
  }

  // Second pass: remove any remaining dark near-neutral pixels (glow halos, shadow artifacts)
  for (let i = 0; i < n; i++) {
    const idx = i * stride;
    if (pixels[idx + 3] === 0) continue;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const l = lum(r, g, b);
    const s = sat(r, g, b);
    // Any pixel with lum < 35 is too dark to be meaningful neon content
    if (l < 35) {
      pixels[idx + 3] = 0;
    } else if (l < 50 && s < 0.14) {
      pixels[idx + 3] = 0;
    } else if (l < 70 && s < 0.07) {
      const alpha = Math.round(((l - 50) / 20) * 255);
      pixels[idx + 3] = Math.min(pixels[idx + 3], Math.max(0, alpha));
    }
  }
}

async function makeTransparentLogo(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  removeBackground(pixels, info.width, info.height);

  // First trim
  const { data: td1, info: ti1 } = await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 0 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Second flood-fill pass on trimmed result to catch newly exposed edge background
  const px2 = Buffer.from(td1);
  removeBackground(px2, ti1.width, ti1.height, { lumThresh: 40, satThresh: 0.25 });

  // Final trim
  const final = await sharp(px2, {
    raw: { width: ti1.width, height: ti1.height, channels: 4 },
  })
    .trim({ threshold: 0 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await sharp(final).toFile(outputPath);
  const meta = await sharp(outputPath).metadata();
  return meta;
}

async function verifyEdges(logoPath) {
  const { data, info } = await sharp(logoPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  let opaque = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x > 1 && x < w - 2 && y > 1 && y < h - 2) continue;
    const a = data[(y * w + x) * 4 + 3];
    if (a > 20) opaque++;
  }
  return { opaque, width: w, height: h };
}

async function makeOgImage(logoPath, outputPath) {
  const meta = await sharp(logoPath).metadata();
  const canvasW = 1200, canvasH = 630;
  const scale = Math.min((canvasW * 0.70) / meta.width, (canvasH * 0.52) / meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);

  const resized = await sharp(logoPath).resize(w, h).png().toBuffer();
  const left = Math.round((canvasW - w) / 2);
  const top = Math.round((canvasH - h) / 2);

  await sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: { r: 10, g: 10, b: 12, alpha: 1 } },
  })
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 93 })
    .toFile(outputPath);
}

async function makeIcon(logoPath, outputPath) {
  // Crop to rainbow arc (left ~38% of logo)
  const meta = await sharp(logoPath).metadata();
  const cropW = Math.round(meta.width * 0.38);
  const icon = await sharp(logoPath)
    .extract({ left: 0, top: 0, width: cropW, height: meta.height })
    .trim({ threshold: 0 })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(icon).toFile(outputPath);
}

// ── Run ────────────────────────────────────────────────────────────────────
const logoPath = path.join(brandDir, "neon-bright-logo.png");
const meta = await makeTransparentLogo(src, logoPath);
console.log("✓ logo processed:", meta.width, "×", meta.height, "px");

const { opaque, width, height } = await verifyEdges(logoPath);
if (opaque > 0) {
  console.warn(`⚠  ${opaque} opaque pixels remain on outer 2px border — check manually`);
} else {
  console.log("✓ edge verification passed — no opaque border pixels");
}

await makeOgImage(logoPath, path.join(brandDir, "neon-bright-og.png"));
console.log("✓ OG image saved");

for (const name of ["icon.png", "apple-icon.png"]) {
  await makeIcon(logoPath, path.join(root, "app", name));
  console.log("✓", name, "saved");
}
await makeOgImage(logoPath, path.join(root, "app", "opengraph-image.png"));
console.log("✓ opengraph-image.png saved");
