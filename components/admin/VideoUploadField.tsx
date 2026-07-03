"use client";

import { useRef, useState } from "react";
import { uploadAdminVideoFile } from "@/lib/admin/upload-client";
import { AdminButton, AdminField } from "@/components/admin/ui/AdminForm";

type VideoUploadFieldProps = {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
};

export function VideoUploadField({ label, value, onChange, hint }: VideoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const result = await uploadAdminVideoFile(file);
      onChange([...value, result.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) uploadFile(file);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <AdminField label={label} hint={hint}>
      <div className="space-y-3">
        {value.length > 0 && (
          <div className="space-y-2">
            {value.map((url, idx) => (
              <div key={`${url}-${idx}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
                <video
                  src={url}
                  className="h-16 w-28 shrink-0 rounded-md bg-black object-cover"
                  muted
                  preload="metadata"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white/60">{url.split("/").pop()}</p>
                </div>
                <AdminButton variant="danger" className="shrink-0 text-xs" onClick={() => remove(idx)}>
                  Supprimer
                </AdminButton>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-sm text-white/40">
            {uploading ? "Upload en cours..." : "Ajouter une vidéo"}
          </span>
          <span className="text-xs text-white/25">MP4, WebM, MOV — max 200 Mo</span>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {uploading && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-neon-purple" />
          </div>
        )}
      </div>
    </AdminField>
  );
}
