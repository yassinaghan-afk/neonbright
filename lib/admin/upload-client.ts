import { filenameToLabel } from "@/lib/cms/filename-utils";

export type UploadFileResult = {
  url: string;
  filename: string;
  label: string;
  type: "image" | "video" | "audio";
  mobileImageUrl?: string;
  desktopImageUrl?: string;
  thumbnailUrl?: string;
};

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function isAllowedVideoFile(file: File): boolean {
  if (ALLOWED_VIDEO_MIMES.has(file.type)) return true;
  return /\.(mp4|webm|mov)$/i.test(file.name);
}

type UploadApiPayload = {
  success?: boolean;
  data?: UploadFileResult | { files: UploadFileResult[] };
  error?: string;
  url?: string;
  filename?: string;
  label?: string;
  type?: "image" | "video" | "audio";
  files?: UploadFileResult[];
};

function extractUploadResult(payload: UploadApiPayload): UploadFileResult {
  if (payload.success === true && payload.data && !Array.isArray(payload.data)) {
    const data = payload.data as UploadFileResult;
    if (data.url) return data;
  }

  if (payload.url) {
    return {
      url: payload.url,
      filename: payload.filename ?? payload.url.split("/").pop() ?? "",
      label: payload.label ?? payload.filename ?? "",
      type: payload.type ?? "image",
    };
  }

  throw new Error("Invalid upload response");
}

async function parseUploadResponse(res: Response): Promise<UploadApiPayload> {
  const text = await res.text();
  if (!text) {
    throw new Error(`Upload failed: empty server response (HTTP ${res.status})`);
  }

  try {
    return JSON.parse(text) as UploadApiPayload;
  } catch {
    if (res.status === 413) {
      throw new Error("Upload failed: file too large for server upload.");
    }
    throw new Error(
      text.startsWith("<!")
        ? `Upload failed: server returned HTML (HTTP ${res.status})`
        : `Upload failed: invalid JSON (HTTP ${res.status})`
    );
  }
}

function uploadErrorMessage(payload: UploadApiPayload, status: number): string {
  if (typeof payload.error === "string" && payload.error) return payload.error;
  return `Upload failed (HTTP ${status})`;
}

/** Upload a single file to /api/admin/upload with safe JSON parsing. */
export async function uploadAdminFile(
  file: File,
  options?: { preset?: string; category?: string }
): Promise<UploadFileResult> {
  const fd = new FormData();
  fd.append("file", file);
  if (options?.preset) fd.append("preset", options.preset);
  if (options?.category) fd.append("category", options.category);

  const qs = options?.category
    ? `?category=${encodeURIComponent(options.category)}`
    : "";

  const res = await fetch(`/api/admin/upload${qs}`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const payload = await parseUploadResponse(res);

  if (!res.ok || payload.success === false) {
    throw new Error(uploadErrorMessage(payload, res.status));
  }

  return extractUploadResult(payload);
}

/**
 * Upload a CMS video via the same local multipart route.
 * (Legacy Vercel Blob presign path removed.)
 */
export async function uploadAdminVideoFile(file: File): Promise<UploadFileResult> {
  if (!isAllowedVideoFile(file)) {
    throw new Error(
      `${file.name}: format non supporté (${file.type || "inconnu"}). Utilisez MP4, WebM ou MOV.`
    );
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error(`${file.name}: vidéos max 200 Mo`);
  }

  return uploadAdminFile(file, { preset: "video", category: "cms" });
}

/** Upload multiple files in one request. */
export async function uploadAdminFiles(
  files: File[],
  preset?: string
): Promise<UploadFileResult[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  if (preset) fd.append("preset", preset);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const payload = await parseUploadResponse(res);

  if (!res.ok || payload.success === false) {
    throw new Error(uploadErrorMessage(payload, res.status));
  }

  if (payload.success === true && payload.data && "files" in payload.data) {
    return payload.data.files;
  }
  if (Array.isArray(payload.files)) return payload.files;

  throw new Error("Invalid multi-upload response");
}

// Re-export label helper for callers that expected previous module shape
export { filenameToLabel };
