import { NextRequest } from "next/server";
import {
  jsonFailure,
  jsonFailureFromUnknown,
  jsonSuccess,
  requireAdmin,
} from "@/lib/cms/api";
import {
  deleteUploadFile,
  getUploadPublicUrl,
  listUploadFiles,
  mediaTypeOf,
  resolveUploadFilename,
  statUploadFile,
} from "@/lib/cms/upload-storage";

export const dynamic = "force-dynamic";

export type MediaFile = {
  filename: string;
  url: string;
  type: "image" | "video" | "other";
  size: number;
  createdAt: string;
};

export async function GET(_req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return jsonFailure("Unauthorized", 401);

    const filenames = await listUploadFiles();
    const results: MediaFile[] = [];

    for (const filename of filenames) {
      try {
        const stat = await statUploadFile(filename);
        results.push({
          filename,
          url: getUploadPublicUrl(filename),
          type: mediaTypeOf(filename),
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        });
      } catch (err) {
        console.error("[GET /api/admin/media] skip file:", filename, err);
      }
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return jsonSuccess(results);
  } catch (err) {
    return jsonFailureFromUnknown(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return jsonFailure("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const filename = body?.filename as string | undefined;
    if (!filename) {
      return jsonFailure("Filename requis", 400);
    }

    const safe = resolveUploadFilename(filename);
    if (!safe) return jsonFailure("Filename invalide", 400);

    const deleted = await deleteUploadFile(safe);
    if (!deleted) {
      return jsonFailure("Fichier introuvable", 404);
    }

    return jsonSuccess({ deleted: safe });
  } catch (err) {
    return jsonFailureFromUnknown(err);
  }
}
