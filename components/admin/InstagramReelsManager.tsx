"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { AdminVideoUploadField } from "@/components/admin/AdminVideoUploadField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useDraftEditor } from "@/components/admin/useDraftEditor";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { createId } from "@/lib/cms/id";
import type { CMSInstagramReel } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(
  items: CMSInstagramReel[],
  from: number,
  to: number
): CMSInstagramReel[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

function emptyReel(sortOrder: number): CMSInstagramReel {
  return {
    id: createId("igr"),
    videoUrl: "",
    thumbnail: "",
    caption: "",
    instagramUrl: "",
    enabled: true,
    sortOrder,
  };
}

export function InstagramReelsManager() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSInstagramReel | null>(null);
  const dragHandleRef = useRef<number | null>(null);

  const {
    draft,
    setDraft,
    dirty,
    loading,
    saving,
    error,
    success,
    cancel,
    commit,
  } = useDraftEditor<CMSInstagramReel>("/api/admin/instagram/reels");

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
    if (!confirm(`Supprimer ${selected.size} reel(s) ?`)) return;
    setDraft(
      draft
        .filter((item) => !selected.has(item.id))
        .map((item, i) => ({ ...item, sortOrder: i }))
    );
    setSelected(new Set());
  };

  const toggleEnabled = (id: string) => {
    setDraft(
      draft.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const saveAll = () => commit("/api/admin/instagram/reels", { items: draft });

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

  const openNew = () => setEditing(emptyReel(draft.length));

  const applyEdit = () => {
    if (!editing) return;
    if (!editing.videoUrl.trim()) {
      alert("La vidéo est obligatoire.");
      return;
    }
    if (!editing.thumbnail.trim()) {
      alert("La miniature est obligatoire.");
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
          <h2 className="font-display text-xl font-bold">Instagram Reels</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/45">
            Reels affichés sur la rangée du bas. Uploadez la vidéo (MP4, MOV,
            WEBM) et une miniature. Tri par glisser-déposer.
          </p>
        </div>
        <AdminButton variant="primary" onClick={openNew}>
          Ajouter un reel
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
          Aucun reel. Ajoutez des reels pour alimenter le slider.
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
                dragIndex === index && "ring-1 ring-neon-purple/50"
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
              <div className="relative h-20 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                    Mini
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">
                  {item.caption || "Sans légende"}
                </p>
                <p className="truncate text-xs text-white/35">
                  {item.instagramUrl || "URL Reel non définie"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="text-xs text-neon-purple hover:underline"
                >
                  Modifier
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
              {draft.some((r) => r.id === editing.id)
                ? "Modifier le reel"
                : "Nouveau reel"}
            </h3>
            <div className="mt-4 space-y-4">
              <AdminVideoUploadField
                label="Vidéo"
                value={editing.videoUrl}
                onChange={(url) => setEditing({ ...editing, videoUrl: url })}
                hint="MP4, MOV ou WEBM — prévisualisation après upload"
              />
              <ImageUploadField
                label="Miniature"
                value={editing.thumbnail}
                onChange={(url) => setEditing({ ...editing, thumbnail: url })}
                preset="thumbnail"
              />
              <AdminField label="Légende">
                <AdminTextarea
                  value={editing.caption}
                  onChange={(e) =>
                    setEditing({ ...editing, caption: e.target.value })
                  }
                  className="min-h-[88px]"
                />
              </AdminField>
              <AdminField label="URL Reel Instagram" required>
                <AdminInput
                  value={editing.instagramUrl}
                  onChange={(e) =>
                    setEditing({ ...editing, instagramUrl: e.target.value })
                  }
                  placeholder="https://www.instagram.com/reel/..."
                  type="url"
                />
              </AdminField>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) =>
                    setEditing({ ...editing, enabled: e.target.checked })
                  }
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
