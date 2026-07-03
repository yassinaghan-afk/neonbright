import { filenameToLabel } from "@/lib/cms/image-process";

export type UploadFileResult = {
  url: string;
  filename: string;
  label: string;
  type: "image" | "video" | "audio";
};

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const VERCEL_SERVER_BODY_LIMIT = 4.5 * 1024 * 1024;
const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function isAllowedVideoFile(file: File): boolean {
  if (ALLOWED_VIDEO_MIMES.has(file.type)) return true;
  return /\.(mp4|webm|mov)$/i.test(file.name);
}

function videoContentType(file: File): string | undefined {
  if (file.type && ALLOWED_VIDEO_MIMES.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return undefined;
}

type PresignApiPayload = {
  success?: boolean;
  data?: {
    presignedUrl: string;
    url: string;
    pathname: string;
  };
  error?: string;
};

async function requestVideoPresignUrl(file: File): Promise<{
  presignedUrl: string;
  url: string;
  pathname: string;
}> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const res = await fetch("/api/admin/upload/blob/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ext,
      contentType: videoContentType(file),
      size: file.size,
    }),
  });

  const text = await res.text();
  let payload: PresignApiPayload;
  try {
    payload = text ? (JSON.parse(text) as PresignApiPayload) : {};
  } catch {
    if (res.status === 413) {
      throw new Error(
        "Upload failed: file too large for server request"
      );
    }
    throw new Error(
      text.startsWith("<!")
        ? `Upload failed: server returned HTML (HTTP ${res.status})`
        : `Upload failed: invalid server response (HTTP ${res.status})`
    );
  }

  if (!res.ok || payload.success === false || !payload.data?.presignedUrl) {
    const err = new Error(
      typeof payload.error === "string" && payload.error
        ? payload.error
        : `Upload failed (HTTP ${res.status})`
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  return payload.data;
}

function blobUploadErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message.replace(/^Vercel Blob:\s*/i, "");
  }
  return "Upload failed";
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
      throw new Error(
        "Upload failed: file too large for server upload. Use direct Blob upload for videos over 4.5 MB."
      );
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
  options?: { preset?: string }
): Promise<UploadFileResult> {
  const fd = new FormData();
  fd.append("file", file);
  if (options?.preset) fd.append("preset", options.preset);

  const res = await fetch("/api/admin/upload", {
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
 * Upload a testimonial/CMS video directly to Vercel Blob from the browser.
 * Bypasses the ~4.5 MB Vercel serverless request body limit.
 * Never proxies video bytes through /api/admin/upload on production.
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

  let presign: { presignedUrl: string; url: string; pathname: string };
  try {
    presign = await requestVideoPresignUrl(file);
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    // Local dev without Blob: allow small files via the legacy multipart route.
    if (status === 503 && file.size <= VERCEL_SERVER_BODY_LIMIT) {
      return uploadAdminFile(file, { preset: "video" });
    }
    throw err instanceof Error ? err : new Error(blobUploadErrorMessage(err));
  }

  const putRes = await fetch(presign.presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": videoContentType(file) ?? "application/octet-stream",
    },
  });

  if (!putRes.ok) {
    throw new Error(`Blob upload failed (HTTP ${putRes.status})`);
  }

  const filename = presign.pathname.replace(/^cms\//, "");
  return {
    url: presign.url,
    filename,
    label: filenameToLabel(file.name),
    type: "video",
  };
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
