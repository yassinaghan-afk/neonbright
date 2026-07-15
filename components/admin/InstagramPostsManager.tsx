"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { useDraftEditor } from "@/components/admin/useDraftEditor";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { createId } from "@/lib/cms/id";
import type { CMSInstagramPost } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(
  items: CMSInstagramPost[],
  from: number,
  to: number
): CMSInstagramPost[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

function emptyPost(sortOrder: number): CMSInstagramPost {
  const now = new Date().toISOString();
  return {
    id: createId("igp"),
    image: "",
    carouselImages: [],
    altText: undefined,
    caption: "",
    instagramUrl: "",
    enabled: true,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export function InstagramPostsManager() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSInstagramPost | null>(null);
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
  } = useDraftEditor<CMSInstagramPost>("/api/admin/instagram/posts");

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
    if (!confirm(`Supprimer ${selected.size} publication(s) ?`)) return;
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

  const saveAll = () => commit("/api/admin/instagram/posts", { items: draft });

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

  const openNew = () => setEditing(emptyPost(draft.length));
  const applyEdit = () => {
    if (!editing) return;
    if (!editing.image.trim()) {
      alert("Au moins une image est obligatoire.");
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
          <h2 className="font-display text-xl font-bold">Instagram Posts</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/45">
            Publications affichées sur la rangée du haut. Image obligatoire, carousel
            optionnel, tri par glisser-déposer.
          </p>
        </div>
        <AdminButton variant="primary" onClick={openNew}>
          Ajouter une publication
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
          Aucune publication. Ajoutez des posts pour alimenter le slider.
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
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                    Image
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">
                  {item.caption || "Sans légende"}
                </p>
                <p className="truncate text-xs text-white/35">
                  {item.instagramUrl || "URL Instagram non définie"}
                  {(item.carouselImages?.length ?? 0) > 0
                    ? ` · ${(item.carouselImages?.length ?? 0) + 1} image(s)`
                    : " · 1 image"}
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
              {draft.some((p) => p.id === editing.id)
                ? "Modifier la publication"
                : "Nouvelle publication"}
            </h3>
            <div className="mt-4 space-y-4">
              <GalleryUploadField
                label="Images de la publication"
                value={[editing.image, ...(editing.carouselImages ?? [])].filter(Boolean)}
                onChange={(urls) =>
                  setEditing({
                    ...editing,
                    image: urls[0] ?? "",
                    carouselImages: urls.slice(1),
                  })
                }
                hint="La première image devient la miniature. Sélection multiple, glisser-déposer pour réordonner."
              />
              <AdminField label="Texte alternatif (accessibilité)">
                <AdminInput
                  value={editing.altText ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, altText: e.target.value || undefined })
                  }
                  placeholder="Optionnel — décrit l'image pour les lecteurs d'écran"
                />
              </AdminField>
              <AdminField label="Légende">
                <AdminTextarea
                  value={editing.caption}
                  onChange={(e) =>
                    setEditing({ ...editing, caption: e.target.value })
                  }
                  className="min-h-[88px]"
                />
              </AdminField>
              <AdminField label="URL Instagram" required>
                <AdminInput
                  value={editing.instagramUrl}
                  onChange={(e) =>
                    setEditing({ ...editing, instagramUrl: e.target.value })
                  }
                  placeholder="https://www.instagram.com/p/..."
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
