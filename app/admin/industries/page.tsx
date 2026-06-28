"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import type { CMSIndustry } from "@/lib/cms/types";

export default function AdminIndustriesPage() {
  const [items, setItems] = useState<CMSIndustry[]>([]);
  const [editing, setEditing] = useState<Partial<CMSIndustry> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () =>
    fetch("/api/admin/industries")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data.sort((a, b) => a.sortOrder - b.sortOrder));
      });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.name?.trim()) {
      setMsg({ type: "error", text: "Le nom est requis." });
      return;
    }
    setMsg(null);
    const result = isNew
      ? await adminFetch("/api/admin/industries", { method: "POST", body: JSON.stringify(editing) })
      : await adminFetch(`/api/admin/industries/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(editing),
        });
    if (result.error) setMsg({ type: "error", text: result.error });
    else {
      setMsg({ type: "success", text: "Enregistré." });
      setEditing(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce secteur ?")) return;
    await adminFetch(`/api/admin/industries/${id}`, { method: "DELETE" });
    load();
  };

  const toggleEnabled = async (item: CMSIndustry) => {
    await adminFetch(`/api/admin/industries/${item.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...item, enabled: !item.enabled }),
    });
    load();
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const reordered = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reordered.length) return;
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const withOrder = reordered.map((item, i) => ({ ...item, sortOrder: i }));
    setItems(withOrder);
    await adminFetch("/api/admin/industries", { method: "PUT", body: JSON.stringify(withOrder) });
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Secteurs</h1>
          <p className="mt-1 text-sm text-white/45">Gérez les secteurs affichés sur le site.</p>
        </div>
        <AdminButton
          variant="primary"
          onClick={() => {
            setEditing({ name: "", icon: "✨", enabled: true });
            setIsNew(true);
          }}
        >
          + Ajouter
        </AdminButton>
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <AdminCard
            key={item.id}
            title={`${item.icon} ${item.name}`}
            actions={
              <div className="flex gap-1">
                <AdminButton variant="ghost" className="text-xs px-2" onClick={() => moveItem(index, "up")} disabled={index === 0}>↑</AdminButton>
                <AdminButton variant="ghost" className="text-xs px-2" onClick={() => moveItem(index, "down")} disabled={index === items.length - 1}>↓</AdminButton>
                <AdminButton variant="ghost" className={`text-xs ${item.enabled ? "text-green-400" : "text-white/30"}`} onClick={() => toggleEnabled(item)}>
                  {item.enabled ? "✓" : "○"}
                </AdminButton>
                <AdminButton variant="ghost" className="text-xs" onClick={() => { setEditing(item); setIsNew(false); }}>Éditer</AdminButton>
                <AdminButton variant="ghost" className="text-xs text-red-400" onClick={() => remove(item.id)}>Suppr.</AdminButton>
              </div>
            }
          >
            <p className="text-xs text-white/30">{item.enabled ? "Visible" : "Masqué"}</p>
          </AdminCard>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">
              {isNew ? "Nouveau secteur" : "Modifier"}
            </h2>
            <div className="space-y-3">
              <AdminField label="Icône (emoji)">
                <AdminInput value={editing.icon ?? "✨"} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="✨" />
              </AdminField>
              <AdminField label="Nom" required>
                <AdminInput value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </AdminField>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ind-enabled" checked={editing.enabled !== false} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="h-4 w-4" />
                <label htmlFor="ind-enabled" className="text-sm text-white/70">Visible</label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>Annuler</AdminButton>
              <AdminButton variant="primary" onClick={save}>Enregistrer</AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
