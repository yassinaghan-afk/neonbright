"use client";

import { useState } from "react";
import Image from "next/image";
import { AdminButton, AdminField, AdminInput } from "@/components/admin/ui/AdminForm";

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
};

export function ImageUploadField({ label, value, onChange, hint }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminField label={label} hint={hint ?? "Or paste an image URL below"}>
      <div className="space-y-3">
        {value && (
          <div className="relative h-32 w-full overflow-hidden rounded-lg border border-white/10 bg-black">
            <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
            {uploading ? "Uploading..." : "Upload Image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {value && (
            <AdminButton variant="ghost" onClick={() => onChange("")}>
              Remove
            </AdminButton>
          )}
        </div>
        <AdminInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https:// or /uploads/cms/..."
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </AdminField>
  );
}
