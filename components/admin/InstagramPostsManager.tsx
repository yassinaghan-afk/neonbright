"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { createId } from "@/lib/cms/id";
import type { CMSInstagramPost } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function numbered(items: CMSInstagramPost[]): CMSInstagramPost[] {
  return items.map((item, i) => ({ ...item, sortOrder: i }));
}

function swap(
  items: CMSInstagramPost[],
  a: number,
  b: number
): CMSInstagramPost[] {
  const next = [...items];
  [next[a], next[b]] = [next[b], next[a]];
  return numbered(next);
}

async function saveToServer(items: CMSInstagramPost[]): Promise<CMSInstagramPost[]> {
  const res = await fetch("/api/admin/instagram/posts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ items: numbered(items) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json.error === "string" ? json.error : `Erreur ${res.status}`
    );
  }
  return Array.isArray(json) ? json : (json.data ?? []);
}

function newPostFromUrl(url: string, sortOrder: number): CMSInstagramPost {
  const now = new Date().toISOString();
  return {
    id: createId("igp"),
    image: url,
    carouselImages: undefined,
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
  const [items, setItems] = useState<CMSInstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragHandleRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const itemsRef = useRef<CMSInstagramPost[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/instagram/posts", {
      cache: "no-store",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((json) => {
        const data: CMSInstagramPost[] = Array.isArray(json)
          ? json
          : (json.data ?? []);
        const next = numbered(data);
        setItems(next);
        itemsRef.current = next;
      })
      .catch(() => setError("Chargement impossible"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (next: CMSInstagramPost[]) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const saved = await saveToServer(next);
      setItems(saved);
      itemsRef.current = saved;
      setSuccess("Enregistré — site mis à jour");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setItems([...itemsRef.current]);
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = (id: string) => {
    if (busy || uploadProgress) return;
    if (!confirm("Supprimer cette publication ?")) return;
    const next = numbered(itemsRef.current.filter((r) => r.id !== id));
    setItems(next);
    itemsRef.current = next;
    void save(next);
  };

  const toggleEnabled = (id: string) => {
    if (busy || uploadProgress) return;
    const now = new Date().toISOString();
    const next = numbered(
      itemsRef.current.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled, updatedAt: now } : r
      )
    );
    setItems(next);
    itemsRef.current = next;
    void save(next);
  };

  const startEditUrl = (item: CMSInstagramPost) => {
    setEditingUrlId(item.id);
    setUrlDraft(item.instagramUrl ?? "");
  };

  const commitUrl = () => {
    if (!editingUrlId || busy || uploadProgress) return;
    const now = new Date().toISOString();
    const next = numbered(
      itemsRef.current.map((r) =>
        r.id === editingUrlId
          ? { ...r, instagramUrl: urlDraft.trim(), updatedAt: now }
          : r
      )
    );
    setItems(next);
    itemsRef.current = next;
    setEditingUrlId(null);
    void save(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    if (busy || uploadProgress) return;
    const to = index + dir;
    if (to < 0 || to >= itemsRef.current.length) return;
    const next = swap(itemsRef.current, index, to);
    setItems(next);
    itemsRef.current = next;
    void save(next);
  };

  const onDragStart = (i: number) => {
    dragHandleRef.current = i;
    setDragIndex(i);
  };

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const from = dragHandleRef.current;
    if (from === null || from === i) return;
    const next = swap(itemsRef.current, from, i);
    setItems(next);
    itemsRef.current = next;
    dragHandleRef.current = i;
    setDragIndex(i);
  };

  const onDragEnd = () => {
    dragHandleRef.current = null;
    setDragIndex(null);
    if (!busy && !uploadProgress) void save(itemsRef.current);
  };

  /**
   * Multi-upload: each file becomes an independent post and is APPENDED.
   * Never replaces the existing array, never collapses into one record.
   */
  const uploadFiles = async (files: File[]) => {
    const images = files
      .filter(
        (f) =>
          f.type.startsWith("image/") ||
          /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name)
      )
      .slice(0, 200);
    if (!images.length) return;

    setError("");
    setSuccess("");
    setUploadProgress({ done: 0, total: images.length });
    let successCount = 0;

    for (let i = 0; i < images.length; i++) {
      try {
        const result = await uploadAdminFile(images[i], {
          preset: "instagram",
          category: "instagram",
        });
        const post = newPostFromUrl(result.url, itemsRef.current.length);
        const next = numbered([...itemsRef.current, post]);
        setItems(next);
        itemsRef.current = next;
        successCount++;
      } catch {
        // Skip failed file; continue appending others.
      }
      setUploadProgress({ done: i + 1, total: images.length });
    }

    if (successCount > 0) {
      await save(itemsRef.current);
    } else {
      setError("Aucune image téléversée");
    }
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-white/40">Chargement…</p>
    );
  }

  const isBlocked = busy || Boolean(uploadProgress);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Instagram Posts</h2>
          <p className="mt-0.5 text-sm text-white/40">
            {items.length === 0
              ? "Aucune publication. Uploadez plusieurs images — chaque fichier crée un post séparé."
              : `${items.length} publication${items.length !== 1 ? "s" : ""} — chaque image = 1 post. Glissez pour réordonner.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => !isBlocked && fileInputRef.current?.click()}
          disabled={isBlocked}
          className="rounded-xl bg-neon-pink px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 hover:bg-neon-pink/80"
        >
          {uploadProgress
            ? `Upload ${uploadProgress.done}/${uploadProgress.total}…`
            : busy
              ? "Enregistrement…"
              : "Ajouter des publications"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) void uploadFiles(files);
          }}
        />
      </div>

      {(error || success || uploadProgress) && (
        <div
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm",
            error
              ? "border border-red-500/30 bg-red-500/10 text-red-400"
              : success
                ? "border border-green-500/30 bg-green-500/10 text-green-400"
                : "border border-white/10 bg-white/5 text-white/60"
          )}
        >
          {error ||
            success ||
            (uploadProgress
              ? `Téléversement… ${uploadProgress.done} / ${uploadProgress.total}`
              : "")}
        </div>
      )}

      {items.length === 0 && !uploadProgress && (
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 py-16 text-center transition hover:border-neon-pink/40 hover:bg-white/[0.02]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            if (files.length) void uploadFiles(files);
          }}
        >
          <p className="text-sm text-white/40">
            Glissez plusieurs images ici — chaque fichier devient un post Instagram séparé
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) void uploadFiles(files);
            }}
          />
        </label>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable={!isBlocked}
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border bg-[#0d0d0d] p-3 transition-all",
                item.enabled ? "border-white/10" : "border-white/5 opacity-50",
                dragIndex === index && "ring-1 ring-neon-pink/50 opacity-70"
              )}
            >
              <span className="cursor-grab select-none text-lg text-white/20 active:cursor-grabbing">
                ⠿
              </span>

              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.altText || ""}
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[9px] text-white/20">
                    ?
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm text-white/70">#{index + 1}</p>
                {editingUrlId === item.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="url"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      placeholder="https://www.instagram.com/p/..."
                      className="min-w-[220px] flex-1 rounded-lg border border-white/15 bg-black px-3 py-1.5 text-xs text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitUrl();
                        if (e.key === "Escape") setEditingUrlId(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={commitUrl}
                      disabled={isBlocked}
                      className="rounded-lg bg-neon-pink/20 px-2 py-1 text-xs text-neon-pink"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUrlId(null)}
                      className="rounded-lg px-2 py-1 text-xs text-white/45"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <p className="truncate text-xs text-white/35">
                    {item.instagramUrl || "URL Instagram non définie"}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={isBlocked || index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={isBlocked || index === items.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => startEditUrl(item)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 hover:text-white"
                >
                  URL
                </button>
                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => toggleEnabled(item.id)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-xs font-medium",
                    item.enabled
                      ? "bg-green-500/15 text-green-400"
                      : "bg-white/5 text-white/40"
                  )}
                >
                  {item.enabled ? "Public" : "Masqué"}
                </button>
                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => deleteItem(item.id)}
                  className="rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400/80 hover:bg-red-500/10"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
