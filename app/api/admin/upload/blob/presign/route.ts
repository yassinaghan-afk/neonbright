import { issueSignedToken, presignUrl } from "@vercel/blob";
import { createId } from "@/lib/cms/id";
import {
  jsonFailure,
  jsonFailureFromUnknown,
  jsonSuccess,
  requireOwner,
} from "@/lib/cms/api";
import {
  getBlobCommandOptions,
  hasBlobCredentials,
} from "@/lib/cms/blob-client";

export const dynamic = "force-dynamic";

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_EXTS = new Set(["mp4", "webm", "mov"]);
const BLOB_PREFIX = "cms/";

type PresignBody = {
  ext?: string;
  contentType?: string;
  size?: number;
};

function readStoreId(): string {
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (!storeId) {
    throw new Error("BLOB_STORE_ID is not configured");
  }
  return storeId;
}

function publicBlobUrl(pathname: string): string {
  return `https://${readStoreId()}.public.blob.vercel-storage.com/${pathname}`;
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) {
    return jsonFailure("Unauthorized", 401);
  }

  if (!hasBlobCredentials()) {
    return jsonFailure(
      "Blob storage not configured. Connect a Vercel Blob store to this project.",
      503
    );
  }

  let body: PresignBody;
  try {
    body = (await request.json()) as PresignBody;
  } catch {
    return jsonFailure("Invalid JSON body", 400);
  }

  const ext = body.ext?.toLowerCase() ?? "";
  if (!ALLOWED_EXTS.has(ext)) {
    return jsonFailure("Only MP4, WebM, and MOV videos are allowed", 400);
  }

  const size = typeof body.size === "number" ? body.size : 0;
  if (size <= 0) {
    return jsonFailure("File size is required", 400);
  }
  if (size > MAX_VIDEO_SIZE) {
    return jsonFailure("Vidéos max 200 Mo", 400);
  }

  const contentType =
    body.contentType && ALLOWED_VIDEOS.includes(body.contentType)
      ? body.contentType
      : ext === "mp4"
        ? "video/mp4"
        : ext === "webm"
          ? "video/webm"
          : "video/quicktime";

  const pathname = `${BLOB_PREFIX}${createId("vid")}.${ext}`;

  try {
    const auth = await getBlobCommandOptions(request);
    const signed = await issueSignedToken({
      ...auth,
      pathname,
      operations: ["put"],
      allowedContentTypes: ALLOWED_VIDEOS,
      maximumSizeInBytes: MAX_VIDEO_SIZE,
    });

    const { presignedUrl } = await presignUrl(signed, {
      operation: "put",
      pathname,
      access: "public",
      allowedContentTypes: ALLOWED_VIDEOS,
      maximumSizeInBytes: MAX_VIDEO_SIZE,
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    return jsonSuccess({
      presignedUrl,
      url: publicBlobUrl(pathname),
      pathname,
    });
  } catch (err) {
    return jsonFailureFromUnknown(err, 500);
  }
}
