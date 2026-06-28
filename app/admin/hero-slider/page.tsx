"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { uploadMediaFiles, useDraftEditor } from "@/components/admin/useDraftEditor";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { createId } from "@/lib/cms/id";
import type { CMSHeroSlide } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(items: CMSHeroSlide[], from: number, to: number): CMSHeroSlide[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((s, i) => ({ ...s, sortOrder: i }));
}

export default function AdminHeroSliderPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<CMSHeroSlide | null>(null);
  const [editing, setEditing] = useState<CMSHeroSlide | null>(null);

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
  } = useDraftEditor<CMSHeroSlide>("/api/admin/hero-slider");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === draft.length) setSelected(new Set());
    else setSelected(new Set(draft.map((s) => s.id)));
  };

  const onFilesPicked = (files: FileList | null) => {
    if (!files?.length) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const uploadPending = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles(pendingFiles, "hero");
      const newSlides: CMSHeroSlide[] = uploaded.map((u, i) => ({
        id: createId("slide"),
        src: u.url,
        alt: `Néon LED — ${u.label}`,
        enabled: true,
        sortOrder: draft.length + i,
      }));
      setDraft([...draft, ...newSlides]);
      setPendingFiles([]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload échoué");
    } finally {
      setUploading(false);
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} image(s) du brouillon ?`)) return;
    setDraft(draft.filter((s) => !selected.has(s.id)).map((s, i) => ({ ...s, sortOrder: i })));
    setSelected(new Set());
  };

  const toggleEnabled = (id: string) => {
    setDraft(
      draft.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const saveAll = () => commit("/api/admin/hero-slider", { slides: draft });

  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDraft(reorderDraft(draft, dragIndex, index));
    setDragIndex(index);
  };
  const onDragEnd = () => setDragIndex(null);

  const applyEdit = useCallback(() => {
    if (!editing?.src) return;
    setDraft(draft.map((s) => (s.id === editing.id ? editing : s)));
    setEditing(null);
  }, [draft, editing, setDraft]);

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold">Hero Slider</h1>
        <p className="text-sm text-white/45">
          Images de fond — néons LED et enseignes lumineuses. Les modifications ne sont publiées qu&apos;après enregistrement.
        </p>
      </div>

      <AdminDraftToolbar
        dirty={dirty}
        saving={saving}
        error={error}
        success={success}
        onSave={saveAll}
        onCancel={cancel}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <AdminButton variant="secondary" onClick={() => fileRef.current?.click()}>
          Sélectionner des images
        </AdminButton>
        <AdminButton
          variant="primary"
          onClick={uploadPending}
          disabled={pendingFiles.length === 0 || uploading}
        >
          {uploading
            ? "Upload en cours..."
            : `Uploader (${pendingFiles.length})`}
        </AdminButton>
        <AdminButton
          variant="danger"
          onClick={deleteSelected}
          disabled={selected.size === 0}
        >
          Supprimer la sélection ({selected.size})
        </AdminButton>
        <AdminButton variant="ghost" onClick={selectAll} disabled={draft.length === 0}>
          {selected.size === draft.length && draft.length > 0
            ? "Tout désélectionner"
            : "Tout sélectionner"}
        </AdminButton>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFilesPicked(e.target.files);
          e.target.value = "";
        }}
      />

      {pendingFiles.length > 0 && (
        <AdminCard
          title="Fichiers en attente d'upload"
          description="Ces fichiers seront optimisés en WebP puis ajoutés au brouillon."
        >
          <ul className="space-y-1 text-sm text-white/60">
            {pendingFiles.map((f) => (
              <li key={f.name + f.size}>{f.name}</li>
            ))}
          </ul>
        </AdminCard>
      )}

      {loading ? (
        <p className="text-sm text-white/45">Chargement...</p>
      ) : (
        <div className="mt-4 space-y-3">
          {draft.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "cursor-grab rounded-xl border bg-[#0d0d0d] transition-colors active:cursor-grabbing",
                dragIndex === index
                  ? "border-neon-pink/50"
                  : "border-white/10",
                !slide.enabled && "opacity-50"
              )}
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(slide.id)}
                  onChange={() => toggleSelect(slide.id)}
                  className="h-4 w-4 accent-neon-pink"
                  aria-label={`Sélectionner ${slide.alt}`}
                />
                <span className="text-xs text-white/35">⠿ Glisser</span>
                <span className="text-xs font-medium text-white/50">#{index + 1}</span>
                <div className="ml-auto flex flex-wrap gap-1">
                  <AdminButton variant="ghost" className="text-xs" onClick={() => setPreview(slide)}>
                    Aperçu
                  </AdminButton>
                  <AdminButton variant="ghost" className="text-xs" onClick={() => setEditing({ ...slide })}>
                    Remplacer
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className={cn("text-xs", slide.enabled ? "text-green-400" : "text-white/35")}
                    onClick={() => toggleEnabled(slide.id)}
                  >
                    {slide.enabled ? "Activé" : "Désactivé"}
                  </AdminButton>
                </div>
              </div>
              <div className="flex gap-4 p-4">
                <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg border border-white/10">
                  <Image src={slide.src} alt={slide.alt} fill className="object-cover" sizes="144px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{slide.alt || "Sans description"}</p>
                  <p className="mt-1 truncate text-xs text-white/40">{slide.src}</p>
                </div>
              </div>
            </div>
          ))}
          {draft.length === 0 && (
            <p className="text-sm text-white/45">
              Aucune image — sélectionnez et uploadez des photos de néons LED.
            </p>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-semibold">Remplacer l&apos;image</h2>
            <div className="space-y-4">
              <AdminField label="Nouvelle image">
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                    Choisir un fichier
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const [u] = await uploadMediaFiles([file], "hero");
                          setEditing({ ...editing, src: u.url });
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Upload échoué");
                        }
                      }}
                    />
                  </label>
                </div>
              </AdminField>
              <AdminField label="Texte alternatif (SEO)" required>
                <AdminTextarea
                  value={editing.alt}
                  onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
                />
              </AdminField>
              <AdminField label="URL (optionnel)">
                <AdminInput
                  value={editing.src}
                  onChange={(e) => setEditing({ ...editing, src: e.target.value })}
                />
              </AdminField>
              {editing.src && (
                <div className="relative h-40 overflow-hidden rounded-lg border border-white/10">
                  <Image src={editing.src} alt="Preview" fill className="object-cover" sizes="512px" />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </AdminButton>
              <AdminButton variant="primary" onClick={applyEdit} disabled={!editing.src}>
                Appliquer au brouillon
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={preview.src}
              alt={preview.alt}
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <p className="mt-2 text-center text-sm text-white/60">{preview.alt}</p>
            <AdminButton variant="ghost" className="mt-3 w-full" onClick={() => setPreview(null)}>
              Fermer
            </AdminButton>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
