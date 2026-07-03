export type UploadFileResult = {
  url: string;
  filename: string;
  label: string;
  type: "image" | "video" | "audio";
};

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
