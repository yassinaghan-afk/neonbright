import { promises as fs } from "fs";
import path from "path";
import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import {
  filenameToLabel,
  optimizeUploadedImage,
  type ImageProcessPreset,
} from "@/lib/cms/image-process";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cms");
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;  // 200 MB
const ALLOWED_IMAGES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg"];
const ALLOWED_TYPES = [...ALLOWED_IMAGES, ...ALLOWED_VIDEOS];

async function saveFile(
  file: File,
  preset: string
): Promise<{ url: string; filename: string; label: string; type: "image" | "video" }> {
  const isVideo = ALLOWED_VIDEOS.includes(file.type);
  const isImage = ALLOWED_IMAGES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error(`${file.name}: format non supporté`);
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error(`${file.name}: images max 10 Mo`);
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error(`${file.name}: vidéos max 200 Mo`);
  }

  const raw = Buffer.from(await file.arrayBuffer());

  if (isVideo) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    const filename = `${createId("vid")}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), raw);
    return {
      url: `/uploads/cms/${filename}`,
      filename,
      label: filenameToLabel(file.name),
      type: "video",
    };
  }

  if (preset === "logo") {
    const { saveLogoUpload } = await import("@/lib/cms/admin/logo-upload");
    const logo = await saveLogoUpload(raw, file.name);
    return {
      url: logo.src,
      filename: path.basename(logo.src),
      label: filenameToLabel(file.name),
      type: "image",
    };
  }

  const VALID_PRESETS: ImageProcessPreset[] = ["hero", "logo", "gallery", "thumbnail"];
  const imagePreset: ImageProcessPreset = VALID_PRESETS.includes(preset as ImageProcessPreset)
    ? (preset as ImageProcessPreset)
    : "gallery";

  const optimized = await optimizeUploadedImage(raw, file.type, imagePreset);
  const filename = `${createId("img")}.${optimized.ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), optimized.buffer);

  return {
    url: `/uploads/cms/${filename}`,
    filename,
    label: filenameToLabel(file.name),
    type: "image",
  };
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const formData = await request.formData();
  const preset = (formData.get("preset") as string) || "gallery";

  const files: File[] = [];
  const multi = formData.getAll("files").filter((f): f is File => f instanceof File);
  files.push(...multi);
  const single = formData.get("file");
  if (single instanceof File) files.push(single);

  if (files.length === 0) {
    return jsonError("Aucun fichier fourni");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  try {
    const results = await Promise.all(files.map((f) => saveFile(f, preset)));

    if (files.length === 1 && !formData.get("files")) {
      return jsonOk(results[0]);
    }

    return jsonOk({ files: results });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Upload failed");
  }
}
