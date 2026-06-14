import { requireAdmin, jsonError, jsonOk } from "@/lib/cms/api";
import { getSession } from "@/lib/cms/auth";
import { addLeadActivity } from "@/lib/leads/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body?.message?.trim()) return jsonError("Message is required");

  const session = await getSession();
  const lead = await addLeadActivity(
    id,
    body.message.trim(),
    session?.email
  );

  if (!lead) return jsonError("Lead not found", 404);
  return jsonOk(lead);
}
