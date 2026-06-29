"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { AdminField } from "@/components/admin/ui/AdminForm";

type GalleryUploadFieldProps = {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
};

export function GalleryUploadField({ label, value, onChange, hint }: GalleryUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/")).slice(0, 20);
    if (!images.length) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of images) {
        const result = await uploadAdminFile(file, { preset: "gallery" });
        urls.push(result.url);
      }
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) uploadFiles(files);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: "left" | "right") => {
    const next = [...value];
    const j = dir === "left" ? idx - 1 : idx + 1;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <AdminField label={label} hint={hint}>
      <div className="space-y-3">
        {value.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {value.map((url, idx) => (
              <div key={`${url}-${idx}`} className="group relative overflow-hidden rounded-lg border border-white/10 bg-black">
                <div className="relative aspect-square">
                  <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" unoptimized />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/70 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(idx, "left")}
                      disabled={idx === 0}
                      className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, "right")}
                      disabled={idx === value.length - 1}
                      className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="rounded bg-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/50"
                  >
                    Supprimer
                  </button>
                </div>
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/60">
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging
              ? "border-neon-pink/60 bg-neon-pink/5"
              : "border-white/15 hover:border-white/30 hover:bg-white/[0.03]"
          }`}
        >
          <svg className="h-6 w-6 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm text-white/40">
            {uploading ? "Upload en cours..." : "Ajouter des images"}
          </span>
          <span className="text-xs text-white/25">Sélection multiple — max 10 Mo chacune</span>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {uploading && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-neon-pink" />
          </div>
        )}
      </div>
    </AdminField>
  );
}
