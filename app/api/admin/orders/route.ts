import { requireAdmin, jsonOk } from "@/lib/cms/api";
import { filterOrders, getOrderStats } from "@/lib/orders/store";
import type { OrderStatus } from "@/lib/orders/types";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as OrderStatus | "all" | null;
  const search = searchParams.get("search") ?? undefined;
  const statsOnly = searchParams.get("stats") === "true";

  if (statsOnly) {
    return jsonOk(await getOrderStats());
  }

  return jsonOk(
    await filterOrders({
      status: status ?? "all",
      search,
    })
  );
}
