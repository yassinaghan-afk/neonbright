"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
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
  formatDateTime,
  formatOrderDate,
  labelForBudget,
  labelForProjectType,
  ORDER_STATUSES,
} from "@/lib/orders/helpers";
import type { Order, OrderStatus } from "@/lib/orders/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2.5 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right text-white/85">{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activityNote, setActivityNote] = useState("");

  const [status, setStatus] = useState<OrderStatus>("pending");
  const [quotedAmount, setQuotedAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [productionNotes, setProductionNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [actualDeliveryDate, setActualDeliveryDate] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((data: Order) => {
        setOrder(data);
        setStatus(data.status);
        setQuotedAmount(data.quotedAmount);
        setQuoteNotes(data.quoteNotes);
        setProductionNotes(data.productionNotes);
        setInternalNotes(data.internalNotes);
        setEstimatedDeliveryDate(data.estimatedDeliveryDate ?? "");
        setActualDeliveryDate(data.actualDeliveryDate ?? "");
        setLoading(false);
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        quotedAmount,
        quoteNotes,
        productionNotes,
        internalNotes,
        estimatedDeliveryDate: estimatedDeliveryDate || null,
        actualDeliveryDate: actualDeliveryDate || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "error", text: data.error ?? "Save failed" });
    else {
      setOrder(data);
      setStatus(data.status);
      setEstimatedDeliveryDate(data.estimatedDeliveryDate ?? "");
      setActualDeliveryDate(data.actualDeliveryDate ?? "");
      setMsg({ type: "success", text: "Order updated" });
    }
  };

  const addNote = async () => {
    if (!activityNote.trim()) return;
    const res = await fetch(`/api/admin/orders/${id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: activityNote }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder(data);
      setActivityNote("");
    }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/admin/orders/${id}/files`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!res.ok) setMsg({ type: "error", text: data.error ?? "Upload failed" });
    else {
      setOrder(data);
      setMsg({ type: "success", text: "Design file uploaded" });
    }
  };

  if (loading || !order) {
    return (
      <AdminShell>
        <p className="text-white/45">Loading...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <Link href="/admin/orders" className="text-xs text-white/45 hover:text-white">
          ← Back to Orders
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-sm text-white/60">{order.customer.fullName}</p>
            <p className="text-xs text-white/45">
              From lead{" "}
              <Link href={`/admin/leads/${order.leadId}`} className="text-neon-pink hover:underline">
                {order.leadReference}
              </Link>
              · Created {formatDateTime(order.createdAt)}
            </p>
          </div>
          <AdminButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </AdminButton>
        </div>
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminCard title="Customer Details">
            <DetailRow label="Name" value={order.customer.fullName} />
            <DetailRow label="Email" value={order.customer.email} />
            <DetailRow label="Phone" value={order.customer.phone} />
            <DetailRow label="Company" value={order.customer.companyName} />
          </AdminCard>

          <AdminCard title="Project Specifications">
            <DetailRow label="Type" value={labelForProjectType(order.project.projectType)} />
            <DetailRow
              label="Dimensions"
              value={
                order.project.width && order.project.height
                  ? `${order.project.width} × ${order.project.height} cm`
                  : ""
              }
            />
            <DetailRow
              label="Environment"
              value={
                order.project.environment === "indoor"
                  ? "Indoor"
                  : order.project.environment === "outdoor"
                    ? "Outdoor"
                    : ""
              }
            />
            <DetailRow
              label="Color"
              value={
                order.project.colorType === "single-color"
                  ? "Single Color"
                  : order.project.colorType === "rgb"
                    ? "RGB Multi-Color"
                    : ""
              }
            />
            <DetailRow
              label="Options"
              value={[
                order.project.acrylicBacking && "Acrylic Backing",
                order.project.installationRequired && "Installation Required",
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <DetailRow label="Budget" value={labelForBudget(order.project.budgetRange)} />
            {order.project.message && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="mb-1 text-xs text-white/45">Message</p>
                <p className="text-sm leading-relaxed text-white/75">{order.project.message}</p>
              </div>
            )}
          </AdminCard>

          <AdminCard title="Design Files">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.pdf"
                className="hidden"
                onChange={uploadFile}
              />
              <AdminButton
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Design File"}
              </AdminButton>
            </div>
            {order.designFiles.length === 0 ? (
              <p className="text-sm text-white/45">No design files yet.</p>
            ) : (
              <div className="space-y-4">
                {order.designFiles.map((file) => {
                  const isImage = file.fileType.startsWith("image/");
                  const isPdf = file.fileType === "application/pdf";
                  return (
                    <div
                      key={file.id}
                      className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                    >
                      <p className="mb-2 text-xs text-white/45">{file.fileName}</p>
                      {isImage && (
                        <div className="relative aspect-video max-h-48 overflow-hidden rounded-lg border border-white/10 bg-black">
                          <Image
                            src={file.url}
                            alt={file.fileName}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                      {isPdf && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-neon-pink hover:underline"
                        >
                          View PDF →
                        </a>
                      )}
                      {!isImage && !isPdf && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-neon-pink hover:underline"
                        >
                          Download file →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </AdminCard>

          <AdminCard title="Order Timeline">
            <div className="mb-4 flex gap-2">
              <AdminInput
                placeholder="Add a note..."
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                className="flex-1"
              />
              <AdminButton variant="secondary" onClick={addNote}>
                Add
              </AdminButton>
            </div>
            <div className="space-y-0">
              {order.timeline.map((event) => (
                <div
                  key={event.id}
                  className="relative ml-2 border-l border-white/10 pb-4 pl-4"
                >
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-neon-blue/50 ring-2 ring-[#0d0d0d]" />
                  <p className="text-sm text-white/80">{event.message}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {formatDateTime(event.createdAt)}
                    {event.createdBy && ` · ${event.createdBy}`}
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Order Status">
            <AdminField label="Status">
              <AdminSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </AdminCard>

          <AdminCard title="Delivery Dates">
            <div className="space-y-3">
              <AdminField label="Estimated Delivery">
                <AdminInput
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                />
              </AdminField>
              <AdminField label="Actual Delivery">
                <AdminInput
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                />
              </AdminField>
            </div>
          </AdminCard>

          <AdminCard title="Quote">
            <div className="space-y-3">
              <AdminField label="Amount">
                <AdminInput
                  value={quotedAmount}
                  onChange={(e) => setQuotedAmount(e.target.value)}
                  placeholder="$0.00"
                />
              </AdminField>
              <AdminField label="Notes">
                <AdminTextarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Quote breakdown..."
                />
              </AdminField>
            </div>
          </AdminCard>

          <AdminCard title="Production Notes">
            <AdminTextarea
              value={productionNotes}
              onChange={(e) => setProductionNotes(e.target.value)}
              placeholder="Materials, fabrication details, QC notes..."
              className="min-h-[120px]"
            />
          </AdminCard>

          <AdminCard title="Internal Notes">
            <AdminTextarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Private team notes..."
              className="min-h-[120px]"
            />
          </AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
