import { NextRequest, NextResponse } from "next/server";
import {
  contentTypeForFilename,
  readUploadFileForServe,
  resolveUploadFilename,
} from "@/lib/cms/upload-storage";
import { isUploadCategory } from "@/lib/cms/storage-paths";

export const dynamic = "force-dynamic";

/**
 * Serve uploaded files from STORAGE_ROOT/uploads/
 * Reached via rewrite: /uploads/:path* → /api/uploads/:path*
 *
 * Expected path: [category]/filename
 * Example: /uploads/events/img_xxx.jpg
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;

    if (!segments || segments.length !== 2) {
      return new NextResponse("Not found", { status: 404 });
    }

    const [category, filenameRaw] = segments;

    if (!isUploadCategory(category)) {
      return new NextResponse("Not found", { status: 404 });
    }

    const safe = resolveUploadFilename(filenameRaw);
    if (!safe) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const buffer = await readUploadFileForServe(safe, category);
    const contentType = contentTypeForFilename(safe);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[uploads] serve error:", err);
    return new NextResponse("Not found", { status: 404 });
  }
}
