import { requireAdmin, jsonOk } from "@/lib/cms/api";
import { filterLeads, getLeadStats } from "@/lib/leads/store";
import type { LeadStatus } from "@/lib/leads/types";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as LeadStatus | "all" | null;
  const search = searchParams.get("search") ?? undefined;
  const statsOnly = searchParams.get("stats") === "true";

  if (statsOnly) {
    const stats = await getLeadStats();
    return jsonOk(stats);
  }

  const leads = await filterLeads({
    status: status ?? "all",
    search,
  });

  return jsonOk(leads);
}
