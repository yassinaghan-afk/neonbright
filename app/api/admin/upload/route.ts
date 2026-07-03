import { createId } from "@/lib/cms/id";
import {
  filenameToLabel,
  optimizeUploadedImage,
  type ImageProcessPreset,
} from "@/lib/cms/image-process";
import {
  jsonFailure,
  jsonFailureFromUnknown,
  jsonSuccess,
  requireOwner,
} from "@/lib/cms/api";
import { writeUploadFile } from "@/lib/cms/upload-storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const ALLOWED_IMAGES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];
const ALLOWED_VIDEOS = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
];

const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const ALLOWED_AUDIO = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
];

export type UploadResult = {
  url: string;
  filename: string;
  label: string;
  type: "image" | "video" | "audio";
};

async function saveFile(
  file: File,
  preset: string,
  request: Request
): Promise<UploadResult> {
  const isVideo = ALLOWED_VIDEOS.includes(file.type);
  const isImage = ALLOWED_IMAGES.includes(file.type);
  const isAudio =
    ALLOWED_AUDIO.includes(file.type) ||
    /\.(mp3|wav|m4a)$/i.test(file.name);

  if (!isImage && !isVideo && !isAudio) {
    throw new Error(`${file.name}: format non supporté (${file.type || "inconnu"})`);
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error(`${file.name}: images max 10 Mo`);
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error(`${file.name}: vidéos max 200 Mo`);
  }
  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    throw new Error(`${file.name}: audio max 50 Mo`);
  }

  const raw = Buffer.from(await file.arrayBuffer());

  if (isAudio) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
    const filename = `${createId("aud")}.${ext}`;
    const url = await writeUploadFile(filename, raw, request);
    return {
      url,
      filename,
      label: filenameToLabel(file.name),
      type: "audio",
    };
  }

  if (isVideo) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    const filename = `${createId("vid")}.${ext}`;
    const url = await writeUploadFile(filename, raw, request);
    return {
      url,
      filename,
      label: filenameToLabel(file.name),
      type: "video",
    };
  }

  if (preset === "logo") {
    const { saveLogoUpload } = await import("@/lib/cms/admin/logo-upload");
    const logo = await saveLogoUpload(raw, file.name, request);
    return {
      url: logo.src,
      filename: logo.src.split("/").pop() ?? file.name,
      label: filenameToLabel(file.name),
      type: "image",
    };
  }

  const VALID_PRESETS: ImageProcessPreset[] = [
    "hero",
    "logo",
    "gallery",
    "thumbnail",
  ];
  const imagePreset: ImageProcessPreset = VALID_PRESETS.includes(
    preset as ImageProcessPreset
  )
    ? (preset as ImageProcessPreset)
    : "gallery";

  const optimized = await optimizeUploadedImage(raw, file.type, imagePreset);
  const filename = `${createId("img")}.${optimized.ext}`;
  const url = await writeUploadFile(filename, optimized.buffer, request);

  return {
    url,
    filename,
    label: filenameToLabel(file.name),
    type: "image",
  };
}

export async function POST(request: Request) {
  try {
    const { error } = await requireOwner();
    if (error) {
      return jsonFailure("Unauthorized", 401);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error("[POST /api/admin/upload] formData parse failed:", err);
      return jsonFailure("Invalid multipart form data", 400);
    }

    const preset = (formData.get("preset") as string) || "gallery";

    const files: File[] = [];
    const multi = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File);
    files.push(...multi);
    const single = formData.get("file");
    if (single instanceof File) files.push(single);

    if (files.length === 0) {
      return jsonFailure("Aucun fichier fourni", 400);
    }

    const results = await Promise.all(
      files.map((f) => saveFile(f, preset, request))
    );

    if (files.length === 1 && !formData.get("files")) {
      return jsonSuccess(results[0]);
    }

    return jsonSuccess({ files: results });
  } catch (err) {
    return jsonFailureFromUnknown(err, 500);
  }
}
