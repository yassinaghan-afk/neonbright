import { promises as fs } from "fs";
import path from "path";

const MEDIA_DIRS = ["MEDIA/logo", "MEDIA/Logos", "Media/logo"];
const PUBLIC_DIR = "public/media/logo";
const LOGO_EXT = /\.(png|jpe?g|svg|webp)$/i;

/** Logo sync from MEDIA/ → public/ runs only in local development. */
export function isLogoMediaSyncEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export type PartnerLogo = {
  id: string;
  src: string;
  alt: string;
};

function logoIdFromFile(file: string): string {
  const stem = path.basename(file, path.extname(file)).toLowerCase();
  return `logo_${stem.replace(/[^a-z0-9]+/g, "_").slice(0, 40)}`;
}

function logoAltFromFile(file: string): string {
  return path
    .basename(file, path.extname(file))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function publicLogoSrc(filename: string): string {
  return `/media/logo/${encodeURIComponent(filename)}`;
}

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

async function listLogoFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir);
  return entries
    .filter((f) => LOGO_EXT.test(f) && !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

async function publishLogo(
  sourcePath: string,
  pubDir: string,
  file: string
): Promise<string> {
  const destName = file;
  const destPath = path.join(pubDir, destName);
  try {
    const [sourceStat, destStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(destPath),
    ]);
    if (sourceStat.mtimeMs <= destStat.mtimeMs + 500) {
      return destName;
    }
  } catch {
    /* dest missing — copy below */
  }

  await fs.copyFile(sourcePath, destPath);
  return destName;
}

export function logoFilenameFromSrc(src: string): string {
  return decodeURIComponent(path.basename(src.split("?")[0]));
}

export async function saveLogoUpload(
  buffer: Buffer,
  originalName: string
): Promise<PartnerLogo> {
  const root = process.cwd();
  const mediaDir = path.join(root, "MEDIA", "logo");
  const pubDir = path.join(root, PUBLIC_DIR);
  await fs.mkdir(mediaDir, { recursive: true });
  await fs.mkdir(pubDir, { recursive: true });

  const safeName = path.basename(originalName);
  if (!LOGO_EXT.test(safeName)) {
    throw new Error("Formats autorisés : PNG, JPG, JPEG, SVG, WebP");
  }

  await fs.writeFile(path.join(mediaDir, safeName), buffer);
  await fs.writeFile(path.join(pubDir, safeName), buffer);

  return {
    id: logoIdFromFile(safeName),
    src: publicLogoSrc(safeName),
    alt: logoAltFromFile(safeName),
  };
}

export async function deleteLogoByFilename(filename: string): Promise<void> {
  const root = process.cwd();
  const safeName = path.basename(filename);
  await Promise.all([
    fs.unlink(path.join(root, "MEDIA", "logo", safeName)).catch(() => undefined),
    fs.unlink(path.join(root, PUBLIC_DIR, safeName)).catch(() => undefined),
  ]);
}

async function purgeStalePublicFiles(pubDir: string, keepNames: Set<string>) {
  let existing: string[] = [];
  try {
    existing = await fs.readdir(pubDir);
  } catch {
    return;
  }
  await Promise.all(
    existing
      .filter((f) => LOGO_EXT.test(f) && !f.startsWith(".") && !keepNames.has(f))
      .map((f) => fs.unlink(path.join(pubDir, f)).catch(() => undefined))
  );
}

export async function syncLogosFromMedia(): Promise<PartnerLogo[]> {
  if (!isLogoMediaSyncEnabled()) {
    return [];
  }

  const root = process.cwd();
  const pubDir = path.join(root, PUBLIC_DIR);
  await fs.mkdir(pubDir, { recursive: true });

  const sourceDir = await resolveMediaDir(root);
  const publishedNames = new Set<string>();
  const logos: PartnerLogo[] = [];

  if (sourceDir) {
    const files = await listLogoFiles(sourceDir);
    for (const file of files) {
      const destName = await publishLogo(
        path.join(sourceDir, file),
        pubDir,
        file
      );
      publishedNames.add(destName);
      logos.push({
        id: logoIdFromFile(destName),
        src: publicLogoSrc(destName),
        alt: logoAltFromFile(destName),
      });
    }
    await purgeStalePublicFiles(pubDir, publishedNames);
  }

  if (logos.length > 0) return logos;

  const pubFiles = await listLogoFiles(pubDir);
  return pubFiles.map((file) => ({
    id: logoIdFromFile(file),
    src: publicLogoSrc(file),
    alt: logoAltFromFile(file),
  }));
}

export async function getPartnerLogosFromMedia(): Promise<PartnerLogo[]> {
  try {
    return await syncLogosFromMedia();
  } catch {
    return [];
  }
}
