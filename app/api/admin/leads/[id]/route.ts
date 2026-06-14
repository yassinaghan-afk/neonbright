import { requireAdmin, jsonError, jsonOk } from "@/lib/cms/api";
import { getSession } from "@/lib/cms/auth";
import {
  addLeadActivity,
  getLeadById,
  updateLead,
} from "@/lib/leads/store";
import type { LeadUpdateInput } from "@/lib/leads/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const lead = await getLeadById(id);
  if (!lead) return jsonError("Lead not found", 404);
  return jsonOk(lead);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | (LeadUpdateInput & { activityNote?: string })
    | null;

  if (!body) return jsonError("Invalid body");

  const session = await getSession();
  const adminEmail = session?.email;

  const { activityNote, ...updates } = body;

  let lead = await updateLead(id, updates, adminEmail);
  if (!lead) return jsonError("Lead not found", 404);

  if (activityNote?.trim()) {
    lead = (await addLeadActivity(id, activityNote.trim(), adminEmail)) ?? lead;
  }

  if (
    updates.internalNotes !== undefined &&
    updates.internalNotes !== lead.internalNotes &&
    !activityNote
  ) {
    lead =
      (await addLeadActivity(
        id,
        "Internal notes updated",
        adminEmail
      )) ?? lead;
  }

  return jsonOk(lead);
}
