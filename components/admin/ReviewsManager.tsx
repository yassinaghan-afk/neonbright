"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useDraftEditor } from "@/components/admin/useDraftEditor";
import { AdminButton } from "@/components/admin/ui/AdminForm";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { createId } from "@/lib/cms/id";
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const dragHandleRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!confirm(`Supprimer ${selected.size} capture(s) ?`)) return;
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

  const moveItem = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= draft.length) return;
    setDraft(reorderDraft(draft, index, to));
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

  const uploadMany = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/")).slice(0, 40);
    if (!images.length) return;
    setUploading(true);
    setUploadError("");
    try {
      const added: CMSReview[] = [];
      for (const file of images) {
        const result = await uploadAdminFile(file, { preset: "gallery" });
        added.push({
          id: createId("rev"),
          image: result.url,
          enabled: true,
          sortOrder: draft.length + added.length,
        });
      }
      setDraft([...draft, ...added].map((item, i) => ({ ...item, sortOrder: i })));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openReplace = (item: CMSReview) => setEditing({ ...item });

  const applyReplace = () => {
    if (!editing) return;
    if (!editing.image.trim()) {
      alert("Une image est obligatoire.");
      return;
    }
    setDraft(draft.map((item) => (item.id === editing.id ? editing : item)));
    setEditing(null);
  };

  if (loading) {
    return <p className="text-sm text-white/45">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Reviews</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/45">
            Galerie de captures d&apos;écran. Upload multiple, réordonner, publier /
            masquer, enregistrer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Upload..." : "Ajouter des captures"}
          </AdminButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) void uploadMany(files);
            }}
          />
        </div>
      </div>

      <AdminDraftToolbar
        dirty={dirty}
        saving={saving}
        error={error || uploadError}
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
          Aucune capture. Ajoutez des images pour alimenter la section.
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
                  Capture #{index + 1}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="text-xs text-white/45 hover:text-white disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === draft.length - 1}
                  className="text-xs text-white/45 hover:text-white disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => openReplace(item)}
                  className="text-xs text-neon-pink hover:underline"
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(item.id)}
                  className="text-xs text-white/45 hover:text-white"
                >
                  {item.enabled ? "Masquer" : "Publier"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("Supprimer cette capture ?")) return;
                    setDraft(
                      draft
                        .filter((r) => r.id !== item.id)
                        .map((r, i) => ({ ...r, sortOrder: i }))
                    );
                  }}
                  className="text-xs text-red-300/80 hover:text-red-300"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0d0d0d] p-5">
            <h3 className="font-display text-lg font-semibold">Remplacer la capture</h3>
            <div className="mt-4 space-y-4">
              <ImageUploadField
                label="Capture d'écran"
                value={editing.image}
                onChange={(url) => setEditing({ ...editing, image: url })}
                preset="gallery"
              />
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                />
                Publié (visible sur le site)
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </AdminButton>
              <AdminButton variant="primary" onClick={applyReplace}>
                Appliquer
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
