"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AudioUploadField } from "@/components/admin/AudioUploadField";
import { AdminDraftToolbar } from "@/components/admin/AdminDraftToolbar";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { useDraftEditor } from "@/components/admin/useDraftEditor";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { StarRating, StarRatingInput } from "@/components/testimonials/StarRating";
import { createId } from "@/lib/cms/id";
import { emptyTestimonial } from "@/lib/cms/testimonials";
import type { CMSTestimonial } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function reorderDraft(
  items: CMSTestimonial[],
  from: number,
  to: number
): CMSTestimonial[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sortOrder: i }));
}

function newTestimonial(sortOrder: number): CMSTestimonial {
  return { id: createId("test"), ...emptyTestimonial(sortOrder) };
}

function TestimonialPreview({ item }: { item: CMSTestimonial }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neon-pink/80">
        Aperçu
      </p>
      <p className="text-sm italic leading-relaxed text-white/80">
        &ldquo;{item.quote || "Citation du client…"}&rdquo;
      </p>
      {item.rating != null && item.rating > 0 && (
        <div className="mt-3">
          <StarRating rating={item.rating} />
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        {item.photo ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image src={item.photo} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-purple text-sm font-bold">
            {(item.author || "?").charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">{item.author || "Nom du client"}</p>
          {item.company && <p className="text-xs text-white/60">{item.company}</p>}
          {item.role && <p className="text-xs text-white/45">{item.role}</p>}
          {item.location && <p className="text-[10px] text-white/35">{item.location}</p>}
        </div>
      </div>
      {(item.galleryImages?.length ?? 0) > 0 && (
        <p className="mt-3 text-[10px] text-white/35">
          {item.galleryImages!.length} image(s) · {item.videos?.length ?? 0} vidéo(s) ·{" "}
          {item.audioFiles?.length ?? 0} audio
        </p>
      )}
    </div>
  );
}

export function TestimonialsManager() {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<CMSTestimonial | null>(null);
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
  } = useDraftEditor<CMSTestimonial>("/api/admin/testimonials");

  const saveAll = () => commit("/api/admin/testimonials", draft);

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

  const openNew = () => setEditing(newTestimonial(draft.length));

  const applyEdit = () => {
    if (!editing) return;
    if (!editing.quote.trim() || !editing.author.trim()) {
      alert("La citation et le nom du client sont requis.");
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

  const removeFromDraft = (id: string) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    setDraft(
      draft.filter((item) => item.id !== id).map((item, i) => ({ ...item, sortOrder: i }))
    );
  };

  const toggleEnabled = (id: string) => {
    setDraft(
      draft.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  if (loading) {
    return <p className="text-white/45">Chargement…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminDraftToolbar
        dirty={dirty}
        saving={saving}
        error={error}
        success={success}
        onCancel={cancel}
        onSave={saveAll}
      />

      <div className="flex justify-end">
        <AdminButton variant="primary" onClick={openNew}>
          + Ajouter un témoignage
        </AdminButton>
      </div>

      <div className="space-y-3">
        {draft.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className={cn(
              "flex cursor-grab items-start gap-4 rounded-xl border bg-[#0d0d0d] p-4 transition-colors active:cursor-grabbing",
              dragIndex === index ? "border-neon-pink/50" : "border-white/10",
              !item.enabled && "opacity-50"
            )}
          >
            <div className="flex shrink-0 flex-col items-center gap-1 pt-1 text-white/25">
              <span className="text-xs">⋮⋮</span>
              <span className="text-[10px]">{index + 1}</span>
            </div>

            {item.photo ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10">
                <Image src={item.photo} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg font-bold text-white/40">
                {item.author.charAt(0) || "?"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{item.author}</p>
                {item.company && (
                  <span className="text-xs text-white/45">· {item.company}</span>
                )}
                <StarRating rating={item.rating ?? 5} />
                {!item.enabled && (
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                    Inactif
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm italic text-white/50">
                &ldquo;{item.quote}&rdquo;
              </p>
              <p className="mt-1 text-xs text-white/30">
                {item.role}
                {item.location ? ` · ${item.location}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-1">
              <AdminButton
                variant="ghost"
                className="text-xs"
                onClick={() => setEditing(item)}
              >
                Modifier
              </AdminButton>
              <AdminButton
                variant="ghost"
                className="text-xs"
                onClick={() => toggleEnabled(item.id)}
              >
                {item.enabled ? "Désactiver" : "Activer"}
              </AdminButton>
              <AdminButton
                variant="ghost"
                className="text-xs text-red-400"
                onClick={() => removeFromDraft(item.id)}
              >
                Supprimer
              </AdminButton>
            </div>
          </div>
        ))}

        {draft.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-white/35">
            Aucun témoignage. Cliquez sur « Ajouter un témoignage ».
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 sm:p-8">
          <div className="my-auto w-full max-w-4xl rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-6 font-display text-xl font-bold">
              {draft.some((t) => t.id === editing.id)
                ? "Modifier le témoignage"
                : "Nouveau témoignage"}
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <AdminField label="Citation" required>
                  <AdminTextarea
                    value={editing.quote}
                    onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
                    rows={4}
                  />
                </AdminField>
                <AdminField label="Nom du client" required>
                  <AdminInput
                    value={editing.author}
                    onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Entreprise">
                  <AdminInput
                    value={editing.company ?? ""}
                    onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Poste">
                  <AdminInput
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Ville / Pays">
                  <AdminInput
                    value={editing.location}
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Note">
                  <StarRatingInput
                    value={editing.rating ?? 5}
                    onChange={(rating) => setEditing({ ...editing, rating })}
                  />
                </AdminField>
                <ImageUploadField
                  label="Photo de profil"
                  value={editing.photo ?? ""}
                  onChange={(photo) => setEditing({ ...editing, photo })}
                  preset="thumbnail"
                />
                <GalleryUploadField
                  label="Galerie photos"
                  value={editing.galleryImages ?? []}
                  onChange={(galleryImages) => setEditing({ ...editing, galleryImages })}
                />
                <VideoUploadField
                  label="Vidéos"
                  value={editing.videos ?? []}
                  onChange={(videos) => setEditing({ ...editing, videos })}
                />
                <AudioUploadField
                  label="Témoignages audio"
                  value={editing.audioFiles ?? []}
                  onChange={(audioFiles) => setEditing({ ...editing, audioFiles })}
                />
                <AdminField label="Instagram (URL)">
                  <AdminInput
                    value={editing.instagramUrl ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, instagramUrl: e.target.value })
                    }
                    placeholder="https://instagram.com/..."
                  />
                </AdminField>
                <AdminField label="LinkedIn (URL)">
                  <AdminInput
                    value={editing.linkedinUrl ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, linkedinUrl: e.target.value })
                    }
                    placeholder="https://linkedin.com/in/..."
                  />
                </AdminField>
                <AdminField label="Site web (URL)">
                  <AdminInput
                    value={editing.websiteUrl ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, websiteUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </AdminField>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={editing.enabled}
                    onChange={(e) =>
                      setEditing({ ...editing, enabled: e.target.checked })
                    }
                    className="rounded border-white/20"
                  />
                  Actif sur le site
                </label>
              </div>

              <div className="lg:sticky lg:top-0 lg:self-start">
                <TestimonialPreview item={editing} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>
                Annuler
              </AdminButton>
              <AdminButton variant="primary" onClick={applyEdit}>
                Appliquer au brouillon
              </AdminButton>
            </div>
            <p className="mt-2 text-right text-xs text-white/35">
              Puis cliquez « Enregistrer les témoignages » pour publier sur le site.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
