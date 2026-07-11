"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useDraftEditor } from "@/components/admin/useDraftEditor";
import { AdminButton } from "@/components/admin/ui/AdminForm";
import { uploadAdminFile, uploadAdminFiles } from "@/lib/admin/upload-client";
import { createId } from "@/lib/cms/id";
import type { CMSReview } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(items: CMSReview[], from: number, to: number): CMSReview[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

function withSortOrder(items: CMSReview[]): CMSReview[] {
  return items.map((item, i) => ({ ...item, sortOrder: i }));
}

export function ReviewsManager() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSReview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [persisting, setPersisting] = useState(false);
  const dragHandleRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Always hold latest draft for async upload/delete so we never clobber concurrent edits.
  const draftRef = useRef<CMSReview[]>([]);

  const { draft, setDraft, dirty, loading, saving, error, success, cancel, commit } =
    useDraftEditor<CMSReview>("/api/admin/reviews");

  draftRef.current = draft;

  const persist = async (items: CMSReview[]): Promise<boolean> => {
    setPersisting(true);
    try {
      return await commit("/api/admin/reviews", { items: withSortOrder(items) });
    } finally {
      setPersisting(false);
    }
  };

  const updateDraft = (next: CMSReview[]) => {
    const ordered = withSortOrder(next);
    draftRef.current = ordered;
    setDraft(ordered);
    return ordered;
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0 || persisting || saving) return;
    if (!confirm(`Supprimer ${selected.size} capture(s) ?`)) return;
    const next = updateDraft(draftRef.current.filter((item) => !selected.has(item.id)));
    setSelected(new Set());
    await persist(next);
  };

  const deleteOne = async (id: string) => {
    if (persisting || saving) return;
    if (!confirm("Supprimer cette capture ?")) return;
    const next = updateDraft(draftRef.current.filter((r) => r.id !== id));
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    await persist(next);
  };

  const toggleEnabled = async (id: string) => {
    if (persisting || saving) return;
    const next = updateDraft(
      draftRef.current.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
    await persist(next);
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    if (persisting || saving) return;
    const to = index + dir;
    if (to < 0 || to >= draftRef.current.length) return;
    const next = updateDraft(reorderDraft(draftRef.current, index, to));
    await persist(next);
  };

  const saveAll = () => persist(draftRef.current);

  const onDragStart = (index: number) => {
    dragHandleRef.current = index;
    setDragIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragHandleRef.current;
    if (from === null || from === index) return;
    updateDraft(reorderDraft(draftRef.current, from, index));
    dragHandleRef.current = index;
    setDragIndex(index);
  };

  const onDragEnd = async () => {
    dragHandleRef.current = null;
    setDragIndex(null);
    if (persisting || saving) return;
    await persist(draftRef.current);
  };

  const uploadMany = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/")).slice(0, 40);
    if (!images.length) return;
    setUploading(true);
    setUploadError("");
    const added: CMSReview[] = [];
    try {
      // Prefer one multi-upload request; fall back to sequential singles.
      try {
        const results = await uploadAdminFiles(images, "gallery");
        for (const result of results) {
          if (!result.url) continue;
          added.push({
            id: createId("rev"),
            image: result.url,
            enabled: true,
            sortOrder: 0,
          });
        }
      } catch {
        for (const file of images) {
          try {
            const result = await uploadAdminFile(file, { preset: "gallery" });
            added.push({
              id: createId("rev"),
              image: result.url,
              enabled: true,
              sortOrder: 0,
            });
          } catch (err) {
            setUploadError(
              err instanceof Error ? err.message : "Erreur upload (partiel)"
            );
          }
        }
      }

      if (added.length === 0) {
        setUploadError((prev) => prev || "Aucune image n'a pu être téléversée");
        return;
      }

      // Functional merge against latest draft — never overwrite concurrent deletes.
      const next = updateDraft([...draftRef.current, ...added]);
      await persist(next);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur upload");
      if (added.length > 0) {
        const next = updateDraft([...draftRef.current, ...added]);
        await persist(next);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openReplace = (item: CMSReview) => setEditing({ ...item });

  const applyReplace = async () => {
    if (!editing || persisting || saving) return;
    if (!editing.image.trim()) {
      alert("Une image est obligatoire.");
      return;
    }
    const next = updateDraft(
      draftRef.current.map((item) => (item.id === editing.id ? editing : item))
    );
    setEditing(null);
    await persist(next);
  };

  if (loading) {
    return <p className="text-sm text-white/45">Chargement...</p>;
  }

  const busy = saving || persisting || uploading;

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
            disabled={busy}
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
        saving={busy}
        error={error || uploadError}
        success={success}
        onSave={saveAll}
        onCancel={cancel}
      />

      {selected.size > 0 && (
        <AdminButton variant="ghost" onClick={() => void deleteSelected()} disabled={busy}>
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
              draggable={!busy}
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={() => void onDragEnd()}
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
                disabled={busy}
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
                  onClick={() => void moveItem(index, -1)}
                  disabled={busy || index === 0}
                  className="text-xs text-white/45 hover:text-white disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => void moveItem(index, 1)}
                  disabled={busy || index === draft.length - 1}
                  className="text-xs text-white/45 hover:text-white disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => openReplace(item)}
                  disabled={busy}
                  className="text-xs text-neon-pink hover:underline disabled:opacity-30"
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={() => void toggleEnabled(item.id)}
                  disabled={busy}
                  className="text-xs text-white/45 hover:text-white disabled:opacity-30"
                >
                  {item.enabled ? "Masquer" : "Publier"}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteOne(item.id)}
                  disabled={busy}
                  className="text-xs text-red-300/80 hover:text-red-300 disabled:opacity-30"
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
              <AdminButton variant="primary" onClick={() => void applyReplace()} disabled={busy}>
                Appliquer
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
