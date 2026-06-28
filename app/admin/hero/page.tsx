"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { HeroPreview } from "@/components/admin/HeroPreview";
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
import type { HeroContent } from "@/lib/cms/types";

export default function AdminHeroPage() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((c) => setHero(c.hero));
  }, []);

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
          <p className="text-sm text-white/45">Homepage headline, trust block, and trust strip</p>
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
              <AdminField label="Primary CTA">
                <AdminInput value={hero.primaryCta} onChange={(e) => setHero({ ...hero, primaryCta: e.target.value })} />
              </AdminField>
              <AdminField label="Secondary CTA">
                <AdminInput value={hero.secondaryCta} onChange={(e) => setHero({ ...hero, secondaryCta: e.target.value })} />
              </AdminField>
              <AdminField label="Trust Strip Label">
                <AdminInput value={hero.trustStripLabel} onChange={(e) => setHero({ ...hero, trustStripLabel: e.target.value })} />
              </AdminField>
              <ImageUploadField
                label="Background Image"
                value={hero.backgroundImage ?? ""}
                onChange={(url) => setHero({ ...hero, backgroundImage: url })}
              />
            </div>
          </AdminCard>

          <AdminCard title="Trust Block (clients satisfaits)">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={hero.trustBlock?.enabled !== false}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      trustBlock: { ...hero.trustBlock, enabled: e.target.checked },
                    })
                  }
                  className="h-4 w-4 accent-neon-pink"
                />
                Visible on homepage
              </label>
              <AdminField label="Large number (e.g. 200+)">
                <AdminInput
                  value={hero.trustBlock?.value ?? ""}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      trustBlock: { ...hero.trustBlock, value: e.target.value },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Label">
                <AdminInput
                  value={hero.trustBlock?.label ?? ""}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      trustBlock: { ...hero.trustBlock, label: e.target.value },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Sublabel">
                <AdminInput
                  value={hero.trustBlock?.sublabel ?? ""}
                  onChange={(e) =>
                    setHero({
                      ...hero,
                      trustBlock: { ...hero.trustBlock, sublabel: e.target.value },
                    })
                  }
                />
              </AdminField>
            </div>
          </AdminCard>
        </div>

        <HeroPreview hero={hero} />
      </div>
    </AdminShell>
  );
}
