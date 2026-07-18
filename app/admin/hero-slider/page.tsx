"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { localServeDirect } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

const HERO_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif";
const HERO_EXT = /\.(jpe?g|png|webp|avif)$/i;
const HERO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_PENDING_BYTES = 10 * 1024 * 1024;

type PendingHeroFile = {
  id: string;
  file: File;
  previewUrl: string;
};

function fileKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function isAllowedHeroImage(file: File): boolean {
  if (HERO_MIME.has(file.type)) return true;
  // Some browsers leave type empty for HEIC→JPEG exports or odd pickers.
  if (!file.type && HERO_EXT.test(file.name)) return true;
  return HERO_EXT.test(file.name);
}

function reorderDraft(items: CMSHeroSlide[], from: number, to: number): CMSHeroSlide[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((s, i) => ({ ...s, sortOrder: i }));
}

export default function AdminHeroSliderPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<PendingHeroFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<PendingHeroFile[]>([]);
  const [selectionError, setSelectionError] = useState("");
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

  pendingFilesRef.current = pendingFiles;

  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

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

  /**
   * Snapshot FileList to a real File[] BEFORE clearing the input.
   * FileList is live — resetting input.value empties it, so deferring
   * Array.from(files) inside setState used to append [] every time.
   */
  const onFilesPicked = useCallback((fileList: FileList | File[] | null) => {
    if (!fileList) return;

    // Critical: copy now, while the input still owns the FileList.
    const picked = Array.from(fileList as ArrayLike<File>);
    if (picked.length === 0) return;

    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of picked) {
      if (!isAllowedHeroImage(file)) {
        rejected.push(`${file.name}: format non supporté (JPG, PNG, WebP, AVIF)`);
        continue;
      }
      if (file.size > MAX_PENDING_BYTES) {
        rejected.push(`${file.name}: max 10 Mo`);
        continue;
      }
      accepted.push(file);
    }

    setSelectionError(rejected.length ? rejected.join(" · ") : "");

    if (accepted.length === 0) return;

    setPendingFiles((prev) => {
      const existing = new Set(prev.map((p) => fileKey(p.file)));
      const additions: PendingHeroFile[] = [];
      for (const file of accepted) {
        const key = fileKey(file);
        if (existing.has(key)) continue;
        existing.add(key);
        additions.push({
          id: createId("pending"),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, []);

  const removePending = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearPendingSelection = () => {
    setPendingFiles((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setSelectionError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadPending = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setSelectionError("");
    const batch = [...pendingFiles];
    try {
      const uploaded = await uploadMediaFiles(
        batch.map((p) => p.file),
        "hero"
      );
      const newSlides: CMSHeroSlide[] = uploaded.map((u, i) => {
        const slide: CMSHeroSlide = {
          id: createId("slide"),
          src: u.url,
          alt: `Néon LED — ${u.label}`,
          enabled: true,
          sortOrder: draft.length + i,
        };
        if (u.desktopImageUrl) slide.desktopImageUrl = u.desktopImageUrl;
        if (u.mobileImageUrl) slide.mobileImageUrl = u.mobileImageUrl;
        return slide;
      });
      setDraft([...draft, ...newSlides]);
      // Only clear after server confirmed success.
      batch.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingFiles((prev) =>
        prev.filter((p) => !batch.some((b) => b.id === p.id))
      );
    } catch (e) {
      setSelectionError(e instanceof Error ? e.message : "Upload échoué");
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
          variant="ghost"
          onClick={clearPendingSelection}
          disabled={pendingFiles.length === 0 || uploading}
        >
          Annuler la sélection
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
        accept={HERO_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          // Snapshot FileList BEFORE clearing — FileList is live.
          const snapshot = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = "";
          onFilesPicked(snapshot);
        }}
      />

      {selectionError && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {selectionError}
        </p>
      )}

      {pendingFiles.length > 0 && (
        <AdminCard
          title={`Fichiers en attente d'upload (${pendingFiles.length})`}
          description="Aperçu local — les fichiers seront optimisés en WebP puis ajoutés au brouillon après Upload."
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingFiles.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-14 w-20 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/80">{item.file.name}</p>
                  <p className="text-xs text-white/40">
                    {(item.file.size / 1024).toFixed(0)} Ko
                  </p>
                </div>
                <AdminButton
                  variant="ghost"
                  className="shrink-0 text-xs"
                  onClick={() => removePending(item.id)}
                  disabled={uploading}
                >
                  Retirer
                </AdminButton>
              </li>
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
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    sizes="144px"
                    {...localServeDirect(slide.src)}
                  />
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
                          setEditing({
                            ...editing,
                            src: u.url,
                            ...(u.desktopImageUrl
                              ? { desktopImageUrl: u.desktopImageUrl }
                              : {}),
                            ...(u.mobileImageUrl
                              ? { mobileImageUrl: u.mobileImageUrl }
                              : {}),
                          });
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
                  <Image
                    src={editing.src}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="512px"
                    {...localServeDirect(editing.src)}
                  />
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
              {...localServeDirect(preview.src)}
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
