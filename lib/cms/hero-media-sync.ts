import { promises as fs } from "fs";
import path from "path";
import type { CMSHeroSlide } from "@/lib/cms/types";
import {
  isHeroMediaSyncEnabled,
  type HeroMediaSyncResult,
} from "@/lib/cms/hero-media";

const MEDIA_DIRS = ["MEDIA/hero-slider", "MEDIA/hero slider"];
const PUBLIC_DIR = "public/media/hero-slider";
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

async function resolveMediaDir(root: string): Promise<string | null> {
  for (const dir of MEDIA_DIRS) {
    const full = path.join(root, dir);
    try {
      const stat = await fs.lstat(full);
      if (stat.isDirectory() || stat.isSymbolicLink()) {
        const resolved = await fs.realpath(full);
        const resolvedStat = await fs.stat(resolved);
        if (resolvedStat.isDirectory()) return resolved;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

function slideIdFromFile(file: string): string {
  const stem = path.basename(file, path.extname(file)).toLowerCase();
  return `slide_brand_${stem.slice(0, 12)}`;
}

function destNameForSource(file: string): string {
  return file.toLowerCase();
}

async function listSourceFiles(sourceDir: string): Promise<string[]> {
  const entries = await fs.readdir(sourceDir);
  return entries
    .filter((f) => IMAGE_EXT.test(f) && !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

async function publishHeroImage(
  sourcePath: string,
  pubDir: string,
  file: string
): Promise<string | null> {
  try {
    await fs.access(sourcePath);
  } catch {
    return null;
  }

  const destName = destNameForSource(file);
  await fs.copyFile(sourcePath, path.join(pubDir, destName));
  return destName;
}

export async function wipePublicHeroCache(): Promise<number> {
  const pubDir = path.join(process.cwd(), PUBLIC_DIR);
  let existing: string[] = [];
  try {
    existing = await fs.readdir(pubDir);
  } catch {
    return 0;
  }

  let removed = 0;
  await Promise.all(
    existing
      .filter((f) => IMAGE_EXT.test(f) && !f.startsWith("."))
      .map(async (f) => {
        await fs.unlink(path.join(pubDir, f)).catch(() => undefined);
        removed++;
      })
  );
  return removed;
}

async function purgeStalePublicFiles(pubDir: string, keepNames: Set<string>) {
  if (!keepNames.size) return;

  let existing: string[] = [];
  try {
    existing = await fs.readdir(pubDir);
  } catch {
    return;
  }
  await Promise.all(
    existing
      .filter((f) => IMAGE_EXT.test(f) && !f.startsWith(".") && !keepNames.has(f))
      .map((f) => fs.unlink(path.join(pubDir, f)).catch(() => undefined))
  );
}

export async function isHeroMediaOutOfSync(): Promise<boolean> {
  const root = process.cwd();
  const sourceDir = await resolveMediaDir(root);
  if (!sourceDir) return false;

  const pubDir = path.join(root, PUBLIC_DIR);
  const sourceFiles = await listSourceFiles(sourceDir);
  if (!sourceFiles.length) return false;

  const expected = sourceFiles.map(destNameForSource);
  let published: string[] = [];
  try {
    published = (await fs.readdir(pubDir)).filter(
      (f) => IMAGE_EXT.test(f) && !f.startsWith(".")
    );
  } catch {
    return true;
  }

  if (published.length !== expected.length) return true;
  if (expected.some((name) => !published.includes(name))) return true;

  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file);
    try {
      await fs.access(sourcePath);
    } catch {
      continue;
    }

    const sourceStat = await fs.stat(sourcePath);
    const destName = destNameForSource(file);
    try {
      const destStat = await fs.stat(path.join(pubDir, destName));
      if (sourceStat.mtimeMs > destStat.mtimeMs + 500) return true;
    } catch {
      return true;
    }
  }

  return false;
}

export async function syncHeroSlidesFromMedia(options?: {
  force?: boolean;
}): Promise<HeroMediaSyncResult> {
  if (!isHeroMediaSyncEnabled()) {
    return { slides: [], removed: 0, mediaVersion: "", sourceFiles: [] };
  }

  const root = process.cwd();
  const sourceDir = await resolveMediaDir(root);
  if (!sourceDir) {
    return { slides: [], removed: 0, mediaVersion: "", sourceFiles: [] };
  }

  const pubDir = path.join(root, PUBLIC_DIR);
  await fs.mkdir(pubDir, { recursive: true });

  const files = await listSourceFiles(sourceDir);
  const publishedNames = new Set<string>();
  const slides: CMSHeroSlide[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const destName = await publishHeroImage(
      path.join(sourceDir, file),
      pubDir,
      file
    );
    if (!destName) continue;

    publishedNames.add(destName);
    slides.push({
      id: slideIdFromFile(destName),
      src: `/media/hero-slider/${destName}`,
      alt: ALT_LABELS[i % ALT_LABELS.length],
      enabled: true,
      sortOrder: i,
    });
  }

  if (publishedNames.size > 0) {
    if (options?.force) {
      await purgeStalePublicFiles(pubDir, publishedNames);
    }
  }

  return {
    slides,
    removed: 0,
    mediaVersion: Date.now().toString(36),
    sourceFiles: files,
  };
}

export async function getExpectedHeroSlidesFromMedia(): Promise<CMSHeroSlide[]> {
  const root = process.cwd();
  const sourceDir = await resolveMediaDir(root);
  if (!sourceDir) return [];

  const files = await listSourceFiles(sourceDir);
  return files.map((file, i) => {
    const destName = destNameForSource(file);
    return {
      id: slideIdFromFile(destName),
      src: `/media/hero-slider/${destName}`,
      alt: ALT_LABELS[i % ALT_LABELS.length],
      enabled: true,
      sortOrder: i,
    };
  });
}

export async function refreshBrandHeroSlides(force = false): Promise<HeroMediaSyncResult> {
  const outOfSync = force || (await isHeroMediaOutOfSync());
  return syncHeroSlidesFromMedia({ force: outOfSync });
}

export async function getBrandHeroSlidesOrEmpty(): Promise<CMSHeroSlide[]> {
  try {
    const result = await syncHeroSlidesFromMedia();
    return result.slides;
  } catch {
    return [];
  }
}
