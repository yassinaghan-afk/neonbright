import { NextRequest } from "next/server";
import {
  contentTypeForFilename,
  readUploadFileForServe,
  resolveUploadFilename,
} from "@/lib/cms/upload-storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ filename: string }> };

/** Serves CMS uploads from /tmp on Vercel (public/uploads is read-only in Lambda). */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { filename: raw } = await params;
    const safe = resolveUploadFilename(raw);
    if (!safe) {
      return new Response(JSON.stringify({ success: false, error: "Invalid filename" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = await readUploadFileForServe(safe);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentTypeForFilename(safe),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[GET /api/media/cms]", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "File not found",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
}
