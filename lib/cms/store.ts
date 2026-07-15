import { promises as fs } from "fs";
import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getDefaultCMSContent } from "@/lib/cms/defaults";
import { ensureBrandsPageProjects } from "@/lib/cms/brands-page-seed";
import {
  brandHeroSlidesStale,
  getExpectedHeroSlidesFromMedia,
  isHeroMediaOutOfSync,
  isHeroMediaSyncEnabled,
  refreshBrandHeroSlides,
  shouldSeedBrandHeroSlides,
} from "@/lib/cms/hero-media";
import { normalizeHeroSlides, normalizePartners } from "@/lib/cms/normalize";
import { normalizeTestimonials } from "@/lib/cms/testimonials";
import type { CMSContent } from "@/lib/cms/types";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import { logCmsSync } from "@/lib/cms/sync-log";
import { atomicWriteFile } from "@/lib/cms/atomic-fs";
import {
  getBundledCmsSeedPath,
  getCmsContentPath,
  getStorageRoot,
} from "@/lib/cms/storage-paths";
import { ensureUploadDirectories } from "@/lib/cms/upload-storage";
import { FileLock } from "@/lib/cms/file-lock";
import { createBackup } from "@/lib/cms/backup";
import { getCmsStorageMode } from "@/lib/cms/repository/types";

const LEGACY_TESTIMONIALS_HEADLINE = "La confiance des grandes marques";
const TESTIMONIALS_HEADLINE = "Ils nous font confiance";

/**
 * Module-level state for bootstrap and lock.
 * NOTE: memoryCMS removed to prevent stale reads across requests.
 */
let bootstrapPromise: Promise<void> | null = null;
const cmsLock = new FileLock(getCmsContentPath());

function applyContentMigrations(content: CMSContent): CMSContent {
  if (content.sectionCopy.testimonials.headline !== LEGACY_TESTIMONIALS_HEADLINE) {
    return content;
  }
  return {
    ...content,
    sectionCopy: {
      ...content.sectionCopy,
      testimonials: {
        ...content.sectionCopy.testimonials,
        headline: TESTIMONIALS_HEADLINE,
      },
    },
  };
}

/**
 * One-time bootstrap:
 * - If STORAGE_ROOT/cms-content.json exists → never overwrite.
 * - If missing → copy bundled data/cms-content.json atomically.
 * Never replaces an existing runtime CMS with defaults.
 */
function isNextProductionBuild(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

async function ensureCmsBootstrap(): Promise<void> {
  // Never write STORAGE_ROOT during `next build` (collect page data).
  if (isNextProductionBuild()) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await fs.mkdir(getStorageRoot(), { recursive: true });
      await ensureUploadDirectories();

      const contentPath = getCmsContentPath();
      try {
        await fs.access(contentPath);
        console.log(
          `[cms-store] bootstrap skipped — existing CMS at ${contentPath}`
        );
        return;
      } catch {
        /* missing — seed once */
      }

      const seedPath = getBundledCmsSeedPath();
      try {
        const seed = await fs.readFile(seedPath, "utf-8");
        JSON.parse(seed); // validate
        await atomicWriteFile(contentPath, seed, "utf-8");
        console.log(
          `[cms-store] bootstrap performed — copied ${seedPath} → ${contentPath}`
        );
      } catch (err) {
        console.error(
          "[cms-store] bootstrap failed — runtime CMS missing and seed unreadable:",
          err instanceof Error ? err.message : err
        );
      }
    })();
  }
  await bootstrapPromise;
}

function mergeHero(
  defaults: CMSContent["hero"],
  parsed: Partial<CMSContent["hero"]> | undefined
): CMSContent["hero"] {
  const merged = { ...defaults, ...(parsed ?? {}) };
  return {
    ...merged,
    trustBlock: {
      ...defaults.trustBlock,
      ...(parsed?.trustBlock ?? {}),
    },
  };
}

function mergeContent(parsed: Partial<CMSContent>): CMSContent {
  const defaults = getDefaultCMSContent();
  return {
    ...defaults,
    ...parsed,
    hero: mergeHero(defaults.hero, parsed.hero),
    heroSlides: normalizeHeroSlides(parsed.heroSlides, defaults.heroSlides),
    partners: normalizePartners(parsed.partners, defaults.partners),
    brandsPageLogos:
      parsed.brandsPageLogos !== undefined
        ? normalizePartners(parsed.brandsPageLogos, [])
        : normalizePartners(parsed.partners, []),
    projects: Array.isArray(parsed.projects) ? parsed.projects : defaults.projects,
    portfolioCategories: Array.isArray(parsed.portfolioCategories)
      ? parsed.portfolioCategories
      : defaults.portfolioCategories,
    portfolioProjects: Array.isArray(parsed.portfolioProjects)
      ? parsed.portfolioProjects
      : defaults.portfolioProjects,
    testimonials: normalizeTestimonials(parsed.testimonials, defaults.testimonials),
    services: parsed.services?.length ? parsed.services : defaults.services,
    faq: parsed.faq?.length ? parsed.faq : defaults.faq,
    features: parsed.features?.length ? parsed.features : defaults.features,
    industries: parsed.industries?.length ? parsed.industries : defaults.industries,
    processSteps: parsed.processSteps?.length ? parsed.processSteps : defaults.processSteps,
    sectionCopy: {
      ...defaults.sectionCopy,
      ...(parsed.sectionCopy ?? {}),
      portfolio: { ...defaults.sectionCopy.portfolio, ...(parsed.sectionCopy?.portfolio ?? {}) },
      services: { ...defaults.sectionCopy.services, ...(parsed.sectionCopy?.services ?? {}) },
      industries: { ...defaults.sectionCopy.industries, ...(parsed.sectionCopy?.industries ?? {}) },
      testimonials: {
        ...defaults.sectionCopy.testimonials,
        ...(parsed.sectionCopy?.testimonials ?? {}),
      },
      process: { ...defaults.sectionCopy.process, ...(parsed.sectionCopy?.process ?? {}) },
      faq: { ...defaults.sectionCopy.faq, ...(parsed.sectionCopy?.faq ?? {}) },
      cta: { ...defaults.sectionCopy.cta, ...(parsed.sectionCopy?.cta ?? {}) },
    },
    instagram: { ...defaults.instagram, ...(parsed.instagram ?? {}) },
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : defaults.reviews,
    instagramPosts: Array.isArray(parsed.instagramPosts)
      ? parsed.instagramPosts
      : defaults.instagramPosts,
    instagramReels: Array.isArray(parsed.instagramReels)
      ? parsed.instagramReels
      : defaults.instagramReels,
    nav: parsed.nav?.length ? parsed.nav : defaults.nav,
    company: { ...defaults.company, ...(parsed.company ?? {}) },
    contact: { ...defaults.contact, ...(parsed.contact ?? {}) },
    social: { ...defaults.social, ...(parsed.social ?? {}) },
    seo: { ...defaults.seo, ...(parsed.seo ?? {}) },
    heroMediaVersion: parsed.heroMediaVersion,
    updatedAt: parsed.updatedAt ?? defaults.updatedAt,
  };
}

function applyBrandHeroSlides(
  content: CMSContent,
  slides: CMSContent["heroSlides"],
  mediaVersion: string
): CMSContent {
  if (!slides.length) return content;
  return {
    ...content,
    heroSlides: slides,
    heroMediaVersion: mediaVersion,
    hero: {
      ...content.hero,
      backgroundImage: slides[0].src,
    },
  };
}

async function maybeSyncHeroFromMedia(
  parsed: Partial<CMSContent>,
  content: CMSContent
): Promise<{ content: CMSContent; changed: boolean }> {
  if (!isHeroMediaSyncEnabled()) {
    return { content, changed: false };
  }

  const outOfSync = await isHeroMediaOutOfSync();
  const needsSeed = shouldSeedBrandHeroSlides(parsed.heroSlides);
  const expected = await getExpectedHeroSlidesFromMedia();
  const staleList = brandHeroSlidesStale(parsed.heroSlides, expected);

  if (!outOfSync && !needsSeed && !staleList) {
    return { content, changed: false };
  }

  const result = await refreshBrandHeroSlides(true);
  if (!result.slides.length) return { content, changed: false };

  const next = applyBrandHeroSlides(content, result.slides, result.mediaVersion);
  const changed =
    next.heroMediaVersion !== parsed.heroMediaVersion ||
    brandHeroSlidesStale(parsed.heroSlides, next.heroSlides);

  return { content: next, changed };
}

async function readCMSFileFromDisk(): Promise<Partial<CMSContent> | null> {
  try {
    const raw = await fs.readFile(getCmsContentPath(), "utf-8");
    return JSON.parse(raw) as Partial<CMSContent>;
  } catch {
    return null;
  }
}

type LoadCMSOptions = {
  bypassMemory?: boolean;
};

async function loadCMSContent(options?: LoadCMSOptions): Promise<CMSContent> {
  // CRITICAL: noStore() must be called BEFORE any try/catch to ensure Next.js
  // dynamic-rendering error propagates correctly. If caught, pages return 500.
  noStore();

  try {
    await ensureCmsBootstrap();
    const parsed = await readCMSFileFromDisk();

    if (!parsed) {
      console.warn(
        "[cms-store] runtime CMS missing — serving defaults (read-only; not persisted)"
      );
      return applyContentMigrations(getDefaultCMSContent());
    }

    let content = applyContentMigrations(mergeContent(parsed));
    let persistNeeded = false;

    const brandsRestore = ensureBrandsPageProjects(content);
    content = brandsRestore.content;
    if (brandsRestore.changed) persistNeeded = true;

    const { content: synced, changed: heroChanged } = await maybeSyncHeroFromMedia(
      parsed,
      content
    );
    content = synced;
    if (heroChanged) persistNeeded = true;

    if (persistNeeded) {
      try {
        content = await writeCMSContent(content);
      } catch (err) {
        console.error("[cms-store] auto-persist failed:", err);
        // Return content anyway, will retry on next load
      }
    }

    return content;
  } catch (err) {
    console.error("[cms-store] load failed, using defaults:", err);
    return applyContentMigrations(getDefaultCMSContent());
  }
}

/**
 * CMS_STORAGE=postgres: reads/writes go to PostgreSQL (JSON becomes read-only
 * rollback data). compare mode reads JSON and diff-logs PostgreSQL in the
 * background (handled by the repository layer). Default json.
 */
async function loadFromPostgres(): Promise<CMSContent> {
  noStore();
  const { PostgresCmsRepository } = await import(
    "@/lib/cms/repository/postgres-repository"
  );
  return new PostgresCmsRepository().getContent();
}

/** compare mode: serve JSON, diff PostgreSQL in the background (read-only). */
function comparePostgresInBackground(jsonContent: CMSContent): void {
  void (async () => {
    try {
      const pg = await loadFromPostgres();
      const collections: Array<[string, unknown[], unknown[]]> = [
        ["portfolioProjects", jsonContent.portfolioProjects ?? [], pg.portfolioProjects ?? []],
        ["testimonials", jsonContent.testimonials ?? [], pg.testimonials ?? []],
        ["reviews", jsonContent.reviews ?? [], pg.reviews ?? []],
        ["instagramPosts", jsonContent.instagramPosts ?? [], pg.instagramPosts ?? []],
        ["heroSlides", jsonContent.heroSlides ?? [], pg.heroSlides ?? []],
        ["partners", jsonContent.partners ?? [], pg.partners ?? []],
      ];
      for (const [label, a, b] of collections) {
        if (a.length !== b.length) {
          console.warn(`[cms-compare] ${label}: count ${a.length} (json) ≠ ${b.length} (pg)`);
        }
      }
    } catch (err) {
      console.warn(
        "[cms-compare] postgres read failed:",
        err instanceof Error ? err.message.split("\n")[0] : err
      );
    }
  })();
}

export const readCMSContent: () => Promise<CMSContent> = cache(
  async (): Promise<CMSContent> => {
    const mode = getCmsStorageMode();
    if (mode === "postgres") return loadFromPostgres();
    const content = await loadCMSContent();
    if (mode === "compare") comparePostgresInBackground(content);
    return content;
  }
);

export async function readCMSContentFresh(): Promise<CMSContent> {
  if (getCmsStorageMode() === "postgres") return loadFromPostgres();
  return loadCMSContent({ bypassMemory: true });
}

async function writeToPostgres(content: CMSContent): Promise<CMSContent> {
  const { writeContentToPostgres } = await import(
    "@/lib/cms/repository/postgres-writer"
  );
  const saved = await writeContentToPostgres(content);
  revalidatePublicSite();
  logCmsSync("storage-updated", {
    storage: "postgres",
    revision: saved.revision,
    updatedAt: saved.updatedAt,
    testimonials: saved.testimonials.length,
    reviews: saved.reviews?.length ?? 0,
    portfolioProjects: saved.portfolioProjects?.length ?? 0,
  });
  return saved;
}

export async function writeCMSContent(content: CMSContent): Promise<CMSContent> {
  if (getCmsStorageMode() === "postgres") {
    return writeToPostgres(content);
  }
  // Acquire exclusive lock to prevent concurrent writes.
  return await cmsLock.withLock(async () => {
    await ensureCmsBootstrap();
    const contentPath = getCmsContentPath();

    // Increment revision for optimistic concurrency control.
    const currentRevision = content.revision ?? 0;
    const next = applyContentMigrations({
      ...content,
      updatedAt: new Date().toISOString(),
      revision: currentRevision + 1,
    });

    logCmsSync("save", {
      revision: next.revision,
      updatedAt: next.updatedAt,
      testimonials: next.testimonials.length,
      reviews: next.reviews?.length ?? 0,
      portfolioProjects: next.portfolioProjects?.length ?? 0,
      publishedProjects: next.portfolioProjects?.filter((p) => p.published).length ?? 0,
    });

    // Create backup before writing (non-fatal if it fails).
    try {
      await createBackup(contentPath);
    } catch (err) {
      console.warn("[cms-store] backup failed (continuing anyway):", err);
    }

    // Atomic write: temp file + rename.
    await atomicWriteFile(
      contentPath,
      JSON.stringify(next, null, 2),
      "utf-8"
    );

    // Invalidate public caches.
    revalidatePublicSite();

    logCmsSync("storage-updated", {
      storage: "local",
      path: contentPath,
      revision: next.revision,
      updatedAt: next.updatedAt,
      testimonials: next.testimonials.length,
      reviews: next.reviews?.length ?? 0,
      portfolioProjects: next.portfolioProjects?.length ?? 0,
      publishedProjects: next.portfolioProjects?.filter((p) => p.published).length ?? 0,
      projectIds: next.portfolioProjects
        ?.map((p) => `${p.id}:${p.published ? "pub" : "hid"}`)
        .join(","),
    });

    return next;
  }, { timeout: 30000 });
}

export async function updateCMSContent(
  updater: (current: CMSContent) => CMSContent
): Promise<CMSContent> {
  if (getCmsStorageMode() === "postgres") {
    // Transactional read-modify-write against PostgreSQL.
    const current = await loadFromPostgres();
    const updated = updater(current);
    return writeToPostgres(updated);
  }

  // CRITICAL: Lock must cover BOTH read and write to prevent lost updates.
  return await cmsLock.withLock(async () => {
    const current = await readCMSContentFresh();
    const updated = updater(current);
    
    await ensureCmsBootstrap();
    const contentPath = getCmsContentPath();

    // Increment revision.
    const currentRevision = updated.revision ?? current.revision ?? 0;
    const next = applyContentMigrations({
      ...updated,
      updatedAt: new Date().toISOString(),
      revision: currentRevision + 1,
    });

    logCmsSync("save", {
      revision: next.revision,
      updatedAt: next.updatedAt,
      testimonials: next.testimonials.length,
      reviews: next.reviews?.length ?? 0,
      portfolioProjects: next.portfolioProjects?.length ?? 0,
      publishedProjects: next.portfolioProjects?.filter((p) => p.published).length ?? 0,
    });

    // Create backup before writing (non-fatal if it fails).
    try {
      await createBackup(contentPath);
    } catch (err) {
      console.warn("[cms-store] backup failed (continuing anyway):", err);
    }

    // Atomic write.
    await atomicWriteFile(
      contentPath,
      JSON.stringify(next, null, 2),
      "utf-8"
    );

    // Invalidate public caches.
    revalidatePublicSite();

    logCmsSync("storage-updated", {
      storage: "local",
      path: contentPath,
      revision: next.revision,
      updatedAt: next.updatedAt,
      testimonials: next.testimonials.length,
      reviews: next.reviews?.length ?? 0,
      portfolioProjects: next.portfolioProjects?.length ?? 0,
      publishedProjects: next.portfolioProjects?.filter((p) => p.published).length ?? 0,
      projectIds: next.portfolioProjects
        ?.map((p) => `${p.id}:${p.published ? "pub" : "hid"}`)
        .join(","),
    });

    return next;
  }, { timeout: 30000 });
}
