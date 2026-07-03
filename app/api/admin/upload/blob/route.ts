import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  jsonFailure,
  jsonFailureFromUnknown,
  requireOwner,
} from "@/lib/cms/api";
import { hasBlobCredentials } from "@/lib/cms/blob-client";

export const dynamic = "force-dynamic";

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/quicktime"];
const BLOB_PREFIX = "cms/";

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

  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!readWriteToken) {
    return jsonFailure(
      "Client video uploads require BLOB_READ_WRITE_TOKEN. Redeploy after connecting the Blob store.",
      503
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonFailure("Invalid JSON body", 400);
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: readWriteToken,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(BLOB_PREFIX)) {
          throw new Error("Invalid upload path");
        }

        const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
        if (!["mp4", "webm", "mov"].includes(ext)) {
          throw new Error("Only MP4, WebM, and MOV videos are allowed");
        }

        return {
          allowedContentTypes: ALLOWED_VIDEOS,
          maximumSizeInBytes: MAX_VIDEO_SIZE,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return jsonFailureFromUnknown(err, 400);
  }
}
