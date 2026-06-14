"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadStatusBadge } from "@/components/admin/leads/LeadStatusBadge";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import {
  formatDate,
  labelForBudget,
  labelForProjectType,
  LEAD_STATUSES,
} from "@/lib/leads/helpers";
import type { Lead, LeadStatus } from "@/lib/leads/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2.5 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right text-white/85">{value}</span>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activityNote, setActivityNote] = useState("");

  const [converting, setConverting] = useState(false);

  const [status, setStatus] = useState<LeadStatus>("new");
  const [estimatedQuote, setEstimatedQuote] = useState("");
  const [estimatedQuoteNotes, setEstimatedQuoteNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    fetch(`/api/admin/leads/${id}`)
      .then((r) => r.json())
      .then((data: Lead) => {
        setLead(data);
        setStatus(data.status);
        setEstimatedQuote(data.estimatedQuote);
        setEstimatedQuoteNotes(data.estimatedQuoteNotes);
        setInternalNotes(data.internalNotes);
        setLoading(false);
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        estimatedQuote,
        estimatedQuoteNotes,
        internalNotes,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "error", text: data.error ?? "Save failed" });
    else {
      setLead(data);
      setMsg({ type: "success", text: "Lead updated" });
    }
  };

  const addNote = async () => {
    if (!activityNote.trim()) return;
    const res = await fetch(`/api/admin/leads/${id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: activityNote }),
    });
    const data = await res.json();
    if (res.ok) {
      setLead(data);
      setActivityNote("");
    }
  };

  const convertToOrder = async () => {
    setConverting(true);
    setMsg(null);
    const res = await fetch(`/api/admin/leads/${id}/convert`, { method: "POST" });
    const data = await res.json();
    setConverting(false);
    if (!res.ok) {
      setMsg({ type: "error", text: data.error ?? "Conversion failed" });
      return;
    }
    setLead(data.lead);
    setStatus(data.lead.status);
    setMsg({ type: "success", text: `Order ${data.order.orderNumber} created` });
    window.location.href = `/admin/orders/${data.order.id}`;
  };

  if (loading || !lead) {
    return <AdminShell><p className="text-white/45">Loading...</p></AdminShell>;
  }

  const canConvert =
    !lead.orderId && (lead.status === "quoted" || lead.status === "won");

  const isImage = lead.fileType?.startsWith("image/");
  const isPdf = lead.fileType === "application/pdf";

  return (
    <AdminShell>
      <div className="mb-6">
        <Link href="/admin/leads" className="text-xs text-white/45 hover:text-white">← Back to Leads</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold">{lead.fullName}</h1>
              <LeadStatusBadge status={lead.status} />
            </div>
            <p className="mt-1 font-mono text-sm text-neon-pink">{lead.reference}</p>
            <p className="text-xs text-white/45">Submitted {formatDate(lead.createdAt)}</p>
          </div>
          <AdminButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </AdminButton>
          {canConvert && (
            <AdminButton variant="secondary" onClick={convertToOrder} disabled={converting}>
              {converting ? "Converting..." : "Convert to Order"}
            </AdminButton>
          )}
          {lead.orderId && (
            <Link href={`/admin/orders/${lead.orderId}`}>
              <AdminButton variant="secondary">View Order</AdminButton>
            </Link>
          )}
        </div>
      </div>

      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminCard title="Contact Information">
            <DetailRow label="Name" value={lead.fullName} />
            <DetailRow label="Email" value={lead.email} />
            <DetailRow label="Phone" value={lead.phone} />
            <DetailRow label="Company" value={lead.companyName} />
            <DetailRow label="Country" value={lead.country} />
          </AdminCard>

          <AdminCard title="Project Specifications">
            <DetailRow label="Type" value={labelForProjectType(lead.projectType)} />
            <DetailRow label="Dimensions" value={lead.width && lead.height ? `${lead.width} × ${lead.height} cm` : ""} />
            <DetailRow label="Environment" value={lead.environment === "indoor" ? "Indoor" : lead.environment === "outdoor" ? "Outdoor" : ""} />
            <DetailRow label="Color" value={lead.colorType === "single-color" ? "Single Color" : lead.colorType === "rgb" ? "RGB Multi-Color" : ""} />
            <DetailRow label="Options" value={[
              lead.acrylicBacking && "Acrylic Backing",
              lead.installationRequired && "Installation Required",
            ].filter(Boolean).join(", ")} />
            <DetailRow label="Budget" value={labelForBudget(lead.budgetRange)} />
            <DetailRow label="Estimated Price" value={lead.estimatedPrice} />
            {lead.message && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="text-xs text-white/45 mb-1">Message</p>
                <p className="text-sm leading-relaxed text-white/75">{lead.message}</p>
              </div>
            )}
          </AdminCard>

          {(lead.previewImageUrl || lead.designerData) && (
            <AdminCard title="Visual Designer Preview">
              {lead.designerData && (
                <div className="mb-3 space-y-1 text-sm">
                  <DetailRow label="Sign Type" value={lead.designerData.signType === "text" ? "Text Neon" : "Logo Neon"} />
                  {lead.designerData.signType === "text" && (
                    <>
                      <DetailRow label="Text" value={lead.designerData.text} />
                      <DetailRow label="Font" value={lead.designerData.fontFamily} />
                    </>
                  )}
                  <DetailRow label="Neon Color" value={lead.designerData.color} />
                  <DetailRow label="Glow" value={`${lead.designerData.glowIntensity}%`} />
                </div>
              )}
              {lead.previewImageUrl && (
                <div className="relative aspect-video max-h-64 overflow-hidden rounded-lg border border-white/10 bg-black">
                  <Image src={lead.previewImageUrl} alt="Designer preview" fill className="object-contain" unoptimized />
                </div>
              )}
              {lead.wallImageUrl && (
                <a href={lead.wallImageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-neon-pink hover:underline">
                  View wall photo →
                </a>
              )}
            </AdminCard>
          )}

          {lead.fileUrl && (
            <AdminCard title="Uploaded Logo / Design">
              <p className="mb-3 text-xs text-white/45">{lead.fileName}</p>
              {isImage && (
                <div className="relative aspect-video max-h-64 overflow-hidden rounded-lg border border-white/10 bg-black">
                  <Image src={lead.fileUrl} alt={lead.fileName ?? "Upload"} fill className="object-contain" unoptimized />
                </div>
              )}
              {isPdf && (
                <a href={lead.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-neon-pink hover:underline">
                  View PDF file →
                </a>
              )}
              {!isImage && !isPdf && lead.fileUrl && (
                <a href={lead.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-pink hover:underline">
                  Download file →
                </a>
              )}
            </AdminCard>
          )}

          <AdminCard title="Activity Timeline">
            <div className="mb-4 flex gap-2">
              <AdminInput
                placeholder="Add a note..."
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                className="flex-1"
              />
              <AdminButton variant="secondary" onClick={addNote}>Add</AdminButton>
            </div>
            <div className="space-y-0">
              {lead.timeline.map((event) => (
                <div key={event.id} className="relative border-l border-white/10 pl-4 pb-4 ml-2">
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-neon-purple/50 ring-2 ring-[#0d0d0d]" />
                  <p className="text-sm text-white/80">{event.message}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {formatDate(event.createdAt)}
                    {event.createdBy && ` · ${event.createdBy}`}
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Lead Status">
            <AdminField label="Status">
              <AdminSelect value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </AdminSelect>
            </AdminField>
          </AdminCard>

          <AdminCard title="Estimated Quote">
            <div className="space-y-3">
              <AdminField label="Quote Amount" hint="e.g. $2,500 or €1,800 – 2,200">
                <AdminInput value={estimatedQuote} onChange={(e) => setEstimatedQuote(e.target.value)} placeholder="$0.00" />
              </AdminField>
              <AdminField label="Quote Notes" hint="Breakdown, inclusions, validity">
                <AdminTextarea value={estimatedQuoteNotes} onChange={(e) => setEstimatedQuoteNotes(e.target.value)} placeholder="Includes design, production, shipping..." />
              </AdminField>
            </div>
          </AdminCard>

          <AdminCard title="Internal Notes">
            <AdminTextarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Private notes for your team..."
              className="min-h-[140px]"
            />
          </AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
