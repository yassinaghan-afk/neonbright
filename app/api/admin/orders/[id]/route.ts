import { requireAdmin, jsonError, jsonOk } from "@/lib/cms/api";
import { getSession } from "@/lib/cms/auth";
import {
  addOrderActivity,
  getOrderById,
  updateOrder,
} from "@/lib/orders/store";
import type { OrderUpdateInput } from "@/lib/orders/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const order = await getOrderById(id);
  if (!order) return jsonError("Order not found", 404);
  return jsonOk(order);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | (OrderUpdateInput & { activityNote?: string })
    | null;

  if (!body) return jsonError("Invalid body");

  const session = await getSession();
  const adminEmail = session?.email;
  const { activityNote, ...updates } = body;

  let order = await updateOrder(id, updates, adminEmail);
  if (!order) return jsonError("Order not found", 404);

  if (activityNote?.trim()) {
    order =
      (await addOrderActivity(id, activityNote.trim(), adminEmail)) ?? order;
  }

  return jsonOk(order);
}
