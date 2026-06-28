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
} from "@/components/admin/ui/AdminForm";
import { createId } from "@/lib/cms/id";
import type { CMSPartner } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(items: CMSPartner[], from: number, to: number): CMSPartner[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((p, i) => ({ ...p, sortOrder: i }));
}

export default function AdminMediaLogosPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSPartner | null>(null);

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
  } = useDraftEditor<CMSPartner>("/api/admin/partners");

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
    else setSelected(new Set(draft.map((p) => p.id)));
  };

  const onFilesPicked = (files: FileList | null) => {
    if (!files?.length) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const uploadPending = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles(pendingFiles, "logo");
      const newPartners: CMSPartner[] = uploaded.map((u, i) => ({
        id: createId("partner"),
        name: u.label,
        logoUrl: u.url,
        enabled: true,
        sortOrder: draft.length + i,
      }));
      setDraft([...draft, ...newPartners]);
      setPendingFiles([]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload échoué");
    } finally {
      setUploading(false);
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} logo(s) ?`)) return;
    setDraft(draft.filter((p) => !selected.has(p.id)).map((p, i) => ({ ...p, sortOrder: i })));
    setSelected(new Set());
  };

  const deleteOne = (id: string) => {
    if (!confirm("Supprimer ce logo ?")) return;
    setDraft(draft.filter((p) => p.id !== id).map((p, i) => ({ ...p, sortOrder: i })));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleEnabled = (id: string) => {
    setDraft(
      draft.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const saveAll = () => commit("/api/admin/partners", { partners: draft });

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
    setDraft(draft.map((p) => (p.id === editing.id ? editing : p)));
    setEditing(null);
  }, [draft, editing, setDraft]);

  return (
    <AdminShell>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-white/35">
          Media
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Logos</h1>
        <p className="text-sm text-white/45">
          Bandeau « Ils nous font confiance » — fond blanc, défilement automatique.
          Glissez-déposez pour réordonner. Enregistrez pour publier.
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
        <AdminButton variant="primary" onClick={() => fileRef.current?.click()}>
          Upload Logo
        </AdminButton>
        <AdminButton
          variant="secondary"
          onClick={uploadPending}
          disabled={pendingFiles.length === 0 || uploading}
        >
          {uploading
            ? "Upload en cours..."
            : `Confirmer l'upload (${pendingFiles.length})`}
        </AdminButton>
        <AdminButton
          variant="danger"
          onClick={deleteSelected}
          disabled={selected.size === 0}
        >
          Delete Logo ({selected.size})
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
        <AdminCard title="Fichiers en attente">
          <ul className="space-y-1 text-sm text-white/60">
            {pendingFiles.map((f) => (
              <li key={f.name + f.size}>{f.name}</li>
            ))}
          </ul>
        </AdminCard>
      )}

      {loading ? (
        <p className="text-sm text-white/45">Chargement...</p>
      ) : draft.length === 0 ? (
        <AdminCard title="Aucun logo">
          <p className="text-sm text-white/50">
            Cliquez sur « Upload Logo » pour ajouter vos logos clients.
          </p>
        </AdminCard>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draft.map((partner, index) => (
            <div
              key={partner.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "cursor-grab rounded-xl border bg-[#0d0d0d] active:cursor-grabbing",
                dragIndex === index ? "border-neon-pink/50" : "border-white/10",
                !partner.enabled && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(partner.id)}
                  onChange={() => toggleSelect(partner.id)}
                  className="h-4 w-4 accent-neon-pink"
                />
                <span className="text-[10px] text-white/35" title="Glisser pour réordonner">
                  ⠿
                </span>
                <span className="truncate text-sm font-medium">{partner.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                {partner.logoUrl ? (
                  <div className="partner-white-strip flex h-16 w-40 items-center justify-center rounded-lg px-3 sm:h-[4.5rem] sm:w-44">
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={160}
                      height={56}
                      className="partner-strip-logo max-h-10 w-auto max-w-[130px] object-contain"
                      sizes="130px"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-white/35">Aucun fichier</p>
                )}
                <div className="flex flex-col gap-1">
                  <AdminButton
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setEditing({ ...partner })}
                  >
                    Modifier
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className={cn("text-xs", partner.enabled ? "text-green-400" : "text-white/35")}
                    onClick={() => toggleEnabled(partner.id)}
                  >
                    {partner.enabled ? "Activé" : "Désactivé"}
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className="text-xs text-red-400/80"
                    onClick={() => deleteOne(partner.id)}
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
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const [u] = await uploadMediaFiles([file], "logo");
                        setEditing({ ...editing, logoUrl: u.url });
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Upload échoué");
                      }
                    }}
                  />
                </label>
              </AdminField>
              {editing.logoUrl && (
                <div className="partner-white-strip flex h-20 items-center justify-center rounded-lg px-6 py-3">
                  <Image
                    src={editing.logoUrl}
                    alt="Preview"
                    width={180}
                    height={56}
                    className="partner-strip-logo max-h-12 w-auto object-contain"
                    sizes="180px"
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
