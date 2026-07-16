/**
 * convert-vps-uploads-to-webp.mjs
 *
 * Production-safe WebP migration for /app/storage/uploads.
 * Run INSIDE the EasyPanel container where STORAGE_ROOT is mounted.
 *
 * Usage:
 *   npm run images:vps:dry      — report what would change (default)
 *   npm run images:vps:apply    — convert files and update CMS URLs
 *
 * Safety:
 *   - Never deletes originals.
 *   - Creates a timestamped CMS backup before any CMS write.
 *   - Writes CMS atomically (temp-file + rename).
 *   - Rolls back on any conversion failure.
 *   - Idempotent: skips files already converted.
 *   - Validates path traversal.
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv[2] === "apply";

// ─── Storage paths ────────────────────────────────────────────────────────────

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? path.resolve(process.env.STORAGE_ROOT)
  : path.resolve(ROOT, "storage");

const CMS_PATH = path.join(STORAGE_ROOT, "cms-content.json");
const UPLOADS_ROOT = path.join(STORAGE_ROOT, "uploads");

const VALID_CATEGORIES = new Set([
  "hero", "events", "brands", "reviews", "testimonials",
  "logos", "instagram", "cms",
]);

// ─── Per-category WebP settings ───────────────────────────────────────────────

const CATEGORY_CFG = {
  hero:         { maxW: 1920, q: 80, mobileMaxW: 1080, mobileQ: 80 },
  events:       { maxW: 1600, q: 78, thumbMaxW: 640, thumbQ: 74 },
  brands:       { maxW: 1600, q: 78, thumbMaxW: 640, thumbQ: 74 },
  reviews:      { maxW: 1200, q: 88, thumbMaxW: 560, thumbQ: 80 },
  instagram:    { maxW: 1440, q: 82, thumbMaxW: 560, thumbQ: 75 },
  testimonials: { maxW: 400,  q: 82 },
  logos:        { maxW: 800,  q: 90, lossless: true },
  cms:          { maxW: 1920, q: 82 },
};

// ─── CMS image fields to migrate ─────────────────────────────────────────────

const CMS_FIELDS = [
  { section: "heroSlides",      urlField: "src",     thumbField: null,          mobileField: "mobileImageUrl", desktopField: "desktopImageUrl" },
  { section: "partners",        urlField: "logoUrl",  thumbField: null },
  { section: "brandsPageLogos", urlField: "logoUrl",  thumbField: null },
  { section: "instagramPosts",  urlField: "image",    thumbField: "thumbnailUrl" },
  { section: "reviews",         urlField: "image",    thumbField: "thumbnailUrl" },
  { section: "testimonials",    urlField: "photo",    thumbField: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(bytes) {
  if (!bytes) return "0 B";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

function needsConversion(filename) {
  return /\.(jpg|jpeg|png)$/i.test(filename);
}

function webpName(filename) {
  return filename.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

function parseUploadUrl(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return null;
  const parts = decodeURIComponent(url).replace("/uploads/", "").split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [cat, raw] = parts;
  if (!VALID_CATEGORIES.has(cat)) return null;
  if (/[.]{2}|[/\\]/.test(raw) || !/^[A-Za-z0-9._%-]+$/.test(raw)) return null;
  return { category: cat, filename: raw };
}

function safePath(category, filename) {
  const abs = path.resolve(UPLOADS_ROOT, category, filename);
  return abs.startsWith(UPLOADS_ROOT + path.sep) ? abs : null;
}

// ─── CMS loading ─────────────────────────────────────────────────────────────

async function loadCMS() {
  return JSON.parse(await fs.readFile(CMS_PATH, "utf8"));
}

function collectCandidates(cms) {
  const out = [];
  for (const field of CMS_FIELDS) {
    const items = cms[field.section];
    if (!Array.isArray(items)) continue;
    for (let i = 0; i < items.length; i++) {
      const val = items[i][field.urlField];
      if (!val) continue;
      const parsed = parseUploadUrl(val);
      if (!parsed || !needsConversion(parsed.filename)) continue;
      out.push({ ...field, index: i, url: val, ...parsed });
    }
  }
  return out;
}

// ─── Conversion ───────────────────────────────────────────────────────────────

async function convertFile(absPath, category) {
  const cfg = CATEGORY_CFG[category] ?? CATEGORY_CFG.cms;
  const meta = await sharp(absPath).metadata();
  const w = meta.width ?? 0;

  function pipe(src, maxW) {
    let p = sharp(src).rotate();
    if (maxW > 0 && w > maxW) p = p.resize(maxW, undefined, { fit: "inside", withoutEnlargement: true });
    return p;
  }

  const mainBuf = cfg.lossless
    ? await pipe(absPath, cfg.maxW).webp({ lossless: true }).toBuffer()
    : await pipe(absPath, cfg.maxW).webp({ quality: cfg.q }).toBuffer();

  let thumbBuf = null;
  if (cfg.thumbMaxW) {
    thumbBuf = await pipe(absPath, cfg.thumbMaxW).webp({ quality: cfg.thumbQ }).toBuffer();
  }

  let mobileBuf = null;
  if (cfg.mobileMaxW) {
    mobileBuf = await pipe(absPath, cfg.mobileMaxW).webp({ quality: cfg.mobileQ }).toBuffer();
  }

  return { mainBuf, thumbBuf, mobileBuf, meta };
}

// ─── Atomic CMS write ────────────────────────────────────────────────────────

async function backupAndWrite(newCms) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = CMS_PATH.replace("cms-content.json", `cms-content.backup-${ts}.json`);
  await fs.copyFile(CMS_PATH, backup);
  console.log(`  CMS backup → ${path.basename(backup)}`);
  const tmp = CMS_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(newCms, null, 2));
  await fs.rename(tmp, CMS_PATH);
}

// ─── Dry run ─────────────────────────────────────────────────────────────────

async function runDry() {
  console.log(`\n=== DRY RUN — VPS upload migration ===`);
  console.log(`STORAGE_ROOT : ${STORAGE_ROOT}\n`);

  let cms;
  try { cms = await loadCMS(); } catch (e) { console.error(`Cannot read CMS: ${e.message}`); process.exit(1); }

  const candidates = collectCandidates(cms);
  if (!candidates.length) { console.log("No eligible images found.\n"); return; }

  let totalOrig = 0, totalEst = 0;

  for (const c of candidates) {
    const abs = safePath(c.category, c.filename);
    if (!abs) { console.warn(`  skip ${c.url} — path traversal`); continue; }
    let sz = 0;
    try { sz = (await fs.stat(abs)).size; } catch { console.warn(`  skip ${c.url} — not found`); continue; }

    const newName = webpName(c.filename);
    const newUrl = `/uploads/${c.category}/${encodeURIComponent(newName)}`;
    let alreadyDone = false;
    const newAbs = safePath(c.category, newName);
    try { await fs.access(newAbs); alreadyDone = true; } catch { /**/ }

    let estSize = sz;
    try { const { mainBuf } = await convertFile(abs, c.category); estSize = mainBuf.byteLength; } catch { /**/ }

    const pct = sz > 0 ? Math.round(((sz - estSize) / sz) * 100) : 0;
    console.log(`  ${c.section}[${c.index}].${c.urlField}`);
    console.log(`    ${c.url}  →  ${newUrl}`);
    console.log(`    ${fmt(sz)} → ${fmt(estSize)} (${pct > 0 ? "-" : "+"}${Math.abs(pct)}%)${alreadyDone ? "  [already done]" : ""}`);

    totalOrig += sz; totalEst += estSize;
  }

  const saved = totalOrig - totalEst;
  const p = totalOrig > 0 ? Math.round((saved / totalOrig) * 100) : 0;
  console.log(`\nCandidates: ${candidates.length}  |  Est. saving: ${fmt(saved)} (${p}%)`);
  console.log(`\nRun  npm run images:vps:apply  to apply.\n`);
}

// ─── Apply ────────────────────────────────────────────────────────────────────

async function runApply() {
  console.log(`\n=== APPLY — VPS upload migration ===`);
  console.log(`STORAGE_ROOT : ${STORAGE_ROOT}\n`);

  let cms;
  try { cms = await loadCMS(); } catch (e) { console.error(`Cannot read CMS: ${e.message}`); process.exit(1); }

  const candidates = collectCandidates(cms);
  if (!candidates.length) { console.log("No eligible images found.\n"); return; }

  const conversions = [];

  for (const c of candidates) {
    const abs = safePath(c.category, c.filename);
    if (!abs) { console.error(`ERROR path traversal: ${c.url}`); process.exit(1); }
    let origSize = 0;
    try { origSize = (await fs.stat(abs)).size; } catch { console.error(`ERROR not found: ${c.url}`); process.exit(1); }

    const newName = webpName(c.filename);
    const newAbs = safePath(c.category, newName);
    const newUrl = `/uploads/${c.category}/${encodeURIComponent(newName)}`;

    let done = false;
    try { await fs.access(newAbs); done = true; } catch { /**/ }

    if (done) {
      console.log(`  skip  ${newName} — exists`);
      conversions.push({ ...c, newUrl, newName, newAbs, origSize, thumbUrl: null, mobileUrl: null });
      continue;
    }

    console.log(`  conv  ${c.filename} → ${newName}`);
    let result;
    try {
      result = await convertFile(abs, c.category);
      // Verify output is decodable.
      const check = await sharp(result.mainBuf).metadata();
      if (check.format !== "webp") throw new Error("output not webp");
    } catch (e) {
      console.error(`  FAIL  ${c.filename}: ${e.message}`);
      console.error("  Aborting — CMS not modified.\n");
      process.exit(1);
    }

    await fs.writeFile(newAbs, result.mainBuf);
    console.log(`         ${fmt(origSize)} → ${fmt(result.mainBuf.byteLength)}`);

    let thumbUrl = null;
    if (result.thumbBuf && c.thumbField) {
      const thumbName = `thumb_${newName}`;
      const thumbAbs = safePath(c.category, thumbName);
      if (thumbAbs) {
        await fs.writeFile(thumbAbs, result.thumbBuf);
        thumbUrl = `/uploads/${c.category}/${encodeURIComponent(thumbName)}`;
        console.log(`         thumb ${fmt(result.thumbBuf.byteLength)} → ${thumbUrl}`);
      }
    }

    let mobileUrl = null;
    if (result.mobileBuf && c.mobileField) {
      const mobName = `mobile_${newName}`;
      const mobAbs = safePath(c.category, mobName);
      if (mobAbs) {
        await fs.writeFile(mobAbs, result.mobileBuf);
        mobileUrl = `/uploads/${c.category}/${encodeURIComponent(mobName)}`;
        console.log(`         mobile ${fmt(result.mobileBuf.byteLength)} → ${mobileUrl}`);
      }
    }

    conversions.push({ ...c, newUrl, newName, newAbs, origSize, webpSize: result.mainBuf.byteLength, thumbUrl, mobileUrl });
  }

  // Update CMS in memory.
  const updated = JSON.parse(JSON.stringify(cms));
  for (const conv of conversions) {
    const item = updated[conv.section]?.[conv.index];
    if (!item) continue;
    item[conv.urlField] = conv.newUrl;
    if (conv.thumbField && conv.thumbUrl) item[conv.thumbField] = conv.thumbUrl;
    if (conv.mobileField && conv.mobileUrl) item[conv.mobileField] = conv.mobileUrl;
    if (conv.desktopField && conv.newUrl) item[conv.desktopField] = conv.newUrl;
  }
  updated.updatedAt = new Date().toISOString();
  if (typeof updated.revision === "number") updated.revision++;

  try {
    await backupAndWrite(updated);
    console.log("  CMS updated.\n");
  } catch (e) {
    console.error(`FATAL CMS write failed: ${e.message}`);
    process.exit(1);
  }

  const totalOrig = conversions.reduce((s, c) => s + (c.origSize ?? 0), 0);
  const totalWebP = conversions.reduce((s, c) => s + (c.webpSize ?? c.origSize ?? 0), 0);
  const saved = totalOrig - totalWebP;
  const p = totalOrig > 0 ? Math.round((saved / totalOrig) * 100) : 0;
  console.log(`Done. converted=${conversions.length}  saving=${fmt(saved)} (${p}%)\n`);
}

// ─── Entry ────────────────────────────────────────────────────────────────────

if (APPLY) { await runApply(); } else { await runDry(); }
