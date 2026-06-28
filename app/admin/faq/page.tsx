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
import type { CMSFAQItem } from "@/lib/cms/types";

export default function AdminFAQPage() {
  const [items, setItems] = useState<CMSFAQItem[]>([]);
  const [editing, setEditing] = useState<Partial<CMSFAQItem> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () =>
    fetch("/api/admin/faq")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data.sort((a, b) => a.sortOrder - b.sortOrder));
      });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.question?.trim() || !editing?.answer?.trim()) {
      setMsg({ type: "error", text: "Question et réponse sont requises." });
      return;
    }
    setMsg(null);
    const result = isNew
      ? await adminFetch("/api/admin/faq", { method: "POST", body: JSON.stringify(editing) })
      : await adminFetch(`/api/admin/faq/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(editing),
        });
    if (result.error) setMsg({ type: "error", text: result.error });
    else {
      setMsg({ type: "success", text: "Enregistré avec succès." });
      setEditing(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    await adminFetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    load();
  };

  const toggleEnabled = async (item: CMSFAQItem) => {
    await adminFetch(`/api/admin/faq/${item.id}`, {
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
    await adminFetch("/api/admin/faq", { method: "PUT", body: JSON.stringify(withOrder) });
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">FAQ</h1>
          <p className="mt-1 text-sm text-white/45">Gérez les questions fréquentes de votre site.</p>
        </div>
        <AdminButton
          variant="primary"
          onClick={() => {
            setEditing({ question: "", answer: "", enabled: true });
            setIsNew(true);
          }}
        >
          + Ajouter une question
        </AdminButton>
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <AdminCard
            key={item.id}
            title={item.question}
            actions={
              <div className="flex items-center gap-1">
                <AdminButton
                  variant="ghost"
                  className="text-xs px-2"
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                >
                  ↑
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  className="text-xs px-2"
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                >
                  ↓
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  className={`text-xs ${item.enabled ? "text-green-400" : "text-white/30"}`}
                  onClick={() => toggleEnabled(item)}
                >
                  {item.enabled ? "Visible" : "Masqué"}
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    setEditing(item);
                    setIsNew(false);
                  }}
                >
                  Éditer
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  className="text-xs text-red-400"
                  onClick={() => remove(item.id)}
                >
                  Supprimer
                </AdminButton>
              </div>
            }
          >
            <p className="text-sm text-white/55 line-clamp-2">{item.answer}</p>
          </AdminCard>
        ))}

        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-white/30">
            Aucune question. Cliquez sur &quot;Ajouter&quot; pour commencer.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">
              {isNew ? "Nouvelle question" : "Modifier la question"}
            </h2>
            <div className="space-y-4">
              <AdminField label="Question" required>
                <AdminInput
                  value={editing.question ?? ""}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  placeholder="Quels sont vos délais de production ?"
                />
              </AdminField>
              <AdminField label="Réponse" required>
                <AdminTextarea
                  value={editing.answer ?? ""}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                  placeholder="Votre réponse détaillée..."
                  className="min-h-[120px]"
                />
              </AdminField>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="faq-enabled"
                  checked={editing.enabled !== false}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />
                <label htmlFor="faq-enabled" className="text-sm text-white/70">
                  Visible sur le site
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </AdminButton>
              <AdminButton variant="primary" onClick={save}>
                Enregistrer
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
