import { promises as fs } from "fs";
import path from "path";
import {
  getUploadPublicUrl,
  usesRuntimeUploadStorage,
  writeUploadFile,
} from "@/lib/cms/upload-storage";
import { createId } from "@/lib/cms/id";

const LOGO_EXT = /\.(png|jpe?g|svg|webp)$/i;

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

export type LogoUploadResult = {
  id: string;
  src: string;
  alt: string;
};

/** Admin-only: writes a logo upload to MEDIA/logo and public/media/logo (dev) or CMS uploads (Vercel). */
export async function saveLogoUpload(
  buffer: Buffer,
  originalName: string
): Promise<LogoUploadResult> {
  const safeName = path.basename(originalName);
  if (!LOGO_EXT.test(safeName)) {
    throw new Error("Formats autorisés : PNG, JPG, JPEG, SVG, WebP");
  }

  if (usesRuntimeUploadStorage()) {
    const ext = path.extname(safeName).slice(1) || "png";
    const filename = `${createId("logo")}.${ext}`;
    await writeUploadFile(filename, buffer);
    const src = getUploadPublicUrl(filename);
    return {
      id: logoIdFromFile(safeName),
      src,
      alt: logoAltFromFile(safeName),
    };
  }

  const root = process.cwd();
  const mediaDir = path.join(root, "MEDIA", "logo");
  const pubDir = path.join(/* turbopackIgnore: true */ root, "public", "media", "logo");
  await fs.mkdir(mediaDir, { recursive: true });
  await fs.mkdir(pubDir, { recursive: true });

  await fs.writeFile(path.join(mediaDir, safeName), buffer);
  await fs.writeFile(path.join(pubDir, safeName), buffer);

  return {
    id: logoIdFromFile(safeName),
    src: publicLogoSrc(safeName),
    alt: logoAltFromFile(safeName),
  };
}
