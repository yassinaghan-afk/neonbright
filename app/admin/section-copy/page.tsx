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
import type { CMSSectionCopy } from "@/lib/cms/types";

type SectionKey = keyof CMSSectionCopy;

const SECTION_LABELS: Record<SectionKey, string> = {
  portfolio: "Réalisations",
  services: "Services / Avantages",
  industries: "Secteurs",
  testimonials: "Témoignages",
  process: "Processus",
  faq: "FAQ",
  cta: "Call-to-Action (bas de page)",
};

export default function AdminSectionCopyPage() {
  const [copy, setCopy] = useState<CMSSectionCopy | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("portfolio");
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/admin/section-copy")
      .then((r) => r.json())
      .then((data: CMSSectionCopy) => {
        setCopy(data);
        setForm(data[activeSection] as Record<string, string>);
      });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (copy) {
      setForm(copy[activeSection] as Record<string, string>);
    }
  }, [activeSection, copy]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const result = await adminFetch("/api/admin/section-copy", {
      method: "PATCH",
      body: JSON.stringify({ [activeSection]: form }),
    });
    setSaving(false);
    if (result.error) setMsg({ type: "error", text: result.error });
    else {
      setMsg({ type: "success", text: "Textes enregistrés." });
      load();
    }
  };

  if (!copy) {
    return (
      <AdminShell>
        <p className="text-sm text-white/45">Chargement...</p>
      </AdminShell>
    );
  }

  const fields = Object.keys(copy[activeSection] ?? {});

  const fieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      title: "Label (petit texte au-dessus)",
      headline: "Titre principal",
      headlineAccent: "Partie accentuée du titre",
      subtitle: "Sous-titre",
      contactLink: "Texte du lien contact",
      badge: "Badge",
      headlineAccent2: "Accentuation titre",
      primaryCta: "Bouton principal",
      secondaryCta: "Bouton secondaire",
    };
    return labels[key] ?? key;
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Textes des sections</h1>
        <p className="mt-1 text-sm text-white/45">
          Modifiez les titres et sous-titres de chaque section de la page d&apos;accueil.
        </p>
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[200px,1fr]">
        <div className="space-y-1">
          {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                activeSection === key
                  ? "bg-neon-pink/15 text-neon-pink"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {SECTION_LABELS[key]}
            </button>
          ))}
        </div>

        <AdminCard title={SECTION_LABELS[activeSection]}>
          <div className="space-y-4">
            {fields.map((key) => {
              const value = String(form[key] ?? "");
              const isLong = value.length > 80 || key === "subtitle" || key === "trustPoints";
              if (key === "trustPoints") {
                const arr = Array.isArray(copy[activeSection] && (copy[activeSection] as Record<string, unknown>)[key])
                  ? ((copy[activeSection] as Record<string, unknown>)[key] as string[])
                  : [];
                return (
                  <AdminField key={key} label="Points de confiance (un par ligne)">
                    <AdminTextarea
                      value={arr.join("\n")}
                      onChange={(e) => {
                        const pts = e.target.value.split("\n").filter(Boolean);
                        setForm({ ...form, [key]: pts.join("\n") });
                      }}
                      className="min-h-[100px]"
                    />
                  </AdminField>
                );
              }
              return (
                <AdminField key={key} label={fieldLabel(key)}>
                  {isLong ? (
                    <AdminTextarea
                      value={value}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <AdminInput
                      value={value}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  )}
                </AdminField>
              );
            })}
          </div>
          <div className="mt-5">
            <AdminButton variant="primary" onClick={save} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </AdminButton>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
