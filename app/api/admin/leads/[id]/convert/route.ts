import { requireAdmin, jsonError, jsonOk } from "@/lib/cms/api";
import { getSession } from "@/lib/cms/auth";
import { convertLeadToOrder } from "@/lib/orders/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const session = await getSession();
  const result = await convertLeadToOrder(id, session?.email);

  if ("error" in result) {
    return jsonError(result.error, 400);
  }

  return jsonOk(result, 201);
}
