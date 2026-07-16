/**
 * convert-images-to-webp.mjs
 *
 * Converts eligible static repository images (JPG/JPEG/PNG) to WebP.
 * Creates the .webp file beside the original — never overwrites it.
 * Skips conversion when the WebP result would be larger than the original.
 *
 * Usage:
 *   npm run images:dry      — preview only, nothing written
 *   npm run images:apply    — write WebP files
 *
 * The script is safely rerunnable: it skips files whose .webp already exists.
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv[2] === "apply";

// ─── Conversion groups ────────────────────────────────────────────────────────

const GROUPS = [
  {
    dir: "public/media/hero-slider",
    exts: ["jpg", "jpeg"],
    maxWidth: 1920,
    quality: 80,
    lossless: false,
  },
  {
    dir: "public/media/logo",
    exts: ["jpg", "jpeg", "png"],
    maxWidth: 400,
    quality: 85,
    lossless: false,
  },
  {
    dir: "public/brand",
    exts: ["png"],
    maxWidth: 900,
    quality: 90,
    lossless: true,
    skip: ["neon-bright-og.png"], // OG image — keep PNG for broad compat
  },
  {
    dir: "public/uploads/cms",
    exts: ["png"],
    maxWidth: 1200,
    quality: 85,
    lossless: false,
    minBytes: 1024, // skip corrupted/empty stubs
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function destPath(src) {
  return src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

function fmt(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

async function collectFiles(group) {
  const dir = path.join(ROOT, group.dir);
  let entries;
  try { entries = await fs.readdir(dir); } catch { return []; }

  const out = [];
  for (const name of entries) {
    if (name.startsWith(".")) continue;
    if (group.skip?.includes(name)) continue;
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (!group.exts.includes(ext)) continue;
    const src = path.join(dir, name);
    const stat = await fs.stat(src).catch(() => null);
    if (!stat?.isFile()) continue;
    if (group.minBytes && stat.size < group.minBytes) continue;
    const dest = destPath(src);
    let exists = false;
    try { await fs.access(dest); exists = true; } catch { /**/ }
    out.push({ src, dest, origBytes: stat.size, exists });
  }
  return out;
}

async function convert(entry, group) {
  const meta = await sharp(entry.src).metadata();
  const origW = meta.width ?? 0;
  let p = sharp(entry.src).rotate();
  if (group.maxWidth > 0 && origW > group.maxWidth) {
    p = p.resize(group.maxWidth, undefined, { fit: "inside", withoutEnlargement: true });
  }
  const buf = group.lossless
    ? await p.webp({ lossless: true }).toBuffer()
    : await p.webp({ quality: group.quality }).toBuffer();
  return { buf, meta };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n=== ${APPLY ? "APPLY" : "DRY RUN"} — convert repository images to WebP ===\n`);

let totalOrig = 0, totalWebP = 0, written = 0, skipped = 0, bigger = 0;

for (const group of GROUPS) {
  const files = await collectFiles(group);
  if (!files.length) continue;
  console.log(`[${group.dir}]`);

  for (const entry of files) {
    const rel = path.relative(ROOT, entry.src);

    if (entry.exists) {
      const destStat = await fs.stat(entry.dest);
      console.log(`  skip  ${rel} — .webp already exists (${fmt(destStat.size)})`);
      skipped++;
      continue;
    }

    try {
      const { buf, meta } = await convert(entry, group);
      const saving = entry.origBytes - buf.byteLength;
      const pct = Math.round((saving / entry.origBytes) * 100);

      if (buf.byteLength >= entry.origBytes) {
        console.log(`  skip  ${rel} — WebP (${fmt(buf.byteLength)}) >= original (${fmt(entry.origBytes)})`);
        bigger++;
        continue;
      }

      console.log(
        `  ${APPLY ? "write" : "would"} ${rel}  ${meta.width}×${meta.height}  ${fmt(entry.origBytes)} → ${fmt(buf.byteLength)} (-${pct}%)`
      );

      if (APPLY) {
        await fs.writeFile(entry.dest, buf);
        written++;
      }

      totalOrig += entry.origBytes;
      totalWebP += buf.byteLength;
    } catch (err) {
      console.error(`  error ${rel}: ${err.message}`);
    }
  }
}

const saved = totalOrig - totalWebP;
const savePct = totalOrig > 0 ? Math.round((saved / totalOrig) * 100) : 0;

console.log(`\n─────────────────────────────────────────`);
if (APPLY) {
  console.log(`Written : ${written}  |  Skipped : ${skipped}  |  Larger (kept original) : ${bigger}`);
} else {
  console.log(`Would convert : ${written + (totalOrig > 0 ? 1 : 0) - 1}  |  Already done : ${skipped}  |  Larger (would skip) : ${bigger}`);
  console.log(`\nRun  npm run images:apply  to write the files.`);
}
console.log(`Estimated saving : ${fmt(saved)} (${savePct}%)\n`);
