"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { InstagramPostsManager } from "@/components/admin/InstagramPostsManager";
import { InstagramReelsManager } from "@/components/admin/InstagramReelsManager";
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

type Tab = "section" | "posts" | "reels";

type InstagramAdminPayload = CMSInstagramSettings & {
  stats?: { postsCount: number; reelsCount: number };
};

export default function AdminInstagramPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [form, setForm] = useState<Partial<InstagramAdminPayload>>({});
  const [stats, setStats] = useState({ postsCount: 0, reelsCount: 0 });
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return fetch("/api/admin/instagram")
      .then((r) => r.json())
      .then((data: InstagramAdminPayload) => {
        setForm(data);
        setStats(data.stats ?? { postsCount: 0, reelsCount: 0 });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const result = await adminFetch("/api/admin/instagram", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (result.error) {
      setMsg({ type: "error", text: result.error });
    } else {
      setMsg({ type: "success", text: "Enregistré — visible sur le site immédiatement." });
      load();
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "posts", label: "Posts", count: stats.postsCount },
    { id: "reels", label: "Reels", count: stats.reelsCount },
    { id: "section", label: "Section" },
  ];

  if (!loaded) {
    return (
      <AdminShell>
        <p className="text-sm text-white/45">Chargement...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Instagram Showcase</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/45">
            Gérez les publications et reels affichés sur la page d&apos;accueil.
            Contenu uploadé depuis le dashboard — aucune dépendance à l&apos;API
            Instagram.
          </p>
        </div>
        {tab === "section" && (
          <AdminButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </AdminButton>
        )}
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

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
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs text-white/35">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {tab === "section" && (
        <AdminCard title="Visibilité et textes de la section">
          <div className="max-w-xl space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <input
                type="checkbox"
                id="ig-enabled"
                checked={form.enabled !== false}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="ig-enabled" className="text-sm text-white/70">
                Afficher la section Instagram sur la page d&apos;accueil
              </label>
            </div>

            <AdminField label="Titre de la section">
              <AdminInput
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </AdminField>

            <AdminField label="Sous-titre">
              <AdminTextarea
                value={form.subtitle ?? ""}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="min-h-[80px]"
              />
            </AdminField>

            <AdminField label="Texte du bouton">
              <AdminInput
                value={form.buttonText ?? ""}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
              />
            </AdminField>

            <AdminField label="URL du profil Instagram">
              <AdminInput
                value={form.url ?? ""}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://www.instagram.com/_neonbright_"
                type="url"
              />
            </AdminField>
          </div>
        </AdminCard>
      )}

      {tab === "posts" && <InstagramPostsManager />}
      {tab === "reels" && <InstagramReelsManager />}
    </AdminShell>
  );
}
