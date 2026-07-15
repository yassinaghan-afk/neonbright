/**
 * optimize-static-images.mjs
 *
 * Converts eligible static repository images (JPG/PNG) to WebP.
 * Generates WebP files beside the originals — never overwrites them.
 * Writes a manifest at scripts/static-images-manifest.json.
 *
 * Usage:
 *   npm run images:static:dry      (default — no files written)
 *   npm run images:static:apply    (write WebP files)
 *   npm run images:static:verify   (check generated WebP files are decodable)
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(__dirname, "static-images-manifest.json");

const MODE = process.argv[2] ?? "dry"; // "dry" | "apply" | "verify"
const DRY = MODE !== "apply" && MODE !== "verify";

// ─────────────────────────────────────────────────────────────────────────────
// Per-group conversion settings.
// ─────────────────────────────────────────────────────────────────────────────
const GROUPS = [
  {
    name: "hero-slider",
    glob: "public/media/hero-slider",
    exts: ["jpg", "jpeg"],
    // Hero images are used as full-screen backgrounds (portrait on mobile).
    // Real dimensions: 720–1188 × 1080–1280 px — keep at native size, 82 quality.
    maxWidth: 1920,
    quality: 82,
    lossless: false,
    note: "Hero slideshow backgrounds — high quality",
  },
  {
    name: "partner-logos",
    glob: "public/media/logo",
    exts: ["jpg", "jpeg", "png"],
    // Partner logos: modest dimensions, no alpha on JPEGs.
    maxWidth: 400,
    quality: 85,
    lossless: false,
    note: "Partner logo strip — small, no alpha",
  },
  {
    name: "brand-logos",
    glob: "public/brand",
    exts: ["png"],
    // Brand PNG logos have alpha (logos on dark background).
    // Use near-lossless to preserve edges.
    maxWidth: 900,
    quality: 90,
    lossless: true,
    note: "Brand logos — alpha transparency, lossless WebP",
    skip: ["neon-bright-og.png"], // OG image has no alpha; keep PNG for broad compat
  },
  {
    name: "cms-uploads",
    glob: "public/uploads/cms",
    exts: ["png"],
    // Uploaded CMS images — preserve quality, check alpha.
    maxWidth: 1200,
    quality: 85,
    lossless: false,
    note: "Admin-uploaded CMS images",
    minSize: 1024, // skip tiny/broken files (< 1 KB)
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function webpSiblingPath(src) {
  return src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

async function collectFiles(group) {
  const dir = path.join(ROOT, group.glob);
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const results = [];
  for (const name of entries) {
    if (name.startsWith(".")) continue;
    if (group.skip?.includes(name)) continue;

    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (!group.exts.includes(ext)) continue;

    const src = path.join(dir, name);
    const stat = await fs.stat(src);
    if (!stat.isFile()) continue;
    if (group.minSize && stat.size < group.minSize) continue;

    // Skip already-converted WebP sibling already exists
    const dest = webpSiblingPath(src);
    let exists = false;
    try { await fs.access(dest); exists = true; } catch { /* ok */ }

    results.push({ src, dest, size: stat.size, alreadyDone: exists });
  }
  return results;
}

async function convertOne(entry, group) {
  const meta = await sharp(entry.src).metadata();

  const pipeline =
    meta.width && group.maxWidth > 0 && meta.width > group.maxWidth
      ? sharp(entry.src).rotate().resize(group.maxWidth, undefined, {
          fit: "inside",
          withoutEnlargement: true,
        })
      : sharp(entry.src).rotate();

  const webpBuf = group.lossless
    ? await pipeline.webp({ lossless: true }).toBuffer()
    : await pipeline.webp({ quality: group.quality }).toBuffer();

  return { buffer: webpBuf, meta };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dry-run report
// ─────────────────────────────────────────────────────────────────────────────
async function runDry() {
  console.log("\n=== DRY RUN — no files will be written ===\n");

  const manifest = [];
  let totalOrigBytes = 0;
  let totalEstWebpBytes = 0;

  for (const group of GROUPS) {
    const files = await collectFiles(group);
    if (files.length === 0) {
      console.log(`[${group.name}] — no eligible files found (${group.glob})`);
      continue;
    }

    console.log(`\n[${group.name}] — ${group.glob} (${group.note})`);
    for (const entry of files) {
      if (entry.alreadyDone) {
        const destStat = await fs.stat(entry.dest);
        console.log(
          `  SKIP  ${path.relative(ROOT, entry.src)} — WebP already exists (${fmt(destStat.size)})`
        );
        continue;
      }

      try {
        const { buffer, meta } = await convertOne(entry, group);
        const saving = entry.size - buffer.byteLength;
        const pct = Math.round((saving / entry.size) * 100);
        console.log(
          `  WOULD ${path.relative(ROOT, entry.src)}  →  ${path.relative(ROOT, entry.dest)}`
        );
        console.log(
          `         ${meta.width}×${meta.height}  |  ${fmt(entry.size)} → ${fmt(buffer.byteLength)}  (${pct > 0 ? "-" : "+"}${Math.abs(pct)}%)`
        );
        totalOrigBytes += entry.size;
        totalEstWebpBytes += buffer.byteLength;

        manifest.push({
          src: path.relative(ROOT, entry.src),
          dest: path.relative(ROOT, entry.dest),
          origBytes: entry.size,
          webpBytes: buffer.byteLength,
          savingPct: pct,
          width: meta.width,
          height: meta.height,
          group: group.name,
        });
      } catch (err) {
        console.error(`  ERROR ${path.basename(entry.src)}: ${err.message}`);
      }
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`TOTAL originals : ${fmt(totalOrigBytes)}`);
  console.log(`TOTAL estimated WebP : ${fmt(totalEstWebpBytes)}`);
  const saved = totalOrigBytes - totalEstWebpBytes;
  const pct = totalOrigBytes > 0 ? Math.round((saved / totalOrigBytes) * 100) : 0;
  console.log(`ESTIMATED SAVING : ${fmt(saved)} (${pct}%)`);
  console.log("\nRun  npm run images:static:apply  to write WebP files.\n");

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Manifest saved: ${path.relative(ROOT, MANIFEST_PATH)}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply
// ─────────────────────────────────────────────────────────────────────────────
async function runApply() {
  console.log("\n=== APPLY — writing WebP files ===\n");

  const manifest = [];
  let written = 0;
  let skipped = 0;
  let errors = 0;

  for (const group of GROUPS) {
    const files = await collectFiles(group);
    for (const entry of files) {
      if (entry.alreadyDone) {
        console.log(`  SKIP  ${path.relative(ROOT, entry.dest)} — already exists`);
        skipped++;
        continue;
      }

      try {
        const { buffer, meta } = await convertOne(entry, group);
        await fs.writeFile(entry.dest, buffer);

        const pct = Math.round(((entry.size - buffer.byteLength) / entry.size) * 100);
        console.log(
          `  WROTE ${path.relative(ROOT, entry.dest)}  ${fmt(entry.size)} → ${fmt(buffer.byteLength)} (${pct > 0 ? "-" : "+"}${Math.abs(pct)}%)`
        );
        written++;

        manifest.push({
          src: path.relative(ROOT, entry.src),
          dest: path.relative(ROOT, entry.dest),
          origBytes: entry.size,
          webpBytes: buffer.byteLength,
          savingPct: pct,
          width: meta.width,
          height: meta.height,
          group: group.name,
        });
      } catch (err) {
        console.error(`  ERROR ${path.basename(entry.src)}: ${err.message}`);
        errors++;
      }
    }
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(
    `\nDone. written=${written} skipped=${skipped} errors=${errors}`
  );
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
  console.log("\nNext: update code references to use the .webp paths,");
  console.log("then run  npm run images:static:verify\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify
// ─────────────────────────────────────────────────────────────────────────────
async function runVerify() {
  console.log("\n=== VERIFY — checking generated WebP files ===\n");

  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  } catch {
    console.error("Manifest not found. Run  npm run images:static:apply  first.");
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const entry of manifest) {
    const dest = path.join(ROOT, entry.dest);
    try {
      const meta = await sharp(dest).metadata();
      if (meta.format !== "webp") throw new Error(`format=${meta.format}`);
      if (!meta.width || !meta.height) throw new Error("missing dimensions");
      console.log(
        `  OK    ${entry.dest}  ${meta.width}×${meta.height}  ${fmt(entry.webpBytes)}`
      );
      passed++;
    } catch (err) {
      console.error(`  FAIL  ${entry.dest}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nVerify done. passed=${passed} failed=${failed}\n`);
  if (failed > 0) process.exit(1);
}

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────
if (MODE === "apply") {
  await runApply();
} else if (MODE === "verify") {
  await runVerify();
} else {
  await runDry();
}
