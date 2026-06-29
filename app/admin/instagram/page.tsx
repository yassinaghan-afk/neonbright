"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { InstagramItemsManager } from "@/components/admin/InstagramItemsManager";
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
import { cn } from "@/lib/utils";

type Tab = "settings" | "posts" | "reels";

export default function AdminInstagramPage() {
  const [tab, setTab] = useState<Tab>("settings");
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

  const saveSettings = async () => {
    setSaving(true);
    setMsg(null);
    const result = await adminFetch("/api/admin/instagram", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (result.error) setMsg({ type: "error", text: result.error });
    else {
      setMsg({ type: "success", text: "Paramètres enregistrés — visibles immédiatement sur le site." });
      load();
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "settings", label: "Section" },
    { id: "posts", label: "Instagram Posts" },
    { id: "reels", label: "Instagram Reels" },
  ];

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Instagram Showcase</h1>
        <p className="mt-1 text-sm text-white/45">
          Gérez les deux marquees animés (Posts et Reels) affichés sur la page d&apos;accueil.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-neon-pink/15 text-neon-pink"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <>
          {msg && (
            <div className="mb-4">
              <AdminAlert type={msg.type} message={msg.text} />
            </div>
          )}

          {!settings ? (
            <p className="text-sm text-white/45">Chargement...</p>
          ) : (
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
                      placeholder="Suivez-nous sur Instagram"
                    />
                  </AdminField>

                  <AdminField label="Sous-titre">
                    <AdminTextarea
                      value={form.subtitle ?? ""}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="Découvrez nos dernières réalisations..."
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

                  <AdminField label="URL profil Instagram">
                    <AdminInput
                      value={form.url ?? ""}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://www.instagram.com/..."
                      type="url"
                    />
                  </AdminField>
                </div>

                <div className="mt-5">
                  <AdminButton variant="primary" onClick={saveSettings} disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </AdminButton>
                </div>
              </AdminCard>

              <AdminCard title="Aperçu">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${settings.enabled ? "bg-green-400" : "bg-red-400"}`}
                    />
                    <span className="text-white/60">
                      Section {settings.enabled ? "activée" : "désactivée"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40">Titre : </span>
                    <span>{settings.title || "—"}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Sous-titre : </span>
                    <span>{settings.subtitle || "—"}</span>
                  </div>
                </div>
              </AdminCard>
            </div>
          )}
        </>
      )}

      {tab === "posts" && (
        <InstagramItemsManager
          title="Instagram Posts"
          description="Marquee supérieur — défilement de droite à gauche. Chaque carte ouvre le post Instagram."
          fetchUrl="/api/admin/instagram/posts"
          saveUrl="/api/admin/instagram/posts"
          kind="post"
        />
      )}

      {tab === "reels" && (
        <InstagramItemsManager
          title="Instagram Reels"
          description="Marquee inférieur — défilement de gauche à droite. Chaque carte ouvre le Reel Instagram."
          fetchUrl="/api/admin/instagram/reels"
          saveUrl="/api/admin/instagram/reels"
          kind="reel"
        />
      )}
    </AdminShell>
  );
}
