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
import type { CompanyInfo } from "@/lib/cms/types";

export default function AdminCompanyPage() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content").then((r) => r.json()).then((c) => {
      const data = c.data ?? c;
      setCompany(data.company);
    });
  }, []);

  const save = async () => {
    if (!company) return;
    setSaving(true);
    setMsg(null);
    const { error } = await adminFetch("/api/admin/company", {
      method: "PATCH",
      body: JSON.stringify({ company }),
    });
    setSaving(false);
    setMsg(error ? { type: "error", text: error } : { type: "success", text: "Saved successfully" });
  };

  if (!company) return <AdminShell><p className="text-white/45">Loading...</p></AdminShell>;

  return (
    <AdminShell>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Company Information</h1>
          <p className="mt-1 text-sm text-white/45">
            For contact and social links, go to{" "}
            <a href="/admin/settings/social-contact" className="text-neon-pink hover:underline">
              Settings → Social &amp; Contact
            </a>
            .
          </p>
        </div>
        <AdminButton variant="primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</AdminButton>
      </div>
      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      <div className="mb-6">
        <AdminCard title="Logo officiel">
          <p className="mb-4 text-sm text-white/45">
            Logo affiché sur le site public (navbar, footer, pages designer). Enregistrez après
            l&apos;upload pour publier immédiatement.
          </p>
          <ImageUploadField
            label="Logo Neon Bright"
            value={company.logoUrl ?? ""}
            onChange={(url) => setCompany({ ...company, logoUrl: url })}
            preset="gallery"
            hint="PNG ou SVG transparent recommandé — stocké sur Vercel Blob en production."
          />
        </AdminCard>
      </div>

      <AdminCard title="Company Information">
        <div className="space-y-3">
          <AdminField label="Company Name"><AdminInput value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></AdminField>
          <AdminField label="Tagline"><AdminInput value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} /></AdminField>
          <AdminField label="Description"><AdminTextarea value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} /></AdminField>
          <AdminField label="Commercial Highlight"><AdminInput value={company.commercialHighlight} onChange={(e) => setCompany({ ...company, commercialHighlight: e.target.value })} /></AdminField>
          <AdminField label="Commercial Subtext"><AdminInput value={company.commercialSubtext} onChange={(e) => setCompany({ ...company, commercialSubtext: e.target.value })} /></AdminField>
          <AdminField label="Footer Tagline"><AdminTextarea value={company.footerTagline ?? ""} onChange={(e) => setCompany({ ...company, footerTagline: e.target.value })} /></AdminField>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
