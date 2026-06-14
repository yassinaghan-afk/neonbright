import { promises as fs } from "fs";
import path from "path";
import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cms");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return jsonError("No file provided");
  }

  if (!ALLOWED.includes(file.type)) {
    return jsonError("Allowed: PNG, JPG, WebP, SVG");
  }

  if (file.size > MAX_SIZE) {
    return jsonError("File must be under 10 MB");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const filename = `${createId("img")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const url = `/uploads/cms/${filename}`;
  return jsonOk({ url, filename });
}
