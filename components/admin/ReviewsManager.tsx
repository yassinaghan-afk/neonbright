"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { useDraftEditor } from "@/components/admin/useDraftEditor";
import { AdminButton } from "@/components/admin/ui/AdminForm";
import { createId } from "@/lib/cms/id";
import { emptyReview } from "@/lib/cms/reviews";
import type { CMSReview } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(items: CMSReview[], from: number, to: number): CMSReview[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

export function ReviewsManager() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSReview | null>(null);
  const dragHandleRef = useRef<number | null>(null);

  const { draft, setDraft, dirty, loading, saving, error, success, cancel, commit } =
    useDraftEditor<CMSReview>("/api/admin/reviews");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} avis ?`)) return;
    setDraft(
      draft
        .filter((item) => !selected.has(item.id))
        .map((item, i) => ({ ...item, sortOrder: i }))
    );
    setSelected(new Set());
  };

  const toggleEnabled = (id: string) => {
    setDraft(draft.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  const duplicate = (review: CMSReview) => {
    const copy: CMSReview = { ...review, id: createId("rev"), sortOrder: draft.length };
    setDraft([...draft, copy]);
  };

  const saveAll = () => commit("/api/admin/reviews", { items: draft });

  const onDragStart = (index: number) => {
    dragHandleRef.current = index;
    setDragIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragHandleRef.current;
    if (from === null || from === index) return;
    setDraft(reorderDraft(draft, from, index));
    dragHandleRef.current = index;
    setDragIndex(index);
  };

  const onDragEnd = () => {
    dragHandleRef.current = null;
    setDragIndex(null);
  };

  const openNew = () => setEditing(emptyReview(draft.length));

  const applyEdit = () => {
    if (!editing) return;
    if (editing.screenshots.length === 0) {
      alert("Ajoutez au moins une capture d'écran.");
      return;
    }
    const exists = draft.some((item) => item.id === editing.id);
    if (exists) {
      setDraft(draft.map((item) => (item.id === editing.id ? editing : item)));
    } else {
      setDraft([...draft, editing]);
    }
    setEditing(null);
  };

  if (loading) {
    return <p className="text-sm text-white/45">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Avis Clients</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/45">
            Captures d&apos;écran d&apos;avis affichées dans le défilement de la page
            d&apos;accueil. Glisser-déposer pour réordonner.
          </p>
        </div>
        <AdminButton variant="primary" onClick={openNew}>
          Ajouter un avis
        </AdminButton>
      </div>

      <AdminDraftToolbar
        dirty={dirty}
        saving={saving}
        error={error}
        success={success}
        onSave={saveAll}
        onCancel={cancel}
      />

      {selected.size > 0 && (
        <AdminButton variant="ghost" onClick={deleteSelected}>
          Supprimer ({selected.size})
        </AdminButton>
      )}

      {draft.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-white/35">
          Aucun avis. Ajoutez des captures d&apos;écran pour alimenter la section.
        </p>
      ) : (
        <div className="space-y-2">
          {draft.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d0d0d] p-3 transition-opacity",
                !item.enabled && "opacity-45",
                dragIndex === index && "ring-1 ring-neon-pink/50"
              )}
            >
              <span className="cursor-grab select-none text-white/25 active:cursor-grabbing">
                ⠿
              </span>
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleSelect(item.id)}
              />
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10">
                {item.screenshots[0] ? (
                  <Image
                    src={item.screenshots[0]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                    Capture
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">
                  Avis #{index + 1}
                </p>
                <p className="truncate text-xs text-white/35">
                  {item.screenshots.length} capture{item.screenshots.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="text-xs text-neon-pink hover:underline"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => duplicate(item)}
                  className="text-xs text-neon-purple hover:underline"
                >
                  Dupliquer
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(item.id)}
                  className="text-xs text-white/45 hover:text-white"
                >
                  {item.enabled ? "Masquer" : "Activer"}
                </button>
                <span className="text-xs text-white/25">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d0d] p-5">
            <h3 className="font-display text-lg font-semibold">
              {draft.some((p) => p.id === editing.id) ? "Modifier l'avis" : "Nouvel avis"}
            </h3>
            <div className="mt-4 space-y-4">
              <GalleryUploadField
                label="Captures d'écran"
                value={editing.screenshots}
                onChange={(urls) => setEditing({ ...editing, screenshots: urls })}
                hint="Téléversez une ou plusieurs captures. La première est affichée comme miniature."
              />
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                />
                Actif (visible sur le site)
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </AdminButton>
              <AdminButton variant="primary" onClick={applyEdit}>
                Appliquer
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
