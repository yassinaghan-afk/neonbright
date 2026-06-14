import { promises as fs } from "fs";
import path from "path";
import { createId } from "@/lib/cms/id";
import type {
  Lead,
  LeadCreateInput,
  LeadFilters,
  LeadUpdateInput,
  TimelineEvent,
} from "./types";
import type { DesignerSnapshot } from "@/lib/designer/types";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readLeads(): Promise<Lead[]> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(LEADS_FILE, "utf-8");
    const leads = JSON.parse(raw) as Lead[];
    return leads.map((lead) => ({
      ...lead,
      orderId: lead.orderId ?? null,
      country: lead.country ?? "",
      estimatedPrice: lead.estimatedPrice ?? "",
      designerData: lead.designerData ?? null,
      wallImageUrl: lead.wallImageUrl ?? null,
      previewImageUrl: lead.previewImageUrl ?? null,
    }));
  } catch {
    await writeLeads([]);
    return [];
  }
}

export async function writeLeads(leads: Lead[]): Promise<Lead[]> {
  await ensureDataDir();
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  return leads;
}

function generateReference(): string {
  return `NB-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function createTimelineEvent(
  type: TimelineEvent["type"],
  message: string,
  createdBy?: string,
  metadata?: Record<string, string>
): TimelineEvent {
  return {
    id: createId("evt"),
    type,
    message,
    createdAt: new Date().toISOString(),
    createdBy,
    metadata,
  };
}

export async function createLead(input: LeadCreateInput): Promise<Lead> {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: createId("lead"),
    reference: generateReference(),
    status: "new",
    estimatedQuote: "",
    estimatedQuoteNotes: "",
    internalNotes: "",
    orderId: null,
    designerData: null,
    wallImageUrl: null,
    previewImageUrl: null,
    timeline: [
      createTimelineEvent(
        "created",
        "Quote request submitted via website form"
      ),
    ],
    createdAt: now,
    updatedAt: now,
    ...input,
  };

  const leads = await readLeads();
  leads.unshift(lead);
  await writeLeads(leads);
  return lead;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const leads = await readLeads();
  return leads.find((l) => l.id === id) ?? null;
}

export async function updateLead(
  id: string,
  input: LeadUpdateInput,
  adminEmail?: string
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const current = leads[index];
  const timeline = [...current.timeline];

  if (input.status && input.status !== current.status) {
    timeline.unshift(
      createTimelineEvent(
        "status_change",
        `Status changed from ${current.status} to ${input.status}`,
        adminEmail,
        { from: current.status, to: input.status }
      )
    );
  }

  if (
    input.estimatedQuote !== undefined &&
    input.estimatedQuote !== current.estimatedQuote
  ) {
    timeline.unshift(
      createTimelineEvent(
        "quote_updated",
        input.estimatedQuote
          ? `Estimated quote updated to ${input.estimatedQuote}`
          : "Estimated quote cleared",
        adminEmail
      )
    );
  }

  const updated: Lead = {
    ...current,
    ...input,
    timeline,
    updatedAt: new Date().toISOString(),
  };

  leads[index] = updated;
  await writeLeads(leads);
  return updated;
}

export async function addLeadActivity(
  id: string,
  message: string,
  adminEmail?: string
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const current = leads[index];
  const updated: Lead = {
    ...current,
    timeline: [
      createTimelineEvent("note", message, adminEmail),
      ...current.timeline,
    ],
    updatedAt: new Date().toISOString(),
  };

  leads[index] = updated;
  await writeLeads(leads);
  return updated;
}

export async function filterLeads(filters: LeadFilters): Promise<Lead[]> {
  let leads = await readLeads();

  if (filters.status && filters.status !== "all") {
    leads = leads.filter((l) => l.status === filters.status);
  }

  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.reference.toLowerCase().includes(q) ||
        l.fullName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.companyName.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.projectType.toLowerCase().includes(q)
    );
  }

  return leads.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateLeadFiles(
  id: string,
  file: { fileUrl: string; fileName: string; fileType: string }
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    ...file,
    updatedAt: new Date().toISOString(),
  };
  await writeLeads(leads);
  return leads[index];
}

export async function updateLeadDesignerAssets(
  id: string,
  data: {
    designerData?: DesignerSnapshot | null;
    wallImageUrl?: string | null;
    previewImageUrl?: string | null;
  }
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await writeLeads(leads);
  return leads[index];
}

export async function setLeadOrderId(
  id: string,
  orderId: string
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    orderId,
    updatedAt: new Date().toISOString(),
  };
  await writeLeads(leads);
  return leads[index];
}

export async function getLeadStats() {
  const leads = await readLeads();
  return {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    quoted: leads.filter((l) => l.status === "quoted").length,
    won: leads.filter((l) => l.status === "won").length,
    lost: leads.filter((l) => l.status === "lost").length,
  };
}
