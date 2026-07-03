"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { uploadMediaFiles, useDraftEditor, parseApiList } from "@/components/admin/useDraftEditor";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
} from "@/components/admin/ui/AdminForm";
import { createId } from "@/lib/cms/id";
import type { CMSBrandsPageLogo } from "@/lib/cms/types";
import { isLocalPublicAsset, isRemoteCmsAsset } from "@/lib/media/local-image";
import { cn } from "@/lib/utils";

const API = "/api/admin/brands-logos";

function reorderDraft(items: CMSBrandsPageLogo[], from: number, to: number): CMSBrandsPageLogo[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

function logoImageProps(src: string) {
  return isLocalPublicAsset(src) || isRemoteCmsAsset(src)
    ? { unoptimized: true as const }
    : {};
}

export default function AdminBrandsLogosPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSBrandsPageLogo | null>(null);

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
    load,
    setError,
  } = useDraftEditor<CMSBrandsPageLogo>(API);

  const persistDraft = useCallback(
    async (nextDraft: CMSBrandsPageLogo[]) => {
      setDraft(nextDraft);
      return commit(API, { brandsPageLogos: nextDraft });
    },
    [commit, setDraft]
  );

  const uploadAndAdd = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadMediaFiles(Array.from(files), "gallery");
      if (uploaded.length === 0) {
        throw new Error("Aucun fichier uploadé");
      }

      const currentRes = await fetch(API, {
        cache: "no-store",
        credentials: "include",
      });
      if (!currentRes.ok) {
        throw new Error("Impossible de lire les logos existants");
      }
      const current = parseApiList<CMSBrandsPageLogo>(await currentRes.json());

      const newLogos: CMSBrandsPageLogo[] = uploaded.map((u, i) => ({
        id: createId("bpl"),
        name: u.label || u.filename,
        logoUrl: u.url,
        enabled: true,
        sortOrder: current.length + i,
      }));
      const nextDraft = [...current, ...newLogos];

      setDraft(nextDraft);
      const ok = await commit(API, { brandsPageLogos: nextDraft });
      if (!ok) {
        await load();
        throw new Error("Échec de l'enregistrement après upload");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload échoué";
      setError(message);
      alert(message);
    } finally {
      setUploading(false);
    }
  };

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
    else setSelected(new Set(draft.map((item) => item.id)));
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} logo(s) ?`)) return;
    const nextDraft = draft
      .filter((item) => !selected.has(item.id))
      .map((item, i) => ({ ...item, sortOrder: i }));
    setSelected(new Set());
    await persistDraft(nextDraft);
  };

  const deleteOne = async (id: string) => {
    if (!confirm("Supprimer ce logo ?")) return;
    const nextDraft = draft
      .filter((item) => item.id !== id)
      .map((item, i) => ({ ...item, sortOrder: i }));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await persistDraft(nextDraft);
  };

  const toggleEnabled = (id: string) => {
    setDraft(
      draft.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const saveAll = () => commit(API, { brandsPageLogos: draft });

  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDraft(reorderDraft(draft, dragIndex, index));
    setDragIndex(index);
  };
  const onDragEnd = () => setDragIndex(null);

  const applyEdit = useCallback(() => {
    if (!editing?.name) return;
    setDraft(draft.map((item) => (item.id === editing.id ? editing : item)));
    setEditing(null);
  }, [draft, editing, setDraft]);

  const replaceLogo = async (file: File) => {
    if (!editing) return;
    const [uploaded] = await uploadMediaFiles([file], "gallery");
    setEditing({ ...editing, logoUrl: uploaded.url });
  };

  return (
    <AdminShell>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-white/35">
          Marques & Clients
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Bandeau logos</h1>
        <p className="text-sm text-white/45">
          Page /realisations/brands — bandeau horizontal « Ils nous font confiance ».
          Glissez-déposez pour réordonner, puis enregistrez.
        </p>
      </div>

      <AdminDraftToolbar
        dirty={dirty}
        saving={saving || uploading}
        error={error}
        success={success}
        onSave={saveAll}
        onCancel={cancel}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <AdminButton
          variant="primary"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Upload en cours..." : "Ajouter un logo"}
        </AdminButton>
        <AdminButton
          variant="danger"
          onClick={deleteSelected}
          disabled={selected.size === 0 || uploading}
        >
          Supprimer ({selected.size})
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
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          void uploadAndAdd(e.target.files);
          e.target.value = "";
        }}
      />

      {loading ? (
        <p className="text-sm text-white/45">Chargement...</p>
      ) : draft.length === 0 ? (
        <AdminCard title="Aucun logo">
          <p className="text-sm text-white/50">
            Cliquez sur « Ajouter un logo » pour alimenter le bandeau de la page Marques.
          </p>
        </AdminCard>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draft.map((logo, index) => (
            <div
              key={logo.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "cursor-grab rounded-xl border bg-[#0d0d0d] active:cursor-grabbing",
                dragIndex === index ? "border-neon-pink/50" : "border-white/10",
                !logo.enabled && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(logo.id)}
                  onChange={() => toggleSelect(logo.id)}
                  className="h-4 w-4 accent-neon-pink"
                />
                <span className="text-[10px] text-white/35" title="Glisser pour réordonner">
                  ⠿
                </span>
                <span className="truncate text-sm font-medium">{logo.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                {logo.logoUrl ? (
                  <div className="partner-white-strip flex h-16 w-40 items-center justify-center rounded-lg px-3 sm:h-[4.5rem] sm:w-44">
                    <Image
                      src={logo.logoUrl}
                      alt=""
                      width={160}
                      height={56}
                      className="partner-strip-logo max-h-10 w-auto max-w-[130px] object-contain"
                      sizes="130px"
                      loading="lazy"
                      {...logoImageProps(logo.logoUrl)}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-white/35">Aucun fichier</p>
                )}
                <div className="flex flex-col gap-1">
                  <AdminButton
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setEditing({ ...logo })}
                  >
                    Modifier
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className={cn("text-xs", logo.enabled ? "text-green-400" : "text-white/35")}
                    onClick={() => toggleEnabled(logo.id)}
                  >
                    {logo.enabled ? "Visible" : "Masqué"}
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className="text-xs text-red-400/80"
                    onClick={() => void deleteOne(logo.id)}
                  >
                    Supprimer
                  </AdminButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-semibold">Modifier le logo</h2>
            <div className="space-y-4">
              <AdminField label="Nom de l'entreprise" required>
                <AdminInput
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </AdminField>
              <AdminField label="Fichier logo">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                  Remplacer le logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void replaceLogo(file).catch((err) => {
                        alert(err instanceof Error ? err.message : "Upload échoué");
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
              </AdminField>
              {editing.logoUrl && (
                <div className="partner-white-strip flex h-20 items-center justify-center rounded-lg px-6 py-3">
                  <Image
                    src={editing.logoUrl}
                    alt=""
                    width={180}
                    height={56}
                    className="partner-strip-logo max-h-12 w-auto object-contain"
                    sizes="180px"
                    {...logoImageProps(editing.logoUrl)}
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </AdminButton>
              <AdminButton variant="primary" onClick={applyEdit}>
                Appliquer au brouillon
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
