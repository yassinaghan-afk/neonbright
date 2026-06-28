#!/usr/bin/env node
/**
 * Syncs MEDIA/hero-slider → public/media/hero-slider and updates CMS.
 * Usage: node scripts/seed-hero-from-media.mjs [--force]
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const force = process.argv.includes("--force");

const MEDIA_DIRS = ["MEDIA/hero-slider", "MEDIA/hero slider"];
const PUBLIC_DIR = path.join(root, "public/media/hero-slider");
const CMS_FILE = path.join(root, "data/cms-content.json");
const IMAGE_EXT = /\.(webp|jpe?g|png)$/i;

const ALT_LABELS = [
  "Enseigne néon LED sur mesure — vitrine commerciale illuminée",
  "Néon LED personnalisé — enseigne lumineuse restaurant",
  "Enseigne lumineuse LED — façade hôtel et hospitality",
  "Logo néon LED monté sur mur — installation sur mesure",
  "Enseigne néon script — commerce et retail",
  "Néon LED multicolore — enseigne lumineuse professionnelle",
  "Enseigne lumineuse sur mesure — néon LED intérieur",
  "Signalétique néon LED — enseigne de magasin",
  "Installation néon LED — enseigne lumineuse custom",
  "Enseigne néon LED — enseigne lumineuse Neon Bright",
  "Néon LED architectural — enseigne commerciale illuminée",
  "Enseigne lumineuse extérieure — néon LED sur mesure",
];

async function resolveMediaDir() {
  for (const dir of MEDIA_DIRS) {
    const full = path.join(root, dir);
    try {
      const resolved = await fs.realpath(full);
      await fs.access(resolved);
      return resolved;
    } catch {
      /* next */
    }
  }
  throw new Error(`No hero media folder found. Expected one of: ${MEDIA_DIRS.join(", ")}`);
}

function destNameForSource(file) {
  const ext = path.extname(file).toLowerCase();
  const stem = path.basename(file, path.extname(file));
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") return `${stem}.webp`;
  return file.toLowerCase();
}

function slideIdFromFile(file) {
  const stem = path.basename(file, path.extname(file)).toLowerCase();
  return `slide_brand_${stem.slice(0, 12)}`;
}

async function wipePublicHeroCache() {
  const existing = await fs.readdir(PUBLIC_DIR).catch(() => []);
  let removed = 0;
  for (const f of existing) {
    if (IMAGE_EXT.test(f) && !f.startsWith(".")) {
      await fs.unlink(path.join(PUBLIC_DIR, f)).catch(() => undefined);
      removed++;
    }
  }
  return removed;
}

async function publishHeroImage(sourcePath, file) {
  const ext = path.extname(file).toLowerCase();
  const destName = destNameForSource(file);
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
    const buffer = await sharp(sourcePath).rotate().webp({ quality: 85 }).toBuffer();
    await fs.writeFile(path.join(PUBLIC_DIR, destName), buffer);
    return destName;
  }
  await fs.copyFile(sourcePath, path.join(PUBLIC_DIR, destName));
  return destName;
}

async function main() {
  const sourceDir = await resolveMediaDir();
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  const entries = await fs.readdir(sourceDir);
  const files = entries
    .filter((f) => IMAGE_EXT.test(f) && !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  console.log(`Detected ${files.length} hero image(s) in ${path.relative(root, sourceDir)}/`);

  const removed = force ? await wipePublicHeroCache() : 0;
  if (removed) console.log(`Removed ${removed} cached file(s) from public/media/hero-slider/`);

  const slides = [];
  const published = new Set();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(sourceDir, file);
    const destName = await publishHeroImage(srcPath, file);
    published.add(destName);

    const meta = await sharp(path.join(PUBLIC_DIR, destName)).metadata();

    slides.push({
      id: slideIdFromFile(destName),
      src: `/media/hero-slider/${destName}`,
      alt: ALT_LABELS[i % ALT_LABELS.length],
      enabled: true,
      sortOrder: i,
    });

    console.log(`  ✓ ${destName} (${meta.width}×${meta.height})`);
  }

  // Remove orphans not in current MEDIA folder
  const existing = await fs.readdir(PUBLIC_DIR).catch(() => []);
  let orphans = 0;
  for (const f of existing) {
    if (IMAGE_EXT.test(f) && !published.has(f)) {
      await fs.unlink(path.join(PUBLIC_DIR, f)).catch(() => undefined);
      orphans++;
    }
  }
  if (orphans) console.log(`Removed ${orphans} orphaned cached file(s).`);

  const mediaVersion = Date.now().toString(36);

  let cms = {};
  try {
    cms = JSON.parse(await fs.readFile(CMS_FILE, "utf-8"));
  } catch {
    cms = {};
  }

  cms.heroSlides = slides;
  cms.heroMediaVersion = mediaVersion;
  cms.hero = {
    ...(cms.hero ?? {}),
    backgroundImage: slides[0]?.src ?? "",
  };
  cms.updatedAt = new Date().toISOString();
  await fs.writeFile(CMS_FILE, JSON.stringify(cms, null, 2));

  console.log(`Updated CMS with ${slides.length} hero slide(s). mediaVersion=${mediaVersion}`);
  console.log("\nOrder:");
  slides.forEach((s, i) => console.log(`  ${i + 1}. ${path.basename(s.src)}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
