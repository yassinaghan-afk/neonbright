"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import type { CMSProject } from "@/lib/cms/types";

const EMPTY: Omit<CMSProject, "id"> = {
  title: "",
  industry: "",
  city: "",
  country: "",
  description: "",
  installationSize: "",
  completedDate: "",
  image: "",
  imageAlt: "",
  accent: "neon-pink",
  featured: false,
};

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<CMSProject[]>([]);
  const [editing, setEditing] = useState<CMSProject | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then(setProjects);

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ id: "", ...EMPTY });
    setIsNew(true);
  };

  const openEdit = (p: CMSProject) => {
    setEditing({ ...p });
    setIsNew(false);
  };

  const save = async () => {
    if (!editing?.title) return;
    setSaving(true);
    setMsg(null);
    const { id, ...data } = editing;
    const result = isNew
      ? await adminFetch<CMSProject>("/api/admin/projects", { method: "POST", body: JSON.stringify(data) })
      : await adminFetch<CMSProject>(`/api/admin/projects/${id}`, { method: "PUT", body: JSON.stringify(data) });

    setSaving(false);
    if (result.error) {
      setMsg({ type: "error", text: result.error });
      return;
    }
    setMsg({ type: "success", text: isNew ? "Project created" : "Project updated" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await adminFetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-white/45">Manage projects and hero images</p>
        </div>
        <AdminButton variant="primary" onClick={openNew}>+ New Project</AdminButton>
      </div>

      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <AdminCard key={p.id} title={p.title} actions={
            <div className="flex gap-1">
              <AdminButton variant="ghost" className="text-xs px-2" onClick={() => openEdit(p)}>Edit</AdminButton>
              <AdminButton variant="ghost" className="text-xs px-2 text-red-400" onClick={() => remove(p.id)}>Delete</AdminButton>
            </div>
          }>
            {p.image && (
              <div className="relative mb-3 h-32 overflow-hidden rounded-lg">
                <Image src={p.image} alt={p.imageAlt} fill className="object-cover" unoptimized />
              </div>
            )}
            <p className="text-xs text-white/45">{p.industry} · {p.city}, {p.country}</p>
            {p.featured && <span className="mt-2 inline-block text-[10px] uppercase tracking-wider text-neon-pink">Featured</span>}
          </AdminCard>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="font-display text-lg font-semibold mb-4">{isNew ? "New Project" : "Edit Project"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AdminField label="Title" required>
                  <AdminInput value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </AdminField>
              </div>
              <AdminField label="Industry"><AdminInput value={editing.industry} onChange={(e) => setEditing({ ...editing, industry: e.target.value })} /></AdminField>
              <AdminField label="City"><AdminInput value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></AdminField>
              <AdminField label="Country"><AdminInput value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></AdminField>
              <AdminField label="Installation Size"><AdminInput value={editing.installationSize} onChange={(e) => setEditing({ ...editing, installationSize: e.target.value })} /></AdminField>
              <AdminField label="Completed Date"><AdminInput value={editing.completedDate} onChange={(e) => setEditing({ ...editing, completedDate: e.target.value })} /></AdminField>
              <div className="sm:col-span-2">
                <AdminField label="Accent">
                  <AdminSelect value={editing.accent} onChange={(e) => setEditing({ ...editing, accent: e.target.value as CMSProject["accent"] })}>
                    <option value="neon-pink">Neon Pink</option>
                    <option value="neon-purple">Neon Purple</option>
                    <option value="neon-blue">Neon Blue</option>
                  </AdminSelect>
                </AdminField>
              </div>
              <div className="sm:col-span-2">
                <ImageUploadField label="Project Image" value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} />
              </div>
              <div className="sm:col-span-2">
                <AdminField label="Image Alt">
                  <AdminInput value={editing.imageAlt} onChange={(e) => setEditing({ ...editing, imageAlt: e.target.value })} />
                </AdminField>
              </div>
              <div className="sm:col-span-2">
                <AdminField label="Description">
                  <AdminTextarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </AdminField>
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="accent-neon-pink" />
                Featured project (full-width on homepage)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>Cancel</AdminButton>
              <AdminButton variant="primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
