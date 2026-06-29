import { NextRequest } from "next/server";
import {
  jsonFailure,
  jsonFailureFromUnknown,
  jsonSuccess,
  requireAdmin,
} from "@/lib/cms/api";
import {
  deleteUploadFile,
  listUploadFiles,
  mediaTypeOf,
  resolveUploadFilename,
} from "@/lib/cms/upload-storage";

export const dynamic = "force-dynamic";

export type MediaFile = {
  filename: string;
  url: string;
  type: "image" | "video" | "other";
  size: number;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return jsonFailure("Unauthorized", 401);

    const stored = await listUploadFiles(req);
    const results: MediaFile[] = stored.map((file) => ({
      filename: file.filename,
      url: file.url,
      type: mediaTypeOf(file.filename),
      size: file.size,
      createdAt: file.createdAt,
    }));

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
    const filename = (body?.filename as string | undefined) ?? (body?.url as string | undefined);
    if (!filename) {
      return jsonFailure("Filename requis", 400);
    }

    const safe = resolveUploadFilename(filename);
    if (!safe && !filename.includes(".blob.vercel-storage.com/")) {
      return jsonFailure("Filename invalide", 400);
    }

    const deleted = await deleteUploadFile(filename, req);
    if (!deleted) {
      return jsonFailure("Fichier introuvable", 404);
    }

    return jsonSuccess({ deleted: filename });
  } catch (err) {
    return jsonFailureFromUnknown(err);
  }
}
