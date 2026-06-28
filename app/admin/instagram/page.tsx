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
import type { CMSInstagramSettings } from "@/lib/cms/types";

export default function AdminInstagramPage() {
  const [settings, setSettings] = useState<CMSInstagramSettings | null>(null);
  const [form, setForm] = useState<Partial<CMSInstagramSettings>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/admin/instagram")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setForm(data);
      });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const result = await adminFetch("/api/admin/instagram", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (result.error) setMsg({ type: "error", text: result.error });
    else {
      setMsg({ type: "success", text: "Paramètres Instagram enregistrés." });
      load();
    }
  };

  if (!settings) {
    return (
      <AdminShell>
        <p className="text-sm text-white/45">Chargement...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Section Instagram</h1>
        <p className="mt-1 text-sm text-white/45">
          Gérez l&apos;affichage de la section Instagram sur la page d&apos;accueil.
        </p>
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Visibilité & Textes">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <input
                type="checkbox"
                id="ig-enabled"
                checked={form.enabled !== false}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="ig-enabled" className="text-sm text-white/70">
                Afficher la section Instagram sur le site
              </label>
            </div>

            <AdminField label="Titre de la section">
              <AdminInput
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notre Instagram"
              />
            </AdminField>

            <AdminField label="Sous-titre">
              <AdminTextarea
                value={form.subtitle ?? ""}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Suivez-nous pour les dernières réalisations..."
                className="min-h-[80px]"
              />
            </AdminField>

            <AdminField label="Texte du bouton">
              <AdminInput
                value={form.buttonText ?? ""}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                placeholder="Voir sur Instagram"
              />
            </AdminField>

            <AdminField label="URL Instagram" hint="L'URL du profil Instagram de votre entreprise.">
              <AdminInput
                value={form.url ?? ""}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://www.instagram.com/neonbright.ma/"
                type="url"
              />
            </AdminField>
          </div>

          <div className="mt-5">
            <AdminButton variant="primary" onClick={save} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard title="Aperçu actuel">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${settings.enabled ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-white/60">
                Section {settings.enabled ? "activée" : "désactivée"}
              </span>
            </div>
            <div>
              <span className="text-white/40">Titre : </span>
              <span>{settings.title || "—"}</span>
            </div>
            <div>
              <span className="text-white/40">Bouton : </span>
              <span>{settings.buttonText || "—"}</span>
            </div>
            <div>
              <span className="text-white/40">URL : </span>
              {settings.url ? (
                <a href={settings.url} target="_blank" rel="noopener noreferrer" className="text-neon-pink hover:underline break-all">
                  {settings.url}
                </a>
              ) : (
                <span className="text-white/30">Non définie</span>
              )}
            </div>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
