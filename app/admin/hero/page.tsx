"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { HeroPreview } from "@/components/admin/HeroPreview";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import { createId } from "@/lib/cms/id";
import type { HeroContent, HeroStat } from "@/lib/cms/types";

export default function AdminHeroPage() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((c) => setHero(c.hero));
  }, []);

  const updateStat = (id: string, field: keyof HeroStat, value: string) => {
    if (!hero) return;
    setHero({
      ...hero,
      stats: hero.stats.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    });
  };

  const addStat = () => {
    if (!hero) return;
    setHero({
      ...hero,
      stats: [...hero.stats, { id: createId("stat"), value: "", label: "" }],
    });
  };

  const removeStat = (id: string) => {
    if (!hero) return;
    setHero({ ...hero, stats: hero.stats.filter((s) => s.id !== id) });
  };

  const save = async () => {
    if (!hero) return;
    setSaving(true);
    setMsg(null);
    const { error } = await adminFetch("/api/admin/hero", {
      method: "PATCH",
      body: JSON.stringify({ hero }),
    });
    setSaving(false);
    setMsg(error ? { type: "error", text: error } : { type: "success", text: "Hero saved successfully" });
  };

  if (!hero) return <AdminShell><p className="text-white/45">Loading...</p></AdminShell>;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Hero Section</h1>
          <p className="text-sm text-white/45">Homepage headline, stats, and trust strip</p>
        </div>
        <AdminButton variant="primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </AdminButton>
      </div>

      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <AdminCard title="Content">
            <div className="space-y-4">
              <AdminField label="Badge">
                <AdminInput value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} />
              </AdminField>
              <AdminField label="Headline">
                <AdminInput value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })} />
              </AdminField>
              <AdminField label="Headline Accent (gradient text)">
                <AdminInput value={hero.headlineAccent} onChange={(e) => setHero({ ...hero, headlineAccent: e.target.value })} />
              </AdminField>
              <AdminField label="Subheadline">
                <AdminTextarea value={hero.subheadline} onChange={(e) => setHero({ ...hero, subheadline: e.target.value })} />
              </AdminField>
              <AdminField label="Trust Strip Label">
                <AdminInput value={hero.trustStripLabel} onChange={(e) => setHero({ ...hero, trustStripLabel: e.target.value })} />
              </AdminField>
            </div>
          </AdminCard>

          <AdminCard
            title="Stats"
            actions={<AdminButton variant="secondary" className="text-xs" onClick={addStat}>+ Add</AdminButton>}
          >
            <div className="space-y-3">
              {hero.stats.map((s) => (
                <div key={s.id} className="flex gap-2">
                  <AdminInput placeholder="Value" value={s.value} onChange={(e) => updateStat(s.id, "value", e.target.value)} />
                  <AdminInput placeholder="Label" value={s.label} onChange={(e) => updateStat(s.id, "label", e.target.value)} />
                  <AdminButton variant="ghost" className="shrink-0 px-2" onClick={() => removeStat(s.id)}>×</AdminButton>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <HeroPreview hero={hero} />
      </div>
    </AdminShell>
  );
}
