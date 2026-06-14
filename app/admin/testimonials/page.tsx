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
import type { CMSTestimonial } from "@/lib/cms/types";

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<CMSTestimonial[]>([]);
  const [editing, setEditing] = useState<Partial<CMSTestimonial> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () => fetch("/api/admin/testimonials").then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.quote || !editing?.author) return;
    setMsg(null);
    const result = isNew
      ? await adminFetch("/api/admin/testimonials", { method: "POST", body: JSON.stringify(editing) })
      : await adminFetch(`/api/admin/testimonials/${editing.id}`, { method: "PUT", body: JSON.stringify(editing) });
    if (result.error) setMsg({ type: "error", text: result.error });
    else { setMsg({ type: "success", text: "Saved" }); setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await adminFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Testimonials</h1>
        <AdminButton variant="primary" onClick={() => { setEditing({ quote: "", author: "", role: "", location: "" }); setIsNew(true); }}>+ Add</AdminButton>
      </div>
      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}
      <div className="space-y-3">
        {items.map((t) => (
          <AdminCard key={t.id} title={t.author} actions={
            <div className="flex gap-1">
              <AdminButton variant="ghost" className="text-xs" onClick={() => { setEditing(t); setIsNew(false); }}>Edit</AdminButton>
              <AdminButton variant="ghost" className="text-xs text-red-400" onClick={() => remove(t.id)}>Delete</AdminButton>
            </div>
          }>
            <p className="text-sm text-white/60 italic">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-2 text-xs text-white/40">{t.role} · {t.location}</p>
          </AdminCard>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-semibold">{isNew ? "New Testimonial" : "Edit"}</h2>
            <div className="space-y-3">
              <AdminField label="Quote" required><AdminTextarea value={editing.quote ?? ""} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} /></AdminField>
              <AdminField label="Author" required><AdminInput value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></AdminField>
              <AdminField label="Role"><AdminInput value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} /></AdminField>
              <AdminField label="Location"><AdminInput value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></AdminField>
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
