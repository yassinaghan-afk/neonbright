"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import type { CMSPartner } from "@/lib/cms/types";

export default function AdminPartnersPage() {
  const [items, setItems] = useState<CMSPartner[]>([]);
  const [editing, setEditing] = useState<Partial<CMSPartner> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () => fetch("/api/admin/partners").then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name) return;
    setMsg(null);
    const result = isNew
      ? await adminFetch("/api/admin/partners", { method: "POST", body: JSON.stringify(editing) })
      : await adminFetch(`/api/admin/partners/${editing.id}`, { method: "PUT", body: JSON.stringify(editing) });
    if (result.error) setMsg({ type: "error", text: result.error });
    else { setMsg({ type: "success", text: "Saved" }); setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await adminFetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Partners & Client Logos</h1>
          <p className="text-sm text-white/45">Trust strip logos on homepage hero</p>
        </div>
        <AdminButton variant="primary" onClick={() => { setEditing({ name: "", logoUrl: "" }); setIsNew(true); }}>+ Add Partner</AdminButton>
      </div>
      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <AdminCard key={p.id} title={p.name} actions={
            <div className="flex gap-1">
              <AdminButton variant="ghost" className="text-xs" onClick={() => { setEditing(p); setIsNew(false); }}>Edit</AdminButton>
              <AdminButton variant="ghost" className="text-xs text-red-400" onClick={() => remove(p.id)}>Delete</AdminButton>
            </div>
          }>
            {p.logoUrl ? (
              <div className="relative h-12 w-24"><Image src={p.logoUrl} alt={p.name} fill className="object-contain" unoptimized /></div>
            ) : (
              <p className="text-xs text-white/35">Text-only (no logo uploaded)</p>
            )}
          </AdminCard>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-semibold">{isNew ? "New Partner" : "Edit Partner"}</h2>
            <div className="space-y-4">
              <AdminField label="Name" required><AdminInput value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></AdminField>
              <ImageUploadField label="Logo" value={editing.logoUrl ?? ""} onChange={(url) => setEditing({ ...editing, logoUrl: url })} hint="Optional — leave empty for text-only display" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>Cancel</AdminButton>
              <AdminButton variant="primary" onClick={save}>Save</AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
