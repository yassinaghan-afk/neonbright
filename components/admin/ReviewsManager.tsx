"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { createId } from "@/lib/cms/id";
import type { CMSReview } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function numbered(items: CMSReview[]): CMSReview[] {
  return items.map((item, i) => ({ ...item, sortOrder: i }));
}

function swap(items: CMSReview[], a: number, b: number): CMSReview[] {
  const next = [...items];
  [next[a], next[b]] = [next[b], next[a]];
  return numbered(next);
}

// ─── one save / one truth ────────────────────────────────────────────────────

async function saveToServer(items: CMSReview[]): Promise<CMSReview[]> {
  const res = await fetch("/api/admin/reviews", {
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
  // API returns the authoritative list; use it as the new state.
  return Array.isArray(json) ? json : (json.data ?? []);
}

// ─── component ───────────────────────────────────────────────────────────────

export function ReviewsManager() {
  const [items, setItems] = useState<CMSReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragHandleRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Keep a mutable ref so async callbacks always see the latest list.
  const itemsRef = useRef<CMSReview[]>([]);
  itemsRef.current = items;

  // ── initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/reviews", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const data: CMSReview[] = Array.isArray(json)
          ? json
          : (json.data ?? []);
        setItems(numbered(data));
        itemsRef.current = numbered(data);
      })
      .catch(() => setError("Chargement impossible"))
      .finally(() => setLoading(false));
  }, []);

  // ── save helper ─────────────────────────────────────────────────────────
  const save = async (next: CMSReview[]) => {
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
      // Rollback to what we showed before the failed save.
      setItems([...itemsRef.current]);
    } finally {
      setBusy(false);
    }
  };

  // ── delete (no confirm, atomic DELETE verb, immediate) ──────────────────
  const deleteItem = (id: string) => {
    if (busy || uploadProgress) return;
    // Optimistic: remove immediately from UI.
    const next = numbered(itemsRef.current.filter((r) => r.id !== id));
    setItems(next);
    itemsRef.current = next;
    // Atomic DELETE request — cannot race a concurrent PUT.
    setBusy(true);
    setError("");
    setSuccess("");
    fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json) => {
        const saved: CMSReview[] = Array.isArray(json) ? json : (json.data ?? []);
        setItems(saved);
        itemsRef.current = saved;
        setSuccess("Supprimé — site mis à jour");
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch((err) => {
        // Rollback: restore the item that failed to delete.
        setError(err instanceof Error ? err.message : "Erreur suppression");
        // Re-fetch authoritative list from server.
        fetch("/api/admin/reviews", { cache: "no-store", credentials: "include" })
          .then((r) => r.json())
          .then((json) => {
            const data: CMSReview[] = Array.isArray(json) ? json : (json.data ?? []);
            setItems(numbered(data));
            itemsRef.current = numbered(data);
          })
          .catch(() => null);
      })
      .finally(() => setBusy(false));
  };

  // ── toggle publish ───────────────────────────────────────────────────────
  const toggleEnabled = (id: string) => {
    if (busy || uploadProgress) return;
    const next = numbered(
      itemsRef.current.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    );
    setItems(next);
    itemsRef.current = next;
    void save(next);
  };

  // ── move up / down ───────────────────────────────────────────────────────
  const move = (index: number, dir: -1 | 1) => {
    if (busy || uploadProgress) return;
    const to = index + dir;
    if (to < 0 || to >= itemsRef.current.length) return;
    const next = swap(itemsRef.current, index, to);
    setItems(next);
    itemsRef.current = next;
    void save(next);
  };

  // ── drag & drop ──────────────────────────────────────────────────────────
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

  // ── upload (sequential, each file added immediately as it lands) ─────────
  const uploadFiles = async (files: File[]) => {
    const images = files
      .filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name))
      .slice(0, 50);
    if (!images.length) return;
    setError("");
    setSuccess("");
    setUploadProgress({ done: 0, total: images.length });
    let successCount = 0;
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await uploadAdminFile(images[i], { preset: "gallery" });
        const newItem: CMSReview = {
          id: createId("rev"),
          image: result.url,
          enabled: true,
          sortOrder: 0,
        };
        const next = numbered([...itemsRef.current, newItem]);
        setItems(next);
        itemsRef.current = next;
        successCount++;
      } catch {
        // skip failed file, continue with the rest
      }
      setUploadProgress({ done: i + 1, total: images.length });
    }
    // One single save after all uploads — preserves the final list order.
    if (successCount > 0) {
      await save(itemsRef.current);
    } else {
      setError("Aucune image téléversée");
    }
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── replace ──────────────────────────────────────────────────────────────
  const replace = async (id: string, file: File) => {
    if (busy || uploadProgress) return;
    setError("");
    setBusy(true);
    try {
      const result = await uploadAdminFile(file, { preset: "gallery" });
      const next = numbered(
        itemsRef.current.map((r) =>
          r.id === id ? { ...r, image: result.url } : r
        )
      );
      setItems(next);
      itemsRef.current = next;
      await save(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur remplacement");
      setBusy(false);
    }
  };

  // ─── render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-white/40">Chargement…</p>
    );
  }

  const isBlocked = busy || Boolean(uploadProgress);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Reviews</h2>
          <p className="mt-0.5 text-sm text-white/40">
            {items.length === 0
              ? "Aucune capture. Cliquez sur « Ajouter » pour commencer."
              : `${items.length} capture${items.length !== 1 ? "s" : ""} — glissez pour réordonner`}
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
            : "+ Ajouter des captures"}
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

      {/* Status bar */}
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
          {error || success || (uploadProgress
            ? `Téléversement en cours… ${uploadProgress.done} / ${uploadProgress.total}`
            : "")}
        </div>
      )}

      {/* Empty state */}
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
          <svg
            className="h-10 w-10 text-white/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.25 5.25 0 0 1 1.232 10.095"
            />
          </svg>
          <p className="text-sm text-white/40">
            Glissez des images ici ou cliquez sur « Ajouter des captures »
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

      {/* List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <ReviewRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              blocked={isBlocked}
              isDragging={dragIndex === index}
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onDelete={() => deleteItem(item.id)}
              onToggle={() => toggleEnabled(item.id)}
              onReplace={(file) => void replace(item.id, file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── row component ───────────────────────────────────────────────────────────

type RowProps = {
  item: CMSReview;
  index: number;
  total: number;
  blocked: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onReplace: (file: File) => void;
};

function ReviewRow({
  item,
  index,
  total,
  blocked,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onDelete,
  onToggle,
  onReplace,
}: RowProps) {
  const replaceRef = useRef<HTMLInputElement>(null);

  return (
    <div
      draggable={!blocked}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-[#0d0d0d] p-3 transition-all",
        item.enabled ? "border-white/10" : "border-white/5 opacity-50",
        isDragging && "ring-1 ring-neon-pink/50 opacity-70"
      )}
    >
      {/* drag handle */}
      <span className="cursor-grab select-none text-lg text-white/20 active:cursor-grabbing">
        ⠿
      </span>

      {/* thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
        {item.image ? (
          <Image
            src={item.image}
            alt=""
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

      {/* label */}
      <span className="min-w-0 flex-1 truncate text-sm text-white/60">
        #{index + 1}
      </span>

      {/* actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Btn
          onClick={onMoveUp}
          disabled={blocked || index === 0}
          title="Monter"
        >
          ↑
        </Btn>
        <Btn
          onClick={onMoveDown}
          disabled={blocked || index === total - 1}
          title="Descendre"
        >
          ↓
        </Btn>

        {/* replace */}
        <Btn
          onClick={() => !blocked && replaceRef.current?.click()}
          disabled={blocked}
          title="Remplacer l'image"
          className="text-neon-pink/80 hover:text-neon-pink"
        >
          ⇄
        </Btn>
        <input
          ref={replaceRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(file);
            if (replaceRef.current) replaceRef.current.value = "";
          }}
        />

        {/* publish / unpublish */}
        <Btn
          onClick={onToggle}
          disabled={blocked}
          title={item.enabled ? "Masquer du site" : "Publier sur le site"}
          className={item.enabled ? "text-green-400/70 hover:text-green-400" : "text-white/30 hover:text-white/60"}
        >
          {item.enabled ? "●" : "○"}
        </Btn>

        {/* delete — no confirm, immediate */}
        <Btn
          onClick={onDelete}
          disabled={blocked}
          title="Supprimer définitivement"
          className="text-red-400/60 hover:text-red-400"
        >
          ✕
        </Btn>
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg text-sm transition",
        "hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-25",
        "text-white/50 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}
