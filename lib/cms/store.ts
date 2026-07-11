import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { unstable_cache, unstable_noStore as noStore } from "next/cache";
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
import { CMS_CACHE_TAG, revalidatePublicSite } from "@/lib/cms/revalidate-public";
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
 * 3. In-memory overlay — last resort for 304 Not Modified SDK responses
 *    ONLY when bypassMemory is false (same-Lambda optimistic reads).
 */
async function readCMSFromBlob(options?: {
  bypassMemory?: boolean;
}): Promise<Partial<CMSContent> | null> {
  const bypassMemory = Boolean(options?.bypassMemory);

  // ── PRIMARY: SDK get (fresh, no CDN lag) ─────────────────────────────────
  try {
    const auth = await getBlobCommandOptions();
    const { get } = await import("@vercel/blob");
    const result = await get(CMS_BLOB_PATHNAME, { ...auth, access: "public" });

    if (result) {
      if (result.statusCode === 304 || !result.stream) {
        // Never overlay stale Lambda memory when the caller asked for a fresh read
        // (admin sync / homepage after publish toggle). Fall through to public URL.
        if (!bypassMemory && memoryCMS) {
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
          reviews: parsed.reviews?.length ?? 0,
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
          reviews: parsed.reviews?.length ?? 0,
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
    // Explicit — never drop reviews when blob JSON lacks/omits the key mid-merge.
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

  const bypassMemory = Boolean(options?.bypassMemory);

  try {
    let parsed: Partial<CMSContent> | null = null;

    if (shouldUseBlobStorage()) {
      parsed = await readCMSFromBlob({ bypassMemory });
    } else {
      await ensureDataDir();
      parsed = await readCMSFileFromDisk();
    }

    // Prefer the in-memory overlay ONLY when:
    // - caller did NOT request a fresh/authoritative read (bypassMemory), AND
    // - memory is at least as fresh as Blob/disk (same-Lambda read-after-write).
    // A newer Blob always wins so another instance's write (e.g. publish toggle)
    // is never masked by a stale local overlay.
    if (
      !bypassMemory &&
      memoryCMS &&
      isContentAtLeastAsFresh(memoryCMS, parsed)
    ) {
      return applyContentMigrations(memoryCMS);
    }

    if (!parsed) {
      // Fresh reads must not silently serve defaults/memory when Blob fails —
      // fall back only when we have no other choice.
      if (!bypassMemory && memoryCMS) {
        console.warn("[cms-store] blob unreadable — serving in-memory overlay");
        return applyContentMigrations(memoryCMS);
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

    // CRITICAL: never write to Blob from a read path on Vercel.
    // A read may be served stale content (CDN lag); persisting it would
    // overwrite newer admin saves with old data. Writes happen only through
    // explicit admin mutations (updateCMSContent/writeCMSContent).
    // Local dev keeps auto-persist so hero/seed syncs land in the JSON file.
    if (persistNeeded && canPersistCMS()) {
      try {
        content = await writeCMSContent(content);
      } catch {
        memoryCMS = content;
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
 * Distributed cached read for PUBLIC pages (Vercel only).
 *
 * Cached in the Next.js data cache under CMS_CACHE_TAG, which every admin
 * write invalidates via revalidateTag (writeCMSContent → revalidatePublicSite
 * and POST /api/admin/revalidate). Result: public requests hit the cache
 * (no Blob round-trip → fast TTFB) yet always refetch immediately after a save.
 *
 * Throws when the blob is unreadable so unstable_cache never caches defaults.
 */
const readCMSContentCachedBlob = unstable_cache(
  async (): Promise<CMSContent> => {
    const parsed = await readCMSFromBlob();
    if (!parsed) throw new Error("CMS blob unreadable");
    let content = applyContentMigrations(mergeContent(parsed));
    content = ensureBrandsPageProjects(content).content;
    return content;
  },
  ["cms-content-public"],
  { tags: [CMS_CACHE_TAG] }
);

/**
 * Read the current CMS content (public pages).
 *
 * - Vercel: Next.js data cache tagged with CMS_CACHE_TAG (fast, invalidated
 *   on every admin write). Falls back to a direct blob read on cache errors.
 * - Local dev: direct read from data/cms-content.json.
 *
 * Wrapped with React.cache() so multiple Server Components on the same page
 * share a single fetch per request.
 */
export const readCMSContent: () => Promise<CMSContent> = cache(
  async (): Promise<CMSContent> => {
    if (shouldUseBlobStorage()) {
      try {
        return await readCMSContentCachedBlob();
      } catch (err) {
        console.warn(
          "[cms-store] cached read failed — falling back to direct read:",
          err instanceof Error ? err.message : err
        );
      }
    }
    return loadCMSContent();
  }
);

/**
 * Authoritative direct read — always fetches from Blob/disk, bypassing both
 * the Next.js data cache and the in-memory overlay. Used by admin API routes
 * and read-before-write (updateCMSContent).
 *
 * Deliberately NOT wrapped in React.cache(): a write flow must never receive
 * a value memoized earlier in the same request.
 */
export async function readCMSContentFresh(): Promise<CMSContent> {
  return loadCMSContent({ bypassMemory: true });
}

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
    reviews: next.reviews?.length ?? 0,
    portfolioProjects: next.portfolioProjects?.length ?? 0,
    publishedProjects: next.portfolioProjects?.filter((p) => p.published).length ?? 0,
  });

  if (shouldUseBlobStorage()) {
    await writeCMSToBlob(next);
    memoryCMS = next;
    // Read-after-write guard: if Blob still returns an older snapshot, rewrite once.
    try {
      const verify = await readCMSFromBlob();
      if (verify && !isContentAtLeastAsFresh(verify, next)) {
        console.warn(
          "[cms-store] read-after-write lag detected — retrying blob put",
          { written: next.updatedAt, read: verify.updatedAt }
        );
        await writeCMSToBlob(next);
      }
    } catch (err) {
      console.warn(
        "[cms-store] read-after-write verify skipped:",
        err instanceof Error ? err.message : err
      );
    }
    tryRevalidateCMS();
    logCmsSync("storage-updated", {
      storage: "blob",
      updatedAt: next.updatedAt,
      testimonials: next.testimonials.length,
      reviews: next.reviews?.length ?? 0,
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
