"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { uploadMediaFiles, useDraftEditor } from "@/components/admin/useDraftEditor";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
} from "@/components/admin/ui/AdminForm";
import { createId } from "@/lib/cms/id";
import type { CMSInstagramMediaItem } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(
  items: CMSInstagramMediaItem[],
  from: number,
  to: number
): CMSInstagramMediaItem[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

type Props = {
  title: string;
  description: string;
  fetchUrl: string;
  saveUrl: string;
  kind: "post" | "reel";
};

export function InstagramItemsManager({
  title,
  description,
  fetchUrl,
  saveUrl,
  kind,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSInstagramMediaItem | null>(null);

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
  } = useDraftEditor<CMSInstagramMediaItem>(fetchUrl);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onFilesPicked = (files: FileList | null) => {
    if (!files?.length) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const uploadPending = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles(pendingFiles, "gallery");
      const newItems: CMSInstagramMediaItem[] = uploaded.map((u, i) => ({
        id: createId("ig"),
        thumbnail: u.url,
        url: "",
        alt: kind === "reel" ? `Instagram Reel — ${u.label}` : `Instagram Post — ${u.label}`,
        enabled: true,
        sortOrder: draft.length + i,
      }));
      setDraft([...draft, ...newItems]);
      setPendingFiles([]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload échoué");
    } finally {
      setUploading(false);
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} élément(s) ?`)) return;
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

  const saveAll = () => commit(saveUrl, { items: draft });

  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDraft(reorderDraft(draft, dragIndex, index));
    setDragIndex(index);
  };
  const onDragEnd = () => setDragIndex(null);

  const applyEdit = () => {
    if (!editing) return;
    setDraft(draft.map((item) => (item.id === editing.id ? editing : item)));
    setEditing(null);
  };

  if (loading) {
    return <p className="text-sm text-white/45">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>

      <AdminDraftToolbar
        dirty={dirty}
        saving={saving}
        error={error}
        success={success}
        onSave={saveAll}
        onCancel={cancel}
      />

      <AdminCard title="Ajouter des miniatures">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFilesPicked(e.target.files)}
          />
          <AdminButton variant="secondary" onClick={() => fileRef.current?.click()}>
            Choisir des images
          </AdminButton>
          {pendingFiles.length > 0 && (
            <>
              <span className="text-xs text-white/45">
                {pendingFiles.length} fichier(s) en attente
              </span>
              <AdminButton variant="primary" onClick={uploadPending} disabled={uploading}>
                {uploading ? "Upload..." : "Uploader"}
              </AdminButton>
            </>
          )}
          {selected.size > 0 && (
            <AdminButton variant="ghost" onClick={deleteSelected}>
              Supprimer ({selected.size})
            </AdminButton>
          )}
        </div>
      </AdminCard>

      {draft.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-white/35">
          Aucun élément. Uploadez des miniatures pour alimenter le marquee.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {draft.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "rounded-xl border border-white/10 bg-[#0d0d0d] p-3 transition-opacity",
                !item.enabled && "opacity-45",
                dragIndex === index && "ring-1 ring-neon-pink/50"
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1"
                />
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                      Pas d&apos;image
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-xs font-medium text-white/70">
                    {item.alt || "Sans titre"}
                  </p>
                  <p className="truncate text-[10px] text-white/35">
                    {item.url || "URL Instagram non définie"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="text-[10px] text-neon-pink hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleEnabled(item.id)}
                      className="text-[10px] text-white/45 hover:text-white"
                    >
                      {item.enabled ? "Masquer" : "Afficher"}
                    </button>
                    <span className="text-[10px] text-white/25">#{index + 1}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0d0d0d] p-5">
            <h3 className="font-display text-lg font-semibold">Modifier l&apos;élément</h3>
            <div className="mt-4 space-y-3">
              <ImageUploadField
                label="Miniature"
                value={editing.thumbnail}
                onChange={(url) => setEditing({ ...editing, thumbnail: url })}
                preset="gallery"
              />
              <AdminField label="URL Instagram" required>
                <AdminInput
                  value={editing.url}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  placeholder={
                    kind === "reel"
                      ? "https://www.instagram.com/reel/..."
                      : "https://www.instagram.com/p/..."
                  }
                />
              </AdminField>
              <AdminField label="Texte alternatif">
                <AdminInput
                  value={editing.alt}
                  onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
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
                Visible sur le site
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
