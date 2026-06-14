"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import type { SEOMetadata } from "@/lib/cms/types";

export default function AdminSEOPage() {
  const [seo, setSeo] = useState<SEOMetadata | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content").then((r) => r.json()).then((c) => setSeo(c.seo));
  }, []);

  const save = async () => {
    if (!seo) return;
    setSaving(true);
    const { error } = await adminFetch("/api/admin/seo", { method: "PATCH", body: JSON.stringify({ seo }) });
    setSaving(false);
    setMsg(error ? { type: "error", text: error } : { type: "success", text: "SEO metadata saved" });
  };

  if (!seo) return <AdminShell><p className="text-white/45">Loading...</p></AdminShell>;

  return (
    <AdminShell>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">SEO Metadata</h1>
          <p className="text-sm text-white/45">Search engine and social sharing settings</p>
        </div>
        <AdminButton variant="primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</AdminButton>
      </div>
      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Meta Tags">
          <div className="space-y-3">
            <AdminField label="Page Title"><AdminInput value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} /></AdminField>
            <AdminField label="Meta Description"><AdminTextarea value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} /></AdminField>
            <AdminField label="Keywords" hint="Comma-separated"><AdminInput value={seo.keywords} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} /></AdminField>
            <ImageUploadField label="Open Graph Image" value={seo.ogImage} onChange={(url) => setSeo({ ...seo, ogImage: url })} />
          </div>
        </AdminCard>

        <AdminCard title="Search Preview">
          <div className="rounded-lg border border-white/10 bg-white p-4">
            <p className="text-[#1a0dab] text-lg leading-snug truncate">{seo.title || "Page Title"}</p>
            <p className="text-[#006621] text-sm">neonbright.ma</p>
            <p className="mt-1 text-sm text-[#545454] line-clamp-2">{seo.description || "Meta description..."}</p>
          </div>
          {seo.ogImage && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-white/40">OG Image Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={seo.ogImage} alt="OG preview" className="rounded-lg max-h-40 object-cover" />
            </div>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
