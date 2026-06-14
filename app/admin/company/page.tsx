"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import type { CompanyInfo, ContactInfo, SocialLinks } from "@/lib/cms/types";

export default function AdminCompanyPage() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [social, setSocial] = useState<SocialLinks | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content").then((r) => r.json()).then((c) => {
      setCompany(c.company);
      setContact(c.contact);
      setSocial(c.social);
    });
  }, []);

  const save = async () => {
    if (!company || !contact || !social) return;
    setSaving(true);
    setMsg(null);
    const { error } = await adminFetch("/api/admin/company", {
      method: "PATCH",
      body: JSON.stringify({ company, contact, social }),
    });
    setSaving(false);
    setMsg(error ? { type: "error", text: error } : { type: "success", text: "Saved successfully" });
  };

  if (!company || !contact || !social) return <AdminShell><p className="text-white/45">Loading...</p></AdminShell>;

  return (
    <AdminShell>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Company & Contact</h1>
        <AdminButton variant="primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save All"}</AdminButton>
      </div>
      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Company Information">
          <div className="space-y-3">
            <AdminField label="Company Name"><AdminInput value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></AdminField>
            <AdminField label="Tagline"><AdminInput value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} /></AdminField>
            <AdminField label="Description"><AdminTextarea value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} /></AdminField>
            <AdminField label="Commercial Highlight"><AdminInput value={company.commercialHighlight} onChange={(e) => setCompany({ ...company, commercialHighlight: e.target.value })} /></AdminField>
            <AdminField label="Commercial Subtext"><AdminInput value={company.commercialSubtext} onChange={(e) => setCompany({ ...company, commercialSubtext: e.target.value })} /></AdminField>
          </div>
        </AdminCard>

        <AdminCard title="Contact Details">
          <div className="space-y-3">
            <AdminField label="Address"><AdminInput value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></AdminField>
            <AdminField label="Email"><AdminInput type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></AdminField>
            <AdminField label="Phone"><AdminInput value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></AdminField>
          </div>
        </AdminCard>

        <AdminCard title="Social Media Links" description="Full URLs including https://">
          <div className="space-y-3">
            {(["instagram", "linkedin", "pinterest", "facebook", "twitter"] as const).map((key) => (
              <AdminField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                <AdminInput value={social[key]} onChange={(e) => setSocial({ ...social, [key]: e.target.value })} placeholder={`https://${key}.com/...`} />
              </AdminField>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
