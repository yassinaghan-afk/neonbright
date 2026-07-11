"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { AdminButton, AdminField } from "@/components/admin/ui/AdminForm";

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
  preset?: "gallery" | "thumbnail" | "hero";
  accept?: string;
  fileHint?: string;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  className,
  preset = "gallery",
  accept = "image/*",
  fileHint = "PNG, JPG, WebP — max 10 Mo",
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const result = await uploadAdminFile(file, { preset });
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) upload(file);
  };

  return (
    <AdminField label={label} hint={hint} className={className}>
      <div className="space-y-2">
        {value ? (
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black">
            <div className="relative h-36 w-full">
              <Image src={value} alt="Aperçu" fill className="object-cover" unoptimized />
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/60 hover:opacity-100">
              <label className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20">
                Remplacer
                <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
              </label>
              <AdminButton variant="danger" className="text-xs px-3 py-1.5" onClick={() => onChange("")}>
                Supprimer
              </AdminButton>
            </div>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging
                ? "border-neon-pink/60 bg-neon-pink/5"
                : "border-white/15 hover:border-white/30 hover:bg-white/[0.03]"
            }`}
          >
            <svg className="h-8 w-8 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <span className="text-sm text-white/40">
              {uploading ? "Upload en cours..." : "Glisser-déposer ou cliquer"}
            </span>
            <span className="text-xs text-white/25">{fileHint}</span>
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {uploading && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-neon-pink" />
          </div>
        )}
      </div>
    </AdminField>
  );
}
