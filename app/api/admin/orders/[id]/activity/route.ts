import { requireAdmin, jsonError, jsonOk } from "@/lib/cms/api";
import { getSession } from "@/lib/cms/auth";
import { addOrderActivity, getOrderById } from "@/lib/orders/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body?.message?.trim()) return jsonError("Message is required");

  const order = await getOrderById(id);
  if (!order) return jsonError("Order not found", 404);

  const session = await getSession();
  const updated = await addOrderActivity(
    id,
    body.message.trim(),
    session?.email
  );

  return jsonOk(updated);
}
