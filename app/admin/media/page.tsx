"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminInput,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import { uploadAdminFile } from "@/lib/admin/upload-client";

type MediaFile = {
  filename: string;
  url: string;
  type: "image" | "video" | "other";
  size: number;
  createdAt: string;
};

type TypeFilter = "all" | "image" | "video";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/admin/media")
      .then(async (r) => {
        const text = await r.text();
        if (!text) return;
        try {
          const data = JSON.parse(text);
          const list = data.success === true ? data.data : data;
          if (Array.isArray(list)) setFiles(list);
        } catch (err) {
          console.error("[media] load parse failed:", err);
        }
      })
      .catch((err) => console.error("[media] load failed:", err));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = files.filter((f) => {
    const matchSearch = f.filename.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || f.type === typeFilter;
    return matchSearch && matchType;
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const isVideo = file.type.startsWith("video/");
      const result = await uploadAdminFile(file, isVideo ? { preset: "video" } : undefined);
      setMsg({ type: "success", text: `Fichier uploadé : ${result.filename}` });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    for (const file of Array.from(fileList)) {
      await uploadFile(file);
    }
  };

  const deleteFile = async (f: MediaFile) => {
    if (!confirm(`Supprimer "${f.filename}" ?\nCette action est irréversible.`)) return;
    const { error } = await adminFetch("/api/admin/media", {
      method: "DELETE",
      body: JSON.stringify({ filename: f.filename }),
    });
    if (error) setMsg({ type: "error", text: error });
    else { setMsg({ type: "success", text: "Fichier supprimé." }); if (preview?.filename === f.filename) setPreview(null); load(); }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Bibliothèque Média</h1>
          <p className="text-sm text-white/45">{files.length} fichiers · {typeFilter !== "all" ? `${filtered.length} affichés` : ""}</p>
        </div>
        <label
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          {uploading ? "Upload en cours..." : "+ Ajouter des fichiers"}
          <input
            ref={uploadRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AdminInput
          className="max-w-xs text-sm"
          placeholder="Rechercher un fichier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
          {(["all", "image", "video"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                typeFilter === t ? "bg-white/10 text-white" : "text-white/45 hover:text-white"
              }`}
            >
              {t === "all" ? "Tous" : t === "image" ? "Images" : "Vidéos"}
            </button>
          ))}
        </div>
        <span className="text-xs text-white/30">{filtered.length} résultats</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); e.dataTransfer.files && handleFiles(e.dataTransfer.files); }}
        className={`mb-6 rounded-lg border-2 border-dashed p-4 text-center text-xs text-white/30 transition-colors ${
          dragging ? "border-neon-pink/60 bg-neon-pink/5 text-neon-pink/60" : "border-white/10"
        }`}
      >
        Glissez-déposez des fichiers ici pour les uploader
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {filtered.map((f) => (
          <div
            key={f.filename}
            className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/40 transition hover:border-white/25"
          >
            {/* Thumbnail */}
            <div
              className="relative aspect-square cursor-pointer"
              onClick={() => setPreview(f)}
            >
              {f.type === "image" ? (
                <Image src={f.url} alt={f.filename} fill className="object-cover transition group-hover:opacity-80" unoptimized />
              ) : f.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-black/60">
                  <svg className="h-10 w-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs text-white/30">{f.filename.split(".").pop()}</span>
                </div>
              )}
            </div>
            {/* Meta */}
            <div className="p-2">
              <p className="truncate text-[10px] text-white/55" title={f.filename}>{f.filename}</p>
              <p className="text-[9px] text-white/30">{formatBytes(f.size)}</p>
            </div>
            {/* Actions overlay */}
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-1 bg-black/80 p-1.5 transition-transform group-hover:translate-y-0">
              <button
                type="button"
                onClick={() => copyUrl(f.url)}
                className="flex-1 rounded bg-white/10 py-1 text-[10px] text-white hover:bg-white/20"
                title="Copier l'URL"
              >
                {copied === f.url ? "✓ Copié" : "Copier URL"}
              </button>
              <button
                type="button"
                onClick={() => deleteFile(f)}
                className="rounded bg-red-500/20 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/40"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !uploading && (
          <p className="col-span-full py-12 text-center text-sm text-white/30">
            {search ? "Aucun résultat pour cette recherche." : "Aucun fichier uploadé."}
          </p>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full rounded-xl border border-white/10 bg-[#0d0d0d] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-medium text-white/80 truncate max-w-[70%]">{preview.filename}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyUrl(preview.url)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                >
                  {copied === preview.url ? "✓ Copié" : "Copier URL"}
                </button>
                <button
                  type="button"
                  onClick={() => { deleteFile(preview); }}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                >
                  ✕ Fermer
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center bg-black/60 p-4">
              {preview.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={preview.filename}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              ) : preview.type === "video" ? (
                <video
                  src={preview.url}
                  controls
                  className="max-h-[70vh] max-w-full rounded-lg"
                />
              ) : (
                <p className="text-white/40 text-sm">Aperçu non disponible</p>
              )}
            </div>
            <div className="border-t border-white/10 px-4 py-2 text-xs text-white/30 flex gap-4">
              <span>{formatBytes(preview.size)}</span>
              <span className="truncate text-white/25">{preview.url}</span>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
