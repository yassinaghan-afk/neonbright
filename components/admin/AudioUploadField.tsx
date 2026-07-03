"use client";

import { useRef, useState } from "react";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { AdminButton, AdminField } from "@/components/admin/ui/AdminForm";

type AudioUploadFieldProps = {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
};

export function AudioUploadField({ label, value, onChange, hint }: AudioUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const result = await uploadAdminFile(file, { preset: "audio" });
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
    if (file) uploadFile(file);
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
              <div
                key={`${url}-${idx}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3"
              >
                <audio src={url} controls className="min-w-0 flex-1" preload="metadata" />
                <AdminButton
                  variant="danger"
                  className="shrink-0 text-xs"
                  onClick={() => remove(idx)}
                >
                  Supprimer
                </AdminButton>
              </div>
            ))}
          </div>
        )}

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging
              ? "border-neon-pink/60 bg-neon-pink/5"
              : "border-white/15 hover:border-white/30 hover:bg-white/[0.03]"
          }`}
        >
          <svg
            className="h-6 w-6 text-white/25"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A49.109 49.109 0 012.25 12c0-.902.125-1.774.36-2.602.234-.847.96-1.354 1.938-1.354H6.75z"
            />
          </svg>
          <span className="text-sm text-white/40">
            {uploading ? "Upload en cours..." : "Ajouter un fichier audio"}
          </span>
          <span className="text-xs text-white/25">MP3, WAV, M4A — max 50 Mo</span>
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,.m4a,audio/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </AdminField>
  );
}
