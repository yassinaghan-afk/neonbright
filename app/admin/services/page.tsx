"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import type { CMSService } from "@/lib/cms/types";

export default function AdminServicesPage() {
  const [items, setItems] = useState<CMSService[]>([]);
  const [editing, setEditing] = useState<Partial<CMSService> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () => fetch("/api/admin/services").then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title) return;
    setMsg(null);
    const result = isNew
      ? await adminFetch("/api/admin/services", { method: "POST", body: JSON.stringify(editing) })
      : await adminFetch(`/api/admin/services/${editing.id}`, { method: "PUT", body: JSON.stringify(editing) });
    if (result.error) setMsg({ type: "error", text: result.error });
    else { setMsg({ type: "success", text: "Saved" }); setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await adminFetch(`/api/admin/services/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Services</h1>
        <AdminButton variant="primary" onClick={() => { setEditing({ title: "", description: "", icon: "✦" }); setIsNew(true); }}>+ Add Service</AdminButton>
      </div>
      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((s) => (
          <AdminCard key={s.id} title={`${s.icon} ${s.title}`} actions={
            <div className="flex gap-1">
              <AdminButton variant="ghost" className="text-xs" onClick={() => { setEditing(s); setIsNew(false); }}>Edit</AdminButton>
              <AdminButton variant="ghost" className="text-xs text-red-400" onClick={() => remove(s.id)}>Delete</AdminButton>
            </div>
          }>
            <p className="text-sm text-white/55">{s.description}</p>
          </AdminCard>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <div className="space-y-3">
              <AdminField label="Icon"><AdminInput value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="✦" /></AdminField>
              <AdminField label="Title" required><AdminInput value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></AdminField>
              <AdminField label="Description"><AdminTextarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></AdminField>
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
