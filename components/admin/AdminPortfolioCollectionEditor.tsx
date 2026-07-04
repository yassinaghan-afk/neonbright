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
import { sortByOrder } from "@/lib/cms/normalize";
import {
  filterCategoriesForCollection,
  filterProjectsForCollection,
  getCollectionConfig,
  mergeCategoryOrder,
  reorderProjectsInCategory,
  type PortfolioCollectionKey,
} from "@/lib/cms/portfolio-collections";
import type { CMSPortfolioCategory, CMSPortfolioProject } from "@/lib/cms/types";

type Tab = "categories" | "projects";
type VisibilityFilter = "all" | "public" | "hidden";

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

type AdminPortfolioCollectionEditorProps = {
  collectionKey: PortfolioCollectionKey;
  showBrandFields?: boolean;
};

export function AdminPortfolioCollectionEditor({
  collectionKey,
  showBrandFields = false,
}: AdminPortfolioCollectionEditorProps) {
  const config = getCollectionConfig(collectionKey);
  const [tab, setTab] = useState<Tab>("projects");
  const [categories, setCategories] = useState<CMSPortfolioCategory[]>([]);
  const [projects, setProjects] = useState<CMSPortfolioProject[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [editingCategory, setEditingCategory] = useState<Partial<CMSPortfolioCategory> | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<CMSPortfolioProject> | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [projectMsg, setProjectMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const collectionCategories = useMemo(
    () => sortByOrder(filterCategoriesForCollection(categories, collectionKey)),
    [categories, collectionKey]
  );

  const primaryCategory = collectionCategories[0];

  const collectionProjects = useMemo(
    () =>
      sortByOrder(
        filterProjectsForCollection(projects, categories, collectionKey)
      ),
    [projects, categories, collectionKey]
  );

  const filteredProjects = useMemo(() => {
    if (visibilityFilter === "public") {
      return collectionProjects.filter((project) => project.published);
    }
    if (visibilityFilter === "hidden") {
      return collectionProjects.filter((project) => !project.published);
    }
    return collectionProjects;
  }, [collectionProjects, visibilityFilter]);

  const load = async () => {
    const res = await fetch(`/api/portfolio?t=${Date.now()}`, { cache: "no-store" });
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

  useEffect(() => {
    void load();
  }, []);

  const callSave = async (url: string, method: string, body: unknown) => {
    setSaving(true);
    setMsg(null);
    const result = await adminFetch(url, { method, body: JSON.stringify(body) });
    setSaving(false);
    if (result.error) {
      setMsg({ type: "error", text: result.error });
      return false;
    }
    return true;
  };

  const saveCategory = async () => {
    if (!editingCategory?.title || !editingCategory.slug) {
      setMsg({ type: "error", text: "Titre et slug requis." });
      return;
    }
    const ok = isNewCategory
      ? await callSave("/api/admin/portfolio/categories", "POST", editingCategory)
      : await callSave(
          `/api/admin/portfolio/categories/${editingCategory.id}`,
          "PUT",
          editingCategory
        );
    if (ok) {
      setMsg({ type: "success", text: "Catégorie enregistrée." });
      setEditingCategory(null);
      await load();
    }
  };

  const saveProject = async () => {
    if (!editingProject?.title?.trim() || !editingProject.categoryId) {
      setProjectMsg({ type: "error", text: "Titre et catégorie requis." });
      return;
    }
    setSaving(true);
    setProjectMsg(null);
    const url = isNewProject
      ? "/api/admin/portfolio/projects"
      : `/api/admin/portfolio/projects/${editingProject.id}`;
    const method = isNewProject ? "POST" : "PUT";
    const payload: Partial<CMSPortfolioProject> = {
      ...editingProject,
      categoryId: editingProject.categoryId || primaryCategory?.id,
    };

    if (showBrandFields && Array.isArray(payload.gallery)) {
      payload.images = payload.gallery;
    }

    const result = await adminFetch(url, {
      method,
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (result.error) {
      setProjectMsg({ type: "error", text: result.error });
      return;
    }
    setMsg({ type: "success", text: "Projet enregistré." });
    setEditingProject(null);
    setProjectMsg(null);
    await load();
  };

  const duplicateProject = async (project: CMSPortfolioProject) => {
    const dup = {
      ...project,
      title: `${project.title} (copie)`,
      slug: `${project.slug}-copy-${Date.now()}`,
      published: false,
    };
    const { id: _id, ...rest } = dup as CMSPortfolioProject;
    await callSave("/api/admin/portfolio/projects", "POST", rest);
    await load();
  };

  const moveCategory = async (index: number, dir: "up" | "down") => {
    const list = [...collectionCategories];
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    const reordered = list.map((category, i) => ({ ...category, sortOrder: i }));
    const merged = mergeCategoryOrder(categories, reordered);
    setCategories(merged);
    await adminFetch("/api/admin/portfolio/categories", {
      method: "PUT",
      body: JSON.stringify(merged),
    });
  };

  const moveProject = async (index: number, dir: "up" | "down") => {
    if (!primaryCategory) return;

    const list = [...filteredProjects];
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];

    const orderedIds = list.map((project) => project.id);
    const all = reorderProjectsInCategory(projects, primaryCategory.id, orderedIds);

    setMsg(null);
    setProjects(all);
    const subset = all.filter((project) => project.categoryId === primaryCategory.id);
    const result = await adminFetch(
      `/api/admin/portfolio/projects?categoryId=${encodeURIComponent(primaryCategory.id)}`,
      {
        method: "PUT",
        body: JSON.stringify(subset),
      }
    );
    if (result.error) {
      setMsg({ type: "error", text: result.error });
      await load();
      return;
    }
    setMsg({ type: "success", text: "Ordre enregistré." });
    await load();
  };

  const togglePublished = async (project: CMSPortfolioProject) => {
    await adminFetch(`/api/admin/portfolio/projects/${project.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...project, published: !project.published }),
    });
    await load();
  };

  const toggleCategory = async (category: CMSPortfolioCategory) => {
    await adminFetch(`/api/admin/portfolio/categories/${category.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...category, enabled: !category.enabled }),
    });
    await load();
  };

  const deleteCategory = async (category: CMSPortfolioCategory) => {
    if (!confirm(`Supprimer "${category.titleAccent || category.slug}" et tous ses projets ?`)) {
      return;
    }
    const result = await adminFetch(`/api/admin/portfolio/categories/${category.id}`, {
      method: "DELETE",
    });
    if (result.error) {
      setMsg({ type: "error", text: result.error });
      return;
    }
    setCategories((prev) => prev.filter((item) => item.id !== category.id));
    setProjects((prev) => prev.filter((item) => item.categoryId !== category.id));
    setMsg({ type: "success", text: "Catégorie supprimée." });
    await load();
  };

  const deleteProject = async (project: CMSPortfolioProject) => {
    if (!confirm(`Supprimer "${project.title}" ?`)) return;
    const result = await adminFetch(`/api/admin/portfolio/projects/${project.id}`, {
      method: "DELETE",
    });
    if (result.error) {
      setMsg({ type: "error", text: result.error });
      return;
    }
    setProjects((prev) => prev.filter((item) => item.id !== project.id));
    setMsg({ type: "success", text: "Projet supprimé." });
    await load();
  };

  const setEP = (patch: Partial<CMSPortfolioProject>) =>
    setEditingProject((prev) => (prev ? { ...prev, ...patch } : prev));

  const openNewCategory = () => {
    setEditingCategory({
      slug: config.slug,
      title: "Réalisations pour",
      titleAccent: config.label,
      description: "",
      coverImage: "",
      coverAlt: "",
      heroImage: "",
      href: config.defaultHref,
      pageTitle: config.pageTitleDefault,
      pageSubtitle: "",
      enabled: true,
      sortOrder: collectionCategories.length,
    });
    setIsNewCategory(true);
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/35">Portfolio</p>
          <h1 className="font-display text-2xl font-bold">{config.adminTitle}</h1>
          <p className="text-sm text-white/45">
            {config.adminDescription} — {collectionProjects.length} projet
            {collectionProjects.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <AdminButton
            variant={tab === "categories" ? "primary" : "secondary"}
            onClick={() => setTab("categories")}
          >
            {config.adminTitle} Categories
          </AdminButton>
          <AdminButton
            variant={tab === "projects" ? "primary" : "secondary"}
            onClick={() => setTab("projects")}
          >
            {config.adminTitle} Projects
          </AdminButton>
        </div>
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

      {tab === "categories" && (
        <>
          {collectionCategories.length === 0 && (
            <div className="mb-4 flex justify-end">
              <AdminButton variant="primary" onClick={openNewCategory}>
                + Nouvelle catégorie
              </AdminButton>
            </div>
          )}
          <div className="space-y-3">
            {collectionCategories.map((category, index) => (
              <AdminCard
                key={category.id}
                title={`${category.title} ${category.titleAccent}`}
                actions={
                  <div className="flex flex-wrap gap-1">
                    <AdminButton
                      variant="ghost"
                      className="px-2 text-xs"
                      onClick={() => moveCategory(index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      className="px-2 text-xs"
                      onClick={() => moveCategory(index, "down")}
                      disabled={index === collectionCategories.length - 1}
                    >
                      ↓
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      className={`text-xs ${category.enabled ? "text-green-400" : "text-white/30"}`}
                      onClick={() => toggleCategory(category)}
                    >
                      {category.enabled ? "Visible" : "Masqué"}
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        setEditingCategory(category);
                        setIsNewCategory(false);
                      }}
                    >
                      Éditer
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      className="text-xs text-red-400"
                      onClick={() => deleteCategory(category)}
                    >
                      Suppr.
                    </AdminButton>
                  </div>
                }
              >
                <p className="line-clamp-2 text-sm text-white/55">{category.description}</p>
                <p className="mt-1 text-xs text-white/35">
                  {category.href} ·{" "}
                  {collectionProjects.filter((project) => project.categoryId === category.id).length}{" "}
                  projets
                </p>
              </AdminCard>
            ))}
            {collectionCategories.length === 0 && (
              <p className="py-8 text-center text-sm text-white/30">
                Aucune catégorie {config.label.toLowerCase()} pour le moment.
              </p>
            )}
          </div>
        </>
      )}

      {tab === "projects" && (
        <>
          {!primaryCategory ? (
            <AdminAlert
              type="error"
              message={`Créez d'abord une catégorie ${config.label} dans l'onglet Categories.`}
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
                    {(["all", "public", "hidden"] as VisibilityFilter[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setVisibilityFilter(value)}
                        className={`px-3 py-1.5 capitalize transition-colors ${
                          visibilityFilter === value
                            ? "bg-white/10 text-white"
                            : "text-white/45 hover:text-white"
                        }`}
                      >
                        {value === "all"
                          ? "Tous"
                          : value === "public"
                            ? "🟢 Public"
                            : "🔴 Masqués"}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-white/30">
                    {filteredProjects.length} résultats · {primaryCategory.titleAccent || primaryCategory.slug}
                  </span>
                </div>
                <AdminButton
                  variant="primary"
                  onClick={() => {
                    setEditingProject(
                      emptyProject(primaryCategory.id, collectionProjects.length) as Partial<CMSPortfolioProject>
                    );
                    setIsNewProject(true);
                    setProjectMsg(null);
                  }}
                >
                  + Nouveau projet
                </AdminButton>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <AdminCard
                    key={project.id}
                    title={project.title}
                    actions={
                      <div className="flex flex-wrap gap-1">
                        <AdminButton
                          variant="ghost"
                          className="px-2 text-xs"
                          onClick={() => moveProject(index, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          className="px-2 text-xs"
                          onClick={() => moveProject(index, "down")}
                          disabled={index === filteredProjects.length - 1}
                        >
                          ↓
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          className="text-xs"
                          onClick={() => {
                            setEditingProject(project);
                            setIsNewProject(false);
                            setProjectMsg(null);
                          }}
                        >
                          Éditer
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          className="text-xs text-neon-purple"
                          onClick={() => duplicateProject(project)}
                        >
                          Dupliquer
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          className="text-xs text-red-400"
                          onClick={() => deleteProject(project)}
                        >
                          Suppr.
                        </AdminButton>
                      </div>
                    }
                  >
                    {(project.featuredImage || project.coverImage) && (
                      <div className="relative mb-3 h-28 overflow-hidden rounded-lg">
                        <Image
                          src={project.featuredImage || project.coverImage}
                          alt={project.imageAlt || project.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white/45">
                        {project.city} {project.year}
                      </p>
                      <AdminBadge status={project.published ? "public" : "hidden"} />
                    </div>
                    <div className="mt-2">
                      <AdminButton
                        variant="ghost"
                        className="text-xs"
                        onClick={() => togglePublished(project)}
                      >
                        {project.published ? "→ Masquer" : "→ Publier"}
                      </AdminButton>
                    </div>
                  </AdminCard>
                ))}
                {filteredProjects.length === 0 && (
                  <p className="col-span-full py-8 text-center text-sm text-white/30">
                    Aucun projet {config.label.toLowerCase()} dans ce filtre.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d0d] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">
              {isNewCategory ? "Nouvelle catégorie" : "Modifier la catégorie"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Slug (URL)" required hint={`ex: ${config.slug}`}>
                <AdminInput
                  value={editingCategory.slug ?? ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                />
              </AdminField>
              <AdminField label="Lien href">
                <AdminInput
                  value={editingCategory.href ?? ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, href: e.target.value })}
                />
              </AdminField>
              <AdminField label="Titre">
                <AdminInput
                  value={editingCategory.title ?? ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                />
              </AdminField>
              <AdminField label="Titre accent (dégradé)">
                <AdminInput
                  value={editingCategory.titleAccent ?? ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, titleAccent: e.target.value })
                  }
                />
              </AdminField>
              <div className="sm:col-span-2">
                <AdminField label="Description (carte accueil)">
                  <AdminTextarea
                    value={editingCategory.description ?? ""}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, description: e.target.value })
                    }
                  />
                </AdminField>
              </div>
              <AdminField label="Titre page listing">
                <AdminInput
                  value={editingCategory.pageTitle ?? ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, pageTitle: e.target.value })
                  }
                />
              </AdminField>
              <AdminField label="Sous-titre page listing">
                <AdminInput
                  value={editingCategory.pageSubtitle ?? ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, pageSubtitle: e.target.value })
                  }
                />
              </AdminField>
              <div className="sm:col-span-2">
                <ImageUploadField
                  label="Image de couverture"
                  value={editingCategory.coverImage ?? ""}
                  onChange={(url) =>
                    setEditingCategory({
                      ...editingCategory,
                      coverImage: url,
                      heroImage: url,
                    })
                  }
                />
              </div>
              <AdminField label="Alt image de couverture">
                <AdminInput
                  value={editingCategory.coverAlt ?? ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, coverAlt: e.target.value })
                  }
                />
              </AdminField>
              <div className="flex items-center gap-2 self-end pb-1">
                <input
                  type="checkbox"
                  id="cat-enabled"
                  checked={editingCategory.enabled !== false}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, enabled: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="cat-enabled" className="text-sm text-white/70">
                  Visible sur le site
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditingCategory(null)}>
                Annuler
              </AdminButton>
              <AdminButton variant="primary" onClick={saveCategory} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

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

            {projectMsg && (
              <div className="mb-4">
                <AdminAlert type={projectMsg.type} message={projectMsg.text} />
              </div>
            )}

            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
                  Identité
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminField label="Catégorie" required>
                    <AdminInput
                      value={primaryCategory?.titleAccent || primaryCategory?.slug || ""}
                      disabled
                    />
                  </AdminField>
                  <AdminField label="Slug (URL)">
                    <AdminInput
                      value={editingProject.slug ?? ""}
                      onChange={(e) => setEP({ slug: e.target.value })}
                      placeholder="auto-généré si vide"
                    />
                  </AdminField>
                  <div className="sm:col-span-2">
                    <AdminField label="Titre" required>
                      <AdminInput
                        value={editingProject.title ?? ""}
                        onChange={(e) => setEP({ title: e.target.value })}
                      />
                    </AdminField>
                  </div>
                  <div className="sm:col-span-2">
                    <AdminField label="Sous-titre">
                      <AdminInput
                        value={editingProject.subtitle ?? ""}
                        onChange={(e) => setEP({ subtitle: e.target.value })}
                      />
                    </AdminField>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
                  Détails
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminField label="Client">
                    <AdminInput
                      value={editingProject.client ?? ""}
                      onChange={(e) => setEP({ client: e.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Année">
                    <AdminInput
                      value={editingProject.year ?? ""}
                      onChange={(e) => setEP({ year: e.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Ville">
                    <AdminInput
                      value={editingProject.city ?? ""}
                      onChange={(e) => setEP({ city: e.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Pays">
                    <AdminInput
                      value={editingProject.country ?? ""}
                      onChange={(e) => setEP({ country: e.target.value })}
                    />
                  </AdminField>
                  {showBrandFields && (
                    <>
                      <AdminField label="Type / Label">
                        <AdminInput
                          value={editingProject.typeLabel ?? ""}
                          onChange={(e) => setEP({ typeLabel: e.target.value })}
                        />
                      </AdminField>
                      <AdminField label="Type d'installation">
                        <AdminInput
                          value={editingProject.installationType ?? ""}
                          onChange={(e) => setEP({ installationType: e.target.value })}
                        />
                      </AdminField>
                      <div className="sm:col-span-2">
                        <AdminField label="Fichier logo (nom dans /media/logo/)">
                          <AdminInput
                            value={editingProject.logoFile ?? ""}
                            onChange={(e) => setEP({ logoFile: e.target.value })}
                            placeholder="PHOTO-2026-06-23-18-20-29.jpg"
                          />
                        </AdminField>
                      </div>
                      <AdminField label="Technologies (virgule)">
                        <AdminInput
                          value={(editingProject.technologies ?? []).join(", ")}
                          onChange={(e) =>
                            setEP({
                              technologies: e.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </AdminField>
                    </>
                  )}
                  {!showBrandFields && (
                    <>
                      <AdminField label="Technologies (virgule)">
                        <AdminInput
                          value={(editingProject.technologies ?? []).join(", ")}
                          onChange={(e) =>
                            setEP({
                              technologies: e.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </AdminField>
                      <AdminField label="Filtres (virgule)">
                        <AdminInput
                          value={(editingProject.filters ?? []).join(", ")}
                          onChange={(e) =>
                            setEP({
                              filters: e.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </AdminField>
                    </>
                  )}
                  <AdminField label="Tags (virgule)">
                    <AdminInput
                      value={(editingProject.tags ?? []).join(", ")}
                      onChange={(e) =>
                        setEP({
                          tags: e.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </AdminField>
                  <AdminField label="Accent">
                    <AdminSelect
                      value={editingProject.accent ?? "neon-pink"}
                      onChange={(e) =>
                        setEP({ accent: e.target.value as CMSPortfolioProject["accent"] })
                      }
                    >
                      <option value="neon-pink">Neon Pink</option>
                      <option value="neon-purple">Neon Purple</option>
                      <option value="neon-blue">Neon Blue</option>
                    </AdminSelect>
                  </AdminField>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
                  Descriptions
                </h3>
                <div className="space-y-3">
                  <AdminField label="Description courte">
                    <AdminTextarea
                      value={editingProject.shortDescription ?? ""}
                      onChange={(e) => setEP({ shortDescription: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </AdminField>
                  <AdminField label="Description complète">
                    <AdminTextarea
                      value={editingProject.description ?? ""}
                      onChange={(e) => setEP({ description: e.target.value })}
                      className="min-h-[120px]"
                    />
                  </AdminField>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
                  Images
                </h3>
                {showBrandFields ? (
                  <GalleryUploadField
                    label="Galerie"
                    value={editingProject.gallery ?? []}
                    onChange={(urls) => setEP({ gallery: urls, images: urls })}
                    hint="Cliquez les flèches pour réordonner"
                  />
                ) : (
                  <div className="space-y-4">
                    <ImageUploadField
                      label="Image principale (featured)"
                      value={editingProject.featuredImage ?? ""}
                      onChange={(url) => setEP({ featuredImage: url, coverImage: url })}
                      preset="gallery"
                    />
                    <ImageUploadField
                      label="Miniature"
                      value={editingProject.thumbnail ?? ""}
                      onChange={(url) => setEP({ thumbnail: url })}
                      preset="thumbnail"
                    />
                    <AdminField label="Alt image principale">
                      <AdminInput
                        value={editingProject.imageAlt ?? ""}
                        onChange={(e) => setEP({ imageAlt: e.target.value })}
                      />
                    </AdminField>
                    <GalleryUploadField
                      label="Galerie"
                      value={editingProject.gallery ?? []}
                      onChange={(urls) => setEP({ gallery: urls })}
                      hint="Cliquez les flèches pour réordonner"
                    />
                  </div>
                )}
              </section>

              {!showBrandFields && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
                    Vidéos
                  </h3>
                  <VideoUploadField
                    label="Vidéos du projet"
                    value={editingProject.videos ?? []}
                    onChange={(urls) => setEP({ videos: urls })}
                    hint="MP4, WebM, MOV — max 200 Mo"
                  />
                </section>
              )}

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
                  Visibilité
                </h3>
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
                      <span className="font-medium text-green-400">Public</span>
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
                      <span className="font-medium text-red-400">Masqué</span>
                    </span>
                  </label>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
                  SEO
                </h3>
                <div className="space-y-3">
                  <AdminField label="SEO Titre">
                    <AdminInput
                      value={editingProject.seoTitle ?? ""}
                      onChange={(e) => setEP({ seoTitle: e.target.value })}
                    />
                  </AdminField>
                  <AdminField label="SEO Description">
                    <AdminTextarea
                      value={editingProject.seoDescription ?? ""}
                      onChange={(e) => setEP({ seoDescription: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </AdminField>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-white/10 bg-[#0d0d0d] pt-4">
              <AdminButton
                variant="ghost"
                onClick={() => {
                  setEditingProject(null);
                  setProjectMsg(null);
                }}
              >
                Annuler
              </AdminButton>
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
