import { promises as fs } from "fs";
import path from "path";
import { requireAdmin, jsonError, jsonOk } from "@/lib/cms/api";
import { getSession } from "@/lib/cms/auth";
import { addOrderDesignFile, getOrderById } from "@/lib/orders/store";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/quote/constants";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/orders");

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const order = await getOrderById(id);
  if (!order) return jsonError("Order not found", 404);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File) || file.size === 0) {
    return jsonError("No file provided");
  }

  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return jsonError("Invalid file type. Use PNG, JPG, SVG, or PDF.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonError("File must be under 10 MB.");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const filename = `${order.id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const session = await getSession();
  const updated = await addOrderDesignFile(id, {
    url: `/uploads/orders/${filename}`,
    fileName: file.name,
    fileType: file.type,
    uploadedBy: session?.email,
  });

  return jsonOk(updated, 201);
}
