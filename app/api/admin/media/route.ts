import { promises as fs } from "fs";
import path from "path";
import { requireAdmin, jsonOk, jsonError } from "@/lib/cms/api";
import { NextRequest } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cms");

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "svg", "gif", "avif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "avi", "mpeg", "mkv"]);

function extOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function typeOf(name: string): "image" | "video" | "other" {
  const ext = extOf(name);
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  return "other";
}

export type MediaFile = {
  filename: string;
  url: string;
  type: "image" | "video" | "other";
  size: number;
  createdAt: string;
};

export async function GET(_req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const files = await fs.readdir(UPLOAD_DIR);
  const results: MediaFile[] = await Promise.all(
    files
      .filter((f) => !f.startsWith("."))
      .map(async (filename) => {
        const stat = await fs.stat(path.join(UPLOAD_DIR, filename));
        return {
          filename,
          url: `/uploads/cms/${filename}`,
          type: typeOf(filename),
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        };
      })
  );

  results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jsonOk(results);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const filename = body.filename as string;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return jsonError("Filename invalide");
  }

  const target = path.join(UPLOAD_DIR, filename);
  await fs.unlink(target).catch(() => {});
  return jsonOk({ deleted: filename });
}
