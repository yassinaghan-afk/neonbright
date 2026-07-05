import { promises as fs } from "fs";
import path from "path";
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
import {
  shouldUseBlobStorage,
  getBlobCommandOptions,
} from "@/lib/cms/blob-client";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import { logCmsSync } from "@/lib/cms/sync-log";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "cms-content.json");
const VERCEL_CMS_FILE = path.join("/tmp", "neonbright-cms-content.json");

/** Pathname inside the Blob store for the CMS content JSON. */
const CMS_BLOB_PATHNAME = "cms-data/content.json";

const LEGACY_TESTIMONIALS_HEADLINE = "La confiance des grandes marques";
const TESTIMONIALS_HEADLINE = "Ils nous font confiance";

/** One-time content migrations applied on read/write. */
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
 * Module-level in-memory cache.
 * On Vercel: used only as a same-Lambda optimistic overlay after a write.
 *            It is CLEARED (set to null) before every Blob read so that the
 *            Next.js data cache (distributed across all instances) is the
 *            authoritative source.
 * On local dev: used as normal per-process cache.
 */
let memoryCMS: CMSContent | null = null;

/** URL of the CMS blob — cached per Lambda instance to avoid repeated list(). */
let memoryCmsBlobUrl: string | null = null;

/** True only in local development — the bundled data/cms-content.json is writable. */
function canPersistCMS(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

async function ensureDataDir() {
  if (!canPersistCMS()) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Vercel Blob helpers
// ---------------------------------------------------------------------------

function isContentAtLeastAsFresh(
  candidate: Partial<CMSContent> | CMSContent,
  baseline: Partial<CMSContent> | null
): boolean {
  const candidateAt = candidate.updatedAt;
  const baselineAt = baseline?.updatedAt;
  if (!candidateAt) return false;
  if (!baselineAt) return true;
  return new Date(candidateAt).getTime() >= new Date(baselineAt).getTime();
}

/**
 * Read CMS JSON from Vercel Blob.
 *
 * 1. SDK get() when credentials are available — always returns the latest
 *    object (no CDN lag). Works in API routes and Server Actions.
 * 2. Public-URL fetch — auth-free fallback for cold Lambdas / background
 *    revalidations where OIDC is unavailable.
 * 3. In-memory overlay — last resort for 304 Not Modified SDK responses.
 */
async function readCMSFromBlob(): Promise<Partial<CMSContent> | null> {
  // ── PRIMARY: SDK get (fresh, no CDN lag) ─────────────────────────────────
  try {
    const auth = await getBlobCommandOptions();
    const { get } = await import("@vercel/blob");
    const result = await get(CMS_BLOB_PATHNAME, { ...auth, access: "public" });

    if (result) {
      if (result.statusCode === 304 || !result.stream) {
        if (memoryCMS) {
          logCmsSync("storage-read", {
            source: "304-memory-overlay",
            updatedAt: memoryCMS.updatedAt,
          });
          return memoryCMS;
        }
      } else {
        const text = await new Response(result.stream as ReadableStream).text();
        const parsed = JSON.parse(text) as Partial<CMSContent>;
        if (result.blob?.url) memoryCmsBlobUrl = result.blob.url;
        logCmsSync("storage-read", {
          source: "sdk-get",
          updatedAt: parsed.updatedAt,
          testimonials: parsed.testimonials?.length ?? 0,
          portfolioProjects: parsed.portfolioProjects?.length ?? 0,
        });
        return parsed;
      }
    }
  } catch (err) {
    console.warn(
      "[cms-store] blob SDK read skipped:",
      err instanceof Error ? err.message : err
    );
  }

  // ── FALLBACK: auth-free public-URL fetch ─────────────────────────────────
  const storeId = process.env.BLOB_STORE_ID;
  if (storeId) {
    const publicUrl = `https://${storeId}.public.blob.vercel-storage.com/${CMS_BLOB_PATHNAME}`;
    try {
      const res = await fetch(`${publicUrl}?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const parsed = JSON.parse(await res.text()) as Partial<CMSContent>;
        memoryCmsBlobUrl = publicUrl;
        logCmsSync("storage-read", {
          source: "public-url",
          updatedAt: parsed.updatedAt,
          testimonials: parsed.testimonials?.length ?? 0,
          portfolioProjects: parsed.portfolioProjects?.length ?? 0,
        });
        return parsed;
      }
      if (res.status !== 404) {
        console.error("[cms-store] blob public-URL fetch returned:", res.status);
      }
    } catch (err) {
      console.error("[cms-store] blob public-URL fetch failed:", err);
    }
  }

  return null;
}

/** Write the CMS JSON to Vercel Blob and update the cached URL. */
async function writeCMSToBlob(content: CMSContent): Promise<void> {
  const { put } = await import("@vercel/blob");
  const auth = await getBlobCommandOptions();
  const result = await put(CMS_BLOB_PATHNAME, JSON.stringify(content, null, 2), {
    ...auth,
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  memoryCmsBlobUrl = result.url;
}

/**
 * Revalidate the root layout path so any non-dynamic cached pages/layouts
 * under "/" immediately pick up the change.
 */
function tryRevalidateCMS(): void {
  revalidatePublicSite();
}

// ---------------------------------------------------------------------------
// Content merge helpers (unchanged)
// ---------------------------------------------------------------------------

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
      testimonials: { ...defaults.sectionCopy.testimonials, ...(parsed.sectionCopy?.testimonials ?? {}) },
      process: { ...defaults.sectionCopy.process, ...(parsed.sectionCopy?.process ?? {}) },
      faq: { ...defaults.sectionCopy.faq, ...(parsed.sectionCopy?.faq ?? {}) },
      cta: { ...defaults.sectionCopy.cta, ...(parsed.sectionCopy?.cta ?? {}) },
    },
    instagram: { ...defaults.instagram, ...(parsed.instagram ?? {}) },
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
  // On Vercel never read build-time data/cms-content.json — it is stale after deploy.
  const paths = canPersistCMS()
    ? [CONTENT_FILE]
    : process.env.VERCEL
      ? [VERCEL_CMS_FILE]
      : [VERCEL_CMS_FILE, CONTENT_FILE];

  for (const filePath of paths) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as Partial<CMSContent>;
    } catch {
      continue;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

type LoadCMSOptions = {
  /** When true, always read from Blob/disk — never return stale in-memory overlay. */
  bypassMemory?: boolean;
};

/**
 * Load CMS content (uncached implementation).
 * Call via readCMSContent (per-request dedupe) or readCMSContentFresh (always latest).
 */
async function loadCMSContent(options?: LoadCMSOptions): Promise<CMSContent> {
  noStore();

  try {
    let parsed: Partial<CMSContent> | null = null;

    if (shouldUseBlobStorage()) {
      parsed = await readCMSFromBlob();
    } else {
      await ensureDataDir();
      parsed = await readCMSFileFromDisk();
    }

    // Fresh reads must come from blob/disk — never a stale in-memory overlay.
    if (options?.bypassMemory) {
      if (!parsed) {
        if (memoryCMS) {
          console.warn("[cms-store] bypassMemory: blob unreadable — serving memory overlay");
          return applyContentMigrations(memoryCMS);
        }
        if (shouldUseBlobStorage()) {
          console.error(
            "[cms-store] bypassMemory: blob unreadable with no overlay — serving defaults to avoid 500"
          );
          return applyContentMigrations(getDefaultCMSContent());
        }
        throw new Error("CMS content not found");
      }
    } else if (memoryCMS && isContentAtLeastAsFresh(memoryCMS, parsed)) {
      return memoryCMS;
    }

    if (!parsed) {
      if (memoryCMS) {
        console.warn("[cms-store] blob unreadable — serving in-memory overlay");
        return memoryCMS;
      }
      if (shouldUseBlobStorage()) {
        // Serve default content rather than crash with HTTP 500.
        // The blob may be temporarily unavailable; the data is not lost.
        console.error(
          "[cms-store] blob unreadable with no overlay — serving defaults to avoid 500"
        );
        return applyContentMigrations(getDefaultCMSContent());
      }
      throw new Error("CMS content not found");
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
        // Re-read blob before auto-persist so concurrent admin saves are not overwritten.
        if (shouldUseBlobStorage() && parsed?.updatedAt) {
          const latest = await readCMSFromBlob();
          if (
            latest?.updatedAt &&
            new Date(latest.updatedAt).getTime() > new Date(parsed.updatedAt).getTime()
          ) {
            parsed = latest;
            content = applyContentMigrations(mergeContent(latest));
            const latestBrandsRestore = ensureBrandsPageProjects(content);
            content = latestBrandsRestore.content;
            const latestHeroSync = await maybeSyncHeroFromMedia(latest, content);
            content = latestHeroSync.content;
            persistNeeded = latestBrandsRestore.changed || latestHeroSync.changed;
            if (!persistNeeded) {
              return content;
            }
          }
        }
        content = await writeCMSContent(content);
      } catch {
        if (!shouldUseBlobStorage()) memoryCMS = content;
      }
    } else if (!shouldUseBlobStorage()) {
      memoryCMS = content;
    }

    return content;
  } catch (err) {
    console.error("[cms-store] load failed, using defaults:", err);
    return applyContentMigrations(getDefaultCMSContent());
  }
}

/**
 * Read the current CMS content.
 *
 * Wrapped with React.cache() so multiple Server Components on the same page
 * share a single fetch per request.
 */
export const readCMSContent: () => Promise<CMSContent> = cache(loadCMSContent);

/**
 * Authoritative read — always fetches from Blob/disk, never from the
 * in-memory overlay.  Also wrapped in React.cache() so concurrent Server
 * Components on the same page share one blob read per request instead of
 * each issuing their own, while still guaranteeing freshness.
 */
export const readCMSContentFresh: () => Promise<CMSContent> = cache(
  () => loadCMSContent({ bypassMemory: true })
);

/**
 * Persist updated CMS content and invalidate all public caches.
 *
 * On Vercel (Blob configured):
 *   - Writes to Vercel Blob (shared storage).
 *   - Calls revalidateTag(CMS_CACHE_TAG) to bust the distributed Next.js
 *     data cache immediately across every Lambda instance.
 *   - Calls revalidatePath("/", "layout") as belt-and-suspenders.
 *   - Sets memoryCMS for optimistic same-Lambda reads.
 *
 * On local dev:
 *   - Writes to data/cms-content.json.
 *   - Sets memoryCMS.
 */
export async function writeCMSContent(content: CMSContent): Promise<CMSContent> {
  const next = applyContentMigrations({
    ...content,
    updatedAt: new Date().toISOString(),
  });

  logCmsSync("save", {
    updatedAt: next.updatedAt,
    testimonials: next.testimonials.length,
    portfolioProjects: next.portfolioProjects?.length ?? 0,
    publishedProjects: next.portfolioProjects?.filter((p) => p.published).length ?? 0,
  });

  if (shouldUseBlobStorage()) {
    await writeCMSToBlob(next);
    memoryCMS = next;
    tryRevalidateCMS();
    logCmsSync("storage-updated", {
      storage: "blob",
      updatedAt: next.updatedAt,
      testimonials: next.testimonials.length,
      portfolioProjects: next.portfolioProjects?.length ?? 0,
      publishedProjects: next.portfolioProjects?.filter((p) => p.published).length ?? 0,
      projectIds: next.portfolioProjects?.map((p) => `${p.id}:${p.published ? "pub" : "hid"}`).join(","),
    });
    return next;
  }

  memoryCMS = next;
  tryRevalidateCMS();

  if (canPersistCMS()) {
    await ensureDataDir();
    await fs.writeFile(CONTENT_FILE, JSON.stringify(next, null, 2), "utf-8");
    logCmsSync("storage-updated", {
      storage: "disk",
      updatedAt: next.updatedAt,
      testimonials: next.testimonials.length,
    });
    return next;
  }

  // Vercel without Blob configured (should not happen in normal setup).
  try {
    await fs.writeFile(VERCEL_CMS_FILE, JSON.stringify(next, null, 2), "utf-8");
  } catch (err) {
    console.warn("[cms] runtime CMS write failed (using in-memory overlay):", err);
  }

  return next;
}

export async function updateCMSContent(
  updater: (current: CMSContent) => CMSContent
): Promise<CMSContent> {
  const current = await readCMSContentFresh();
  const next = await writeCMSContent(updater(current));
  memoryCMS = next;
  return next;
}
