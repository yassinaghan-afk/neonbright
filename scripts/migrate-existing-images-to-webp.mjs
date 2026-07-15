/**
 * migrate-existing-images-to-webp.mjs
 *
 * Production-safe migration of VPS-uploaded images to WebP.
 * Must be executed INSIDE the EasyPanel container where /app/storage is mounted.
 *
 * Default: DRY RUN — nothing is written.
 *
 * Usage (inside EasyPanel shell):
 *   node scripts/migrate-existing-images-to-webp.mjs            # dry run
 *   node scripts/migrate-existing-images-to-webp.mjs apply      # convert + update CMS
 *   node scripts/migrate-existing-images-to-webp.mjs verify     # check generated files
 *
 * Or via npm scripts (from host machine against local storage for testing):
 *   npm run images:uploads:dry
 *   npm run images:uploads:apply
 *   npm run images:uploads:verify
 *
 * Safety guarantees:
 *   - Never deletes originals
 *   - Creates timestamped CMS backup before writing
 *   - Rolls back CMS if any conversion fails
 *   - Idempotent: skips already-converted files
 *   - Prevents path traversal
 *   - Writes CMS atomically (temp file + rename)
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MODE = process.argv[2] ?? "dry"; // "dry" | "apply" | "verify"
const APPLY = MODE === "apply";
const VERIFY = MODE === "verify";

// ─────────────────────────────────────────────────────────────────────────────
// Storage layout (matches lib/cms/storage-paths.ts)
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? path.resolve(process.env.STORAGE_ROOT)
  : path.resolve(ROOT, "storage");

const CMS_PATH = path.join(STORAGE_ROOT, "cms-content.json");
const UPLOADS_ROOT = path.join(STORAGE_ROOT, "uploads");

const VALID_CATEGORIES = new Set([
  "hero", "events", "brands", "reviews", "testimonials", "logos", "instagram", "cms",
]);

// Per-category WebP settings (mirror lib/cms/image-process.ts).
const CATEGORY_CONFIG = {
  hero:         { maxWidth: 1920, quality: 82 },
  events:       { maxWidth: 1600, quality: 80, thumbMaxWidth: 640, thumbQuality: 75 },
  brands:       { maxWidth: 1600, quality: 80, thumbMaxWidth: 640, thumbQuality: 75 },
  reviews:      { maxWidth: 1200, quality: 88, thumbMaxWidth: 400, thumbQuality: 80 },
  instagram:    { maxWidth: 1200, quality: 82, thumbMaxWidth: 400, thumbQuality: 75 },
  testimonials: { maxWidth: 400,  quality: 82 },
  logos:        { maxWidth: 800,  quality: 90, lossless: true },
  cms:          { maxWidth: 1920, quality: 82 },
};

// ─────────────────────────────────────────────────────────────────────────────
// CMS image fields to migrate.
// Add entries here if new sections with image URLs are introduced.
// ─────────────────────────────────────────────────────────────────────────────
const CMS_IMAGE_FIELDS = [
  // { section, itemKey, urlField, thumbField? }
  { section: "heroSlides",       urlField: "src" },
  { section: "partners",         urlField: "logoUrl" },
  { section: "brandsPageLogos",  urlField: "logoUrl" },
  { section: "instagramPosts",   urlField: "image", thumbField: "thumbnailUrl" },
  { section: "reviews",          urlField: "image", thumbField: "thumbnailUrl" },
  { section: "testimonials",     urlField: "photo" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if url is a local /uploads/category/file.ext path. */
function isLocalUploadUrl(url) {
  return typeof url === "string" && url.startsWith("/uploads/");
}

/** Returns true if url is a remote HTTPS URL. */
function isRemoteUrl(url) {
  return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
}

/** Parse /uploads/category/filename → { category, filename } or null. */
function parseUploadUrl(url) {
  if (!isLocalUploadUrl(url)) return null;
  const parts = decodeURIComponent(url).replace("/uploads/", "").split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [category, filename] = parts;
  if (!VALID_CATEGORIES.has(category)) return null;
  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) return null;
  if (!/^[A-Za-z0-9._%-]+$/.test(filename)) return null;
  return { category, filename };
}

/** Resolve safe absolute path within UPLOADS_ROOT. */
function safeAbsPath(category, filename) {
  const abs = path.resolve(UPLOADS_ROOT, category, filename);
  if (!abs.startsWith(UPLOADS_ROOT + path.sep)) return null;
  return abs;
}

/** Determine if a file needs conversion (is raster non-WebP). */
function needsConversion(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png"].includes(ext);
}

function webpFilename(filename) {
  return filename.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

function thumbFilename(mainWebp) {
  return "thumb_" + mainWebp;
}

function fmt(bytes) {
  if (!bytes) return "0 B";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect migration candidates from CMS
// ─────────────────────────────────────────────────────────────────────────────

async function loadCMS() {
  try {
    return JSON.parse(await fs.readFile(CMS_PATH, "utf8"));
  } catch (e) {
    throw new Error(`Cannot read CMS at ${CMS_PATH}: ${e.message}`);
  }
}

/**
 * Returns an array of candidates:
 * { section, index, urlField, thumbField, url, category, filename }
 */
function collectCandidates(cms) {
  const candidates = [];

  for (const { section, urlField, thumbField } of CMS_IMAGE_FIELDS) {
    const items = cms[section];
    if (!Array.isArray(items)) continue;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const url = item[urlField];
      if (!url || !isLocalUploadUrl(url)) continue;
      if (isRemoteUrl(url)) continue;

      const parsed = parseUploadUrl(url);
      if (!parsed) continue;
      if (!needsConversion(parsed.filename)) continue;

      candidates.push({
        section,
        index: i,
        urlField,
        thumbField: thumbField ?? null,
        url,
        category: parsed.category,
        filename: parsed.filename,
      });
    }
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert one file
// ─────────────────────────────────────────────────────────────────────────────

async function convertFile(absPath, category) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.cms;
  const meta = await sharp(absPath).metadata();
  const origWidth = meta.width ?? 0;

  function buildPipeline(src, maxW) {
    let p = sharp(src).rotate();
    if (maxW > 0 && origWidth > maxW) {
      p = p.resize(maxW, undefined, { fit: "inside", withoutEnlargement: true });
    }
    return p;
  }

  const mainBuf = cfg.lossless
    ? await buildPipeline(absPath, cfg.maxWidth).webp({ lossless: true }).toBuffer()
    : await buildPipeline(absPath, cfg.maxWidth).webp({ quality: cfg.quality }).toBuffer();

  let thumbBuf = null;
  if (cfg.thumbMaxWidth) {
    thumbBuf = await buildPipeline(absPath, cfg.thumbMaxWidth)
      .webp({ quality: cfg.thumbQuality })
      .toBuffer();
  }

  return { mainBuf, thumbBuf, meta };
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify a decoded WebP
// ─────────────────────────────────────────────────────────────────────────────

async function verifyWebp(absPath) {
  const m = await sharp(absPath).metadata();
  if (m.format !== "webp") throw new Error(`not webp: format=${m.format}`);
  if (!m.width || !m.height) throw new Error("missing dimensions");
}

// ─────────────────────────────────────────────────────────────────────────────
// Atomic CMS write
// ─────────────────────────────────────────────────────────────────────────────

async function backupAndWriteCMS(newContent) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = CMS_PATH.replace("cms-content.json", `cms-content.backup-${ts}.json`);

  // Backup original
  await fs.copyFile(CMS_PATH, backupPath);
  console.log(`  CMS backup: ${backupPath}`);

  // Atomic write
  const tmpPath = CMS_PATH + ".tmp";
  await fs.writeFile(tmpPath, JSON.stringify(newContent, null, 2));
  await fs.rename(tmpPath, CMS_PATH);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dry run
// ─────────────────────────────────────────────────────────────────────────────

async function runDry() {
  console.log("\n=== DRY RUN — nothing will be written ===\n");
  console.log(`STORAGE_ROOT : ${STORAGE_ROOT}`);
  console.log(`CMS          : ${CMS_PATH}\n`);

  const cms = await loadCMS();
  const candidates = collectCandidates(cms);

  if (candidates.length === 0) {
    console.log("No eligible images found. All CMS image URLs are already WebP or remote.");
    return;
  }

  const report = [];
  let totalOrig = 0;
  let totalEstWebp = 0;

  for (const c of candidates) {
    const absPath = safeAbsPath(c.category, c.filename);
    if (!absPath) {
      console.warn(`  SKIP  ${c.url} — path traversal rejected`);
      continue;
    }

    let origSize = 0;
    try {
      origSize = (await fs.stat(absPath)).size;
    } catch {
      console.warn(`  SKIP  ${c.url} — file not found at ${absPath}`);
      continue;
    }

    const newFilename = webpFilename(c.filename);
    const newAbsPath = safeAbsPath(c.category, newFilename);
    const newUrl = `/uploads/${c.category}/${encodeURIComponent(newFilename)}`;

    let alreadyDone = false;
    try { await fs.access(newAbsPath); alreadyDone = true; } catch { /* ok */ }

    // Estimate conversion
    let estWebpSize = origSize;
    let width = "?", height = "?";
    try {
      const { mainBuf, meta } = await convertFile(absPath, c.category);
      estWebpSize = mainBuf.byteLength;
      width = meta.width;
      height = meta.height;
    } catch (e) {
      console.warn(`  WARN  ${c.filename}: ${e.message}`);
    }

    const saving = origSize - estWebpSize;
    const pct = origSize > 0 ? Math.round((saving / origSize) * 100) : 0;

    console.log(`\n  ${c.section}[${c.index}].${c.urlField}`);
    console.log(`    src  : ${c.url}`);
    console.log(`    new  : ${newUrl}`);
    console.log(`    size : ${fmt(origSize)} → ${fmt(estWebpSize)} (${pct > 0 ? "-" : "+"}${Math.abs(pct)}%) ${width}×${height}`);
    if (alreadyDone) console.log(`    NOTE : WebP file already exists — would skip conversion`);

    totalOrig += origSize;
    totalEstWebp += estWebpSize;
    report.push({ ...c, origSize, estWebpSize, saving, pct, newUrl, alreadyDone });
  }

  console.log("\n────────────────────────────────────────────");
  console.log(`Candidates       : ${candidates.length}`);
  console.log(`Total original   : ${fmt(totalOrig)}`);
  console.log(`Est. WebP total  : ${fmt(totalEstWebp)}`);
  const s = totalOrig - totalEstWebp;
  const p = totalOrig > 0 ? Math.round((s / totalOrig) * 100) : 0;
  console.log(`Est. saving      : ${fmt(s)} (${p}%)`);
  console.log("\nRun with 'apply' to convert and update CMS.\n");

  // Save report
  const reportPath = path.join(__dirname, "migration-report.json");
  await fs.writeFile(reportPath, JSON.stringify({ mode: "dry", candidates: report }, null, 2));
  console.log(`Report saved: ${reportPath}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply
// ─────────────────────────────────────────────────────────────────────────────

async function runApply() {
  console.log("\n=== APPLY — converting images and updating CMS ===\n");
  console.log(`STORAGE_ROOT : ${STORAGE_ROOT}`);
  console.log(`CMS          : ${CMS_PATH}\n`);

  const cms = await loadCMS();
  const candidates = collectCandidates(cms);

  if (candidates.length === 0) {
    console.log("No eligible images found.");
    return;
  }

  // Phase 1: Convert all files first (before touching CMS)
  const conversions = [];
  let conversionFailed = false;

  for (const c of candidates) {
    const absPath = safeAbsPath(c.category, c.filename);
    if (!absPath) {
      console.error(`  ERROR ${c.url} — path traversal rejected`);
      conversionFailed = true;
      break;
    }

    try {
      await fs.access(absPath);
    } catch {
      console.error(`  ERROR ${c.url} — source not found at ${absPath}`);
      conversionFailed = true;
      break;
    }

    const origSize = (await fs.stat(absPath)).size;
    const newFilename = webpFilename(c.filename);
    const newAbsPath = safeAbsPath(c.category, newFilename);
    const newUrl = `/uploads/${c.category}/${encodeURIComponent(newFilename)}`;

    // Skip if already converted
    let alreadyDone = false;
    try { await fs.access(newAbsPath); alreadyDone = true; } catch { /* ok */ }

    if (alreadyDone) {
      console.log(`  SKIP  ${newFilename} — already exists`);
      conversions.push({ ...c, newAbsPath, newUrl, newFilename, origSize, webpSize: origSize, thumbAbsPath: null, thumbUrl: null });
      continue;
    }

    console.log(`  CONV  ${c.filename} → ${newFilename}`);

    try {
      const { mainBuf, thumbBuf, meta } = await convertFile(absPath, c.category);

      // Verify decode before writing
      const testMeta = await sharp(mainBuf).metadata();
      if (testMeta.format !== "webp") throw new Error("Output is not WebP");

      await fs.writeFile(newAbsPath, mainBuf);
      console.log(`        ${fmt(origSize)} → ${fmt(mainBuf.byteLength)}  ${meta.width}×${meta.height}`);

      let thumbAbsPath = null;
      let thumbUrl = null;
      if (thumbBuf && c.thumbField) {
        const tFilename = thumbFilename(newFilename);
        thumbAbsPath = safeAbsPath(c.category, tFilename);
        if (thumbAbsPath) {
          await fs.writeFile(thumbAbsPath, thumbBuf);
          thumbUrl = `/uploads/${c.category}/${encodeURIComponent(tFilename)}`;
          console.log(`        thumb  ${fmt(thumbBuf.byteLength)}  → ${thumbUrl}`);
        }
      }

      conversions.push({
        ...c, newAbsPath, newUrl, newFilename, origSize,
        webpSize: mainBuf.byteLength, thumbAbsPath, thumbUrl,
      });
    } catch (err) {
      console.error(`  ERROR converting ${c.filename}: ${err.message}`);
      conversionFailed = true;
      break;
    }
  }

  if (conversionFailed) {
    console.error("\nConversion failed. CMS will NOT be updated. Originals are intact.\n");
    process.exit(1);
  }

  // Phase 2: Update CMS (mutate in memory, then atomic write)
  console.log("\n  Updating CMS...");
  const updated = JSON.parse(JSON.stringify(cms)); // deep clone

  for (const conv of conversions) {
    const items = updated[conv.section];
    if (!Array.isArray(items) || !items[conv.index]) continue;

    items[conv.index][conv.urlField] = conv.newUrl;
    if (conv.thumbField && conv.thumbUrl) {
      items[conv.index][conv.thumbField] = conv.thumbUrl;
    }
  }

  updated.updatedAt = new Date().toISOString();
  if (typeof updated.revision === "number") updated.revision++;

  try {
    await backupAndWriteCMS(updated);
    console.log("  CMS updated successfully.\n");
  } catch (err) {
    console.error(`  FATAL: CMS write failed: ${err.message}`);
    console.error("  Original CMS is intact. WebP files were written but CMS not updated.");
    process.exit(1);
  }

  // Phase 3: Save report
  const totalOrig = conversions.reduce((s, c) => s + c.origSize, 0);
  const totalWebp = conversions.reduce((s, c) => s + c.webpSize, 0);
  const report = {
    mode: "apply",
    converted: conversions.length,
    totalOrigBytes: totalOrig,
    totalWebpBytes: totalWebp,
    savingBytes: totalOrig - totalWebp,
    savingPct: totalOrig > 0 ? Math.round(((totalOrig - totalWebp) / totalOrig) * 100) : 0,
    conversions,
  };
  const reportPath = path.join(__dirname, "migration-report.json");
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`Done. converted=${conversions.length}`);
  console.log(`Saving: ${fmt(report.savingBytes)} (${report.savingPct}%)`);
  console.log(`Report: ${reportPath}`);
  console.log("\nRun  npm run images:uploads:verify  to confirm all WebP files are valid.\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify
// ─────────────────────────────────────────────────────────────────────────────

async function runVerify() {
  console.log("\n=== VERIFY — checking generated WebP files ===\n");

  const reportPath = path.join(__dirname, "migration-report.json");
  let report;
  try {
    report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  } catch {
    console.error("Report not found. Run  npm run images:uploads:apply  first.");
    process.exit(1);
  }

  if (report.mode !== "apply") {
    console.error("Report is from a dry run. Run apply first.");
    process.exit(1);
  }

  let passed = 0, failed = 0;

  for (const conv of report.conversions ?? []) {
    if (!conv.newAbsPath) continue;
    try {
      await verifyWebp(conv.newAbsPath);
      console.log(`  OK    ${conv.newFilename}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL  ${conv.newFilename}: ${err.message}`);
      failed++;
    }

    if (conv.thumbAbsPath) {
      try {
        await verifyWebp(conv.thumbAbsPath);
        console.log(`  OK    thumb_${conv.newFilename}`);
        passed++;
      } catch (err) {
        console.error(`  FAIL  thumb_${conv.newFilename}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\nVerify done. passed=${passed} failed=${failed}\n`);
  if (failed > 0) process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────

if (APPLY) {
  await runApply();
} else if (VERIFY) {
  await runVerify();
} else {
  await runDry();
}
