"use client";

import { useRef, useState } from "react";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { AdminButton, AdminField } from "@/components/admin/ui/AdminForm";

const VIDEO_ACCEPT =
  "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
};

export function AdminVideoUploadField({
  label,
  value,
  onChange,
  hint,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|mov|webm)$/i.test(file.name);
    if (!isVideo) {
      setError("Formats acceptés : MP4, MOV, WEBM");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const result = await uploadAdminFile(file, { preset: "video" });
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (file) void upload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <AdminField label={label} hint={hint} required>
      <div className="space-y-3">
        {value ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <video
              key={value}
              src={value}
              className="aspect-video max-h-56 w-full bg-black object-contain"
              controls
              playsInline
              preload="metadata"
            />
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2">
              <p className="truncate text-xs text-white/50">
                {value.split("/").pop()}
              </p>
              <AdminButton
                variant="ghost"
                className="shrink-0 text-xs"
                onClick={() => onChange("")}
              >
                Retirer
              </AdminButton>
            </div>
          </div>
        ) : null}

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging
              ? "border-neon-pink/60 bg-neon-pink/5"
              : "border-white/15 bg-white/[0.02] hover:border-white/25"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={VIDEO_ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <span className="text-sm text-white/60">
            {uploading
              ? "Upload en cours..."
              : "Glissez une vidéo ou cliquez pour parcourir"}
          </span>
          <span className="text-xs text-white/35">MP4 · MOV · WEBM — max 200 Mo</span>
          <AdminButton
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={(e) => {
              e.preventDefault();
              inputRef.current?.click();
            }}
          >
            {value ? "Remplacer la vidéo" : "Choisir une vidéo"}
          </AdminButton>
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </AdminField>
  );
}
