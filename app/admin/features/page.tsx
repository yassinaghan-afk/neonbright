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
import type { CMSFeature } from "@/lib/cms/types";

export default function AdminFeaturesPage() {
  const [items, setItems] = useState<CMSFeature[]>([]);
  const [editing, setEditing] = useState<Partial<CMSFeature> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () =>
    fetch("/api/admin/features")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data.sort((a, b) => a.sortOrder - b.sortOrder));
      });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.title?.trim()) {
      setMsg({ type: "error", text: "Le titre est requis." });
      return;
    }
    setMsg(null);
    const result = isNew
      ? await adminFetch("/api/admin/features", { method: "POST", body: JSON.stringify(editing) })
      : await adminFetch(`/api/admin/features/${editing.id}`, {
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
    if (!confirm("Supprimer cet avantage ?")) return;
    await adminFetch(`/api/admin/features/${id}`, { method: "DELETE" });
    load();
  };

  const toggleEnabled = async (item: CMSFeature) => {
    await adminFetch(`/api/admin/features/${item.id}`, {
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
    await adminFetch("/api/admin/features", { method: "PUT", body: JSON.stringify(withOrder) });
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Avantages & Services</h1>
          <p className="mt-1 text-sm text-white/45">
            Gérez les avantages affichés dans la section &quot;Pourquoi nous choisir&quot;.
          </p>
        </div>
        <AdminButton
          variant="primary"
          onClick={() => {
            setEditing({ title: "", description: "", icon: "✦", enabled: true });
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <AdminCard
            key={item.id}
            title={`${item.icon} ${item.title}`}
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
            <p className="text-sm text-white/55 line-clamp-2">{item.description}</p>
          </AdminCard>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">
              {isNew ? "Nouvel avantage" : "Modifier"}
            </h2>
            <div className="space-y-3">
              <AdminField label="Icône">
                <AdminInput value={editing.icon ?? "✦"} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="✦" />
              </AdminField>
              <AdminField label="Titre" required>
                <AdminInput value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </AdminField>
              <AdminField label="Description">
                <AdminTextarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </AdminField>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="feat-enabled" checked={editing.enabled !== false} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="h-4 w-4" />
                <label htmlFor="feat-enabled" className="text-sm text-white/70">Visible</label>
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
