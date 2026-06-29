"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import type { CMSPortfolioCategory, CMSPortfolioProject } from "@/lib/cms/types";

type Tab = "categories" | "projects";
type VisibilityFilter = "all" | "public" | "hidden";

const EMPTY_CATEGORY: Omit<CMSPortfolioCategory, "id"> = {
  slug: "",
  title: "Réalisations pour",
  titleAccent: "",
  description: "",
  coverImage: "",
  coverAlt: "",
  heroImage: "",
  href: "",
  pageTitle: "",
  pageSubtitle: "",
  enabled: true,
  sortOrder: 0,
};

const emptyProject = (categoryId = "", sortOrder = 0): Omit<CMSPortfolioProject, "id"> => ({
  categoryId,
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  shortDescription: "",
  client: "",
  city: "",
  country: "",
  year: new Date().getFullYear().toString(),
  images: [],
  videos: [],
  gallery: [],
  featuredImage: "",
  coverImage: "",
  thumbnail: "",
  imageAlt: "",
  tags: [],
  accent: "neon-pink",
  published: true,
  sortOrder,
  seoTitle: "",
  seoDescription: "",
  typeLabel: "",
  type: "",
  logoFile: "",
  installationType: "",
  technologies: [],
  filters: [],
  relatedProjectSlugs: [],
});

export default function AdminPortfolioPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<CMSPortfolioCategory[]>([]);
  const [projects, setProjects] = useState<CMSPortfolioProject[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [editingCategory, setEditingCategory] = useState<Partial<CMSPortfolioCategory> | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<CMSPortfolioProject> | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/portfolio");
    const data = await res.json().catch(() => null);

    if (res.ok && data?.categories && data?.projects) {
      setCategories(
        (data.categories as CMSPortfolioCategory[]).sort(
          (a, b) => a.sortOrder - b.sortOrder
        )
      );
      setProjects(
        (data.projects as CMSPortfolioProject[]).sort(
          (a, b) => a.sortOrder - b.sortOrder
        )
      );
      return;
    }

    setMsg({
      type: "error",
      text:
        (data && typeof data === "object" && "error" in data
          ? String(data.error)
          : null) ?? "Impossible de charger le portfolio.",
    });
  };

  useEffect(() => { load(); }, []);

  const filteredProjects = useMemo(() => {
    let list = filterCategoryId === "all"
      ? projects
      : projects.filter((p) => p.categoryId === filterCategoryId);
    if (visibilityFilter === "public") list = list.filter((p) => p.published);
    if (visibilityFilter === "hidden") list = list.filter((p) => !p.published);
    return list;
  }, [projects, filterCategoryId, visibilityFilter]);

  const callSave = async (url: string, method: string, body: unknown) => {
    setSaving(true);
    setMsg(null);
    const result = await adminFetch(url, { method, body: JSON.stringify(body) });
    setSaving(false);
    if (result.error) { setMsg({ type: "error", text: result.error }); return false; }
    return true;
  };

  const saveCategory = async () => {
    if (!editingCategory?.title || !editingCategory.slug) {
      setMsg({ type: "error", text: "Titre et slug requis." });
      return;
    }
    const ok = isNewCategory
      ? await callSave("/api/admin/portfolio/categories", "POST", editingCategory)
      : await callSave(`/api/admin/portfolio/categories/${editingCategory.id}`, "PUT", editingCategory);
    if (ok) { setMsg({ type: "success", text: "Catégorie enregistrée." }); setEditingCategory(null); load(); }
  };

  const saveProject = async () => {
    if (!editingProject?.title?.trim() || !editingProject.categoryId) {
      setMsg({ type: "error", text: "Titre et catégorie requis." });
      return;
    }
    const ok = isNewProject
      ? await callSave("/api/admin/portfolio/projects", "POST", editingProject)
      : await callSave(`/api/admin/portfolio/projects/${editingProject.id}`, "PUT", editingProject);
    if (ok) { setMsg({ type: "success", text: "Projet enregistré." }); setEditingProject(null); load(); }
  };

  const duplicateProject = async (p: CMSPortfolioProject) => {
    const dup = { ...p, title: `${p.title} (copie)`, slug: `${p.slug}-copy-${Date.now()}`, published: false };
    const { id: _id, ...rest } = dup as CMSPortfolioProject;
    await callSave("/api/admin/portfolio/projects", "POST", rest);
    load();
  };

  const moveCategory = async (index: number, dir: "up" | "down") => {
    const list = [...categories];
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    const reordered = list.map((c, i) => ({ ...c, sortOrder: i }));
    setCategories(reordered);
    await adminFetch("/api/admin/portfolio/categories", { method: "PUT", body: JSON.stringify(reordered) });
  };

  const moveProject = async (index: number, dir: "up" | "down") => {
    const list = [...filteredProjects];
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    const reordered = list.map((p, i) => ({ ...p, sortOrder: i }));
    const others = projects.filter((p) => !list.find((x) => x.id === p.id));
    const all = [...others, ...reordered];
    setProjects(all);
    await adminFetch("/api/admin/portfolio/projects", { method: "PUT", body: JSON.stringify(all) });
  };

  const togglePublished = async (p: CMSPortfolioProject) => {
    await adminFetch(`/api/admin/portfolio/projects/${p.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...p, published: !p.published }),
    });
    load();
  };

  const toggleCategory = async (cat: CMSPortfolioCategory) => {
    await adminFetch(`/api/admin/portfolio/categories/${cat.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...cat, enabled: !cat.enabled }),
    });
    load();
  };

  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.titleAccent ||
    categories.find((c) => c.id === id)?.slug || id;

  const setEP = (patch: Partial<CMSPortfolioProject>) =>
    setEditingProject((prev) => prev ? { ...prev, ...patch } : prev);

  // ──────────────── RENDER ────────────────
  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Portfolio / Réalisations</h1>
          <p className="text-sm text-white/45">
            Catégories et projets — {projects.length} projets au total
          </p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant={tab === "categories" ? "primary" : "secondary"} onClick={() => setTab("categories")}>
            Catégories
          </AdminButton>
          <AdminButton variant={tab === "projects" ? "primary" : "secondary"} onClick={() => setTab("projects")}>
            Projets
          </AdminButton>
        </div>
      </div>

      {msg && <div className="mb-4"><AdminAlert type={msg.type} message={msg.text} /></div>}

      {/* ─── CATEGORIES TAB ─── */}
      {tab === "categories" && (
        <>
          <div className="mb-4 flex justify-end">
            <AdminButton variant="primary" onClick={() => {
              setEditingCategory({ ...EMPTY_CATEGORY, sortOrder: categories.length });
              setIsNewCategory(true);
            }}>
              + Nouvelle catégorie
            </AdminButton>
          </div>
          <div className="space-y-3">
            {categories.map((cat, index) => (
              <AdminCard
                key={cat.id}
                title={`${cat.title} ${cat.titleAccent}`}
                actions={
                  <div className="flex flex-wrap gap-1">
                    <AdminButton variant="ghost" className="text-xs px-2" onClick={() => moveCategory(index, "up")} disabled={index === 0}>↑</AdminButton>
                    <AdminButton variant="ghost" className="text-xs px-2" onClick={() => moveCategory(index, "down")} disabled={index === categories.length - 1}>↓</AdminButton>
                    <AdminButton
                      variant="ghost"
                      className={`text-xs ${cat.enabled ? "text-green-400" : "text-white/30"}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat.enabled ? "Visible" : "Masqué"}
                    </AdminButton>
                    <AdminButton variant="ghost" className="text-xs" onClick={() => { setEditingCategory(cat); setIsNewCategory(false); }}>Éditer</AdminButton>
                    <AdminButton variant="ghost" className="text-xs text-red-400" onClick={async () => {
                      if (!confirm(`Supprimer "${cat.titleAccent || cat.slug}" et tous ses projets ?`)) return;
                      await adminFetch(`/api/admin/portfolio/categories/${cat.id}`, { method: "DELETE" });
                      load();
                    }}>Suppr.</AdminButton>
                  </div>
                }
              >
                <p className="text-sm text-white/55 line-clamp-2">{cat.description}</p>
                <p className="mt-1 text-xs text-white/35">
                  {cat.href} · {projects.filter((p) => p.categoryId === cat.id).length} projets
                </p>
              </AdminCard>
            ))}
          </div>
        </>
      )}

      {/* ─── PROJECTS TAB ─── */}
      {tab === "projects" && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Visibility filter */}
              <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
                {(["all", "public", "hidden"] as VisibilityFilter[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibilityFilter(v)}
                    className={`px-3 py-1.5 capitalize transition-colors ${
                      visibilityFilter === v
                        ? "bg-white/10 text-white"
                        : "text-white/45 hover:text-white"
                    }`}
                  >
                    {v === "all" ? "Tous" : v === "public" ? "🟢 Public" : "🔴 Masqués"}
                  </button>
                ))}
              </div>
              {/* Category filter */}
              <AdminSelect
                className="max-w-[200px] text-xs"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
              >
                <option value="all">Toutes catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.titleAccent || c.slug}</option>
                ))}
              </AdminSelect>
              <span className="text-xs text-white/30">{filteredProjects.length} résultats</span>
            </div>
            <AdminButton
              variant="primary"
              onClick={() => {
                setEditingProject(emptyProject(
                  filterCategoryId !== "all" ? filterCategoryId : categories[0]?.id ?? "",
                  projects.length
                ) as Partial<CMSPortfolioProject>);
                setIsNewProject(true);
              }}
            >
              + Nouveau projet
            </AdminButton>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((p, index) => (
              <AdminCard
                key={p.id}
                title={p.title}
                actions={
                  <div className="flex flex-wrap gap-1">
                    <AdminButton variant="ghost" className="text-xs px-2" onClick={() => moveProject(index, "up")} disabled={index === 0}>↑</AdminButton>
                    <AdminButton variant="ghost" className="text-xs px-2" onClick={() => moveProject(index, "down")} disabled={index === filteredProjects.length - 1}>↓</AdminButton>
                    <AdminButton variant="ghost" className="text-xs" onClick={() => { setEditingProject(p); setIsNewProject(false); }}>Éditer</AdminButton>
                    <AdminButton variant="ghost" className="text-xs text-neon-purple" onClick={() => duplicateProject(p)}>Dupliquer</AdminButton>
                    <AdminButton variant="ghost" className="text-xs text-red-400" onClick={async () => {
                      if (!confirm(`Supprimer "${p.title}" ?`)) return;
                      await adminFetch(`/api/admin/portfolio/projects/${p.id}`, { method: "DELETE" });
                      load();
                    }}>Suppr.</AdminButton>
                  </div>
                }
              >
                {(p.featuredImage || p.coverImage) && (
                  <div className="relative mb-3 h-28 overflow-hidden rounded-lg">
                    <Image src={p.featuredImage || p.coverImage} alt={p.imageAlt || p.title} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-white/45">{catName(p.categoryId)} · {p.city} {p.year}</p>
                  <AdminBadge status={p.published ? "public" : "hidden"} />
                </div>
                <div className="mt-2">
                  <AdminButton
                    variant="ghost"
                    className="text-xs"
                    onClick={() => togglePublished(p)}
                  >
                    {p.published ? "→ Masquer" : "→ Publier"}
                  </AdminButton>
                </div>
              </AdminCard>
            ))}
            {filteredProjects.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-white/30">
                Aucun projet dans ce filtre.
              </p>
            )}
          </div>
        </>
      )}

      {/* ─── CATEGORY EDITOR MODAL ─── */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">
              {isNewCategory ? "Nouvelle catégorie" : "Modifier la catégorie"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Slug (URL)" required hint="ex: evenements, marques-clients">
                <AdminInput value={editingCategory.slug ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })} placeholder="evenements" />
              </AdminField>
              <AdminField label="Lien href" hint="ex: /realisations/events">
                <AdminInput value={editingCategory.href ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, href: e.target.value })} />
              </AdminField>
              <AdminField label="Titre">
                <AdminInput value={editingCategory.title ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })} />
              </AdminField>
              <AdminField label="Titre accent (dégradé)">
                <AdminInput value={editingCategory.titleAccent ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, titleAccent: e.target.value })} />
              </AdminField>
              <div className="sm:col-span-2">
                <AdminField label="Description (carte accueil)">
                  <AdminTextarea value={editingCategory.description ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })} />
                </AdminField>
              </div>
              <AdminField label="Titre page listing">
                <AdminInput value={editingCategory.pageTitle ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, pageTitle: e.target.value })} placeholder="ÉVÉNEMENTS" />
              </AdminField>
              <AdminField label="Sous-titre page listing">
                <AdminInput value={editingCategory.pageSubtitle ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, pageSubtitle: e.target.value })} />
              </AdminField>
              <div className="sm:col-span-2">
                <ImageUploadField
                  label="Image de couverture"
                  value={editingCategory.coverImage ?? ""}
                  onChange={(url) => setEditingCategory({ ...editingCategory, coverImage: url, heroImage: url })}
                />
              </div>
              <AdminField label="Alt image de couverture">
                <AdminInput value={editingCategory.coverAlt ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, coverAlt: e.target.value })} />
              </AdminField>
              <div className="flex items-center gap-2 self-end pb-1">
                <input
                  type="checkbox"
                  id="cat-enabled"
                  checked={editingCategory.enabled !== false}
                  onChange={(e) => setEditingCategory({ ...editingCategory, enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="cat-enabled" className="text-sm text-white/70">Visible sur le site</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditingCategory(null)}>Annuler</AdminButton>
              <AdminButton variant="primary" onClick={saveCategory} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROJECT EDITOR MODAL ─── */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <div className="mb-5 flex items-start justify-between">
              <h2 className="font-display text-lg font-semibold">
                {isNewProject ? "Nouveau projet" : `Modifier : ${editingProject.title || "..."}`}
              </h2>
              {!isNewProject && (
                <AdminBadge status={editingProject.published ? "public" : "hidden"} />
              )}
            </div>

            <div className="space-y-6">
              {/* ── Identité ── */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">Identité</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminField label="Catégorie" required>
                    <AdminSelect value={editingProject.categoryId ?? ""} onChange={(e) => setEP({ categoryId: e.target.value })}>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.titleAccent || c.slug}</option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Slug (URL)">
                    <AdminInput value={editingProject.slug ?? ""} onChange={(e) => setEP({ slug: e.target.value })} placeholder="auto-généré si vide" />
                  </AdminField>
                  <div className="sm:col-span-2">
                    <AdminField label="Titre" required>
                      <AdminInput value={editingProject.title ?? ""} onChange={(e) => setEP({ title: e.target.value })} />
                    </AdminField>
                  </div>
                  <div className="sm:col-span-2">
                    <AdminField label="Sous-titre">
                      <AdminInput value={editingProject.subtitle ?? ""} onChange={(e) => setEP({ subtitle: e.target.value })} />
                    </AdminField>
                  </div>
                </div>
              </section>

              {/* ── Détails ── */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">Détails</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminField label="Client">
                    <AdminInput value={editingProject.client ?? ""} onChange={(e) => setEP({ client: e.target.value })} />
                  </AdminField>
                  <AdminField label="Année">
                    <AdminInput value={editingProject.year ?? ""} onChange={(e) => setEP({ year: e.target.value })} />
                  </AdminField>
                  <AdminField label="Ville">
                    <AdminInput value={editingProject.city ?? ""} onChange={(e) => setEP({ city: e.target.value })} />
                  </AdminField>
                  <AdminField label="Pays">
                    <AdminInput value={editingProject.country ?? ""} onChange={(e) => setEP({ country: e.target.value })} />
                  </AdminField>
                  <AdminField label="Type / Label (marques)">
                    <AdminInput value={editingProject.typeLabel ?? ""} onChange={(e) => setEP({ typeLabel: e.target.value })} />
                  </AdminField>
                  <AdminField label="Type d'installation">
                    <AdminInput value={editingProject.installationType ?? ""} onChange={(e) => setEP({ installationType: e.target.value })} />
                  </AdminField>
                  <AdminField label="Tags (virgule)">
                    <AdminInput
                      value={(editingProject.tags ?? []).join(", ")}
                      onChange={(e) => setEP({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                    />
                  </AdminField>
                  <AdminField label="Accent">
                    <AdminSelect value={editingProject.accent ?? "neon-pink"} onChange={(e) => setEP({ accent: e.target.value as CMSPortfolioProject["accent"] })}>
                      <option value="neon-pink">Neon Pink</option>
                      <option value="neon-purple">Neon Purple</option>
                      <option value="neon-blue">Neon Blue</option>
                    </AdminSelect>
                  </AdminField>
                </div>
              </section>

              {/* ── Descriptions ── */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">Descriptions</h3>
                <div className="space-y-3">
                  <AdminField label="Description courte">
                    <AdminTextarea value={editingProject.shortDescription ?? ""} onChange={(e) => setEP({ shortDescription: e.target.value })} className="min-h-[80px]" />
                  </AdminField>
                  <AdminField label="Description complète">
                    <AdminTextarea value={editingProject.description ?? ""} onChange={(e) => setEP({ description: e.target.value })} className="min-h-[120px]" />
                  </AdminField>
                </div>
              </section>

              {/* ── Images ── */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">Images</h3>
                <div className="space-y-4">
                  <ImageUploadField
                    label="Image principale (featured)"
                    value={editingProject.featuredImage ?? ""}
                    onChange={(url) => setEP({ featuredImage: url, coverImage: url })}
                  />
                  <ImageUploadField
                    label="Miniature"
                    value={editingProject.thumbnail ?? ""}
                    onChange={(url) => setEP({ thumbnail: url })}
                  />
                  <AdminField label="Alt image principale">
                    <AdminInput value={editingProject.imageAlt ?? ""} onChange={(e) => setEP({ imageAlt: e.target.value })} />
                  </AdminField>
                  <GalleryUploadField
                    label="Galerie"
                    value={editingProject.gallery ?? []}
                    onChange={(urls) => setEP({ gallery: urls })}
                    hint="Cliquez les flèches pour réordonner"
                  />
                </div>
              </section>

              {/* ── Vidéos ── */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">Vidéos</h3>
                <VideoUploadField
                  label="Vidéos du projet"
                  value={editingProject.videos ?? []}
                  onChange={(urls) => setEP({ videos: urls })}
                  hint="MP4, WebM, MOV — max 200 Mo"
                />
              </section>

              {/* ── Visibilité ── */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">Visibilité</h3>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="proj-visibility"
                      checked={editingProject.published !== false}
                      onChange={() => setEP({ published: true })}
                      className="accent-neon-pink"
                    />
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="text-green-400 font-medium">Public</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="proj-visibility"
                      checked={editingProject.published === false}
                      onChange={() => setEP({ published: false })}
                      className="accent-neon-pink"
                    />
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      <span className="text-red-400 font-medium">Masqué</span>
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-white/30">
                  Public = visible sur le site. Masqué = caché sans être supprimé.
                </p>
              </section>

              {/* ── SEO ── */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">SEO</h3>
                <div className="space-y-3">
                  <AdminField label="SEO Titre" hint="Laissez vide pour utiliser le titre du projet">
                    <AdminInput value={editingProject.seoTitle ?? ""} onChange={(e) => setEP({ seoTitle: e.target.value })} />
                  </AdminField>
                  <AdminField label="SEO Description" hint="Laissez vide pour utiliser la description courte">
                    <AdminTextarea value={editingProject.seoDescription ?? ""} onChange={(e) => setEP({ seoDescription: e.target.value })} className="min-h-[80px]" />
                  </AdminField>
                </div>
              </section>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
              <AdminButton variant="ghost" onClick={() => setEditingProject(null)}>Annuler</AdminButton>
              <AdminButton variant="primary" onClick={saveProject} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
