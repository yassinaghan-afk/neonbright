import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getDefaultCMSContent } from "@/lib/cms/defaults";
import {
  brandHeroSlidesStale,
  getExpectedHeroSlidesFromMedia,
  isHeroMediaOutOfSync,
  isHeroMediaSyncEnabled,
  refreshBrandHeroSlides,
  shouldSeedBrandHeroSlides,
} from "@/lib/cms/hero-media";
import { normalizeHeroSlides, normalizePartners } from "@/lib/cms/normalize";
import type { CMSContent } from "@/lib/cms/types";
import {
  shouldUseBlobStorage,
  getBlobCommandOptions,
} from "@/lib/cms/blob-client";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "cms-content.json");
const VERCEL_CMS_FILE = path.join("/tmp", "neonbright-cms-content.json");

/** Pathname inside the Blob store for the CMS content JSON. */
const CMS_BLOB_PATHNAME = "cms-data/content.json";

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

/**
 * Resolve the public URL of the CMS blob.
 * Uses list() the first time on a cold Lambda, then caches the URL in memory.
 */
async function getCMSBlobUrl(refresh = false): Promise<string | null> {
  if (!refresh && memoryCmsBlobUrl) return memoryCmsBlobUrl;
  try {
    const { list } = await import("@vercel/blob");
    const auth = await getBlobCommandOptions();
    const { blobs } = await list({ ...auth, prefix: CMS_BLOB_PATHNAME, limit: 1 });
    if (blobs.length > 0) memoryCmsBlobUrl = blobs[0].url;
  } catch (err) {
    console.error("[cms-store] failed to locate CMS blob:", err);
  }
  return memoryCmsBlobUrl;
}

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
 * Uses cache: 'no-store' so every request gets the latest version from Blob.
 * React.cache() (wrapping readCMSContent) prevents redundant fetches within
 * a single server render when multiple components need the CMS content.
 */
async function readCMSFromBlob(refreshUrl = false): Promise<Partial<CMSContent> | null> {
  const url = await getCMSBlobUrl(refreshUrl);
  if (!url) return null;
  try {
    const bust = url.includes("?") ? "&" : "?";
    const res = await fetch(
      `${url}${bust}t=${Date.now()}&r=${Math.random().toString(36).slice(2)}`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
    if (!res.ok) {
      console.error("[cms-store] blob CMS fetch returned", res.status);
      return null;
    }
    return (await res.json()) as Partial<CMSContent>;
  } catch (err) {
    console.error("[cms-store] blob CMS read failed:", err);
    return null;
  }
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
    projects: parsed.projects?.length ? parsed.projects : defaults.projects,
    portfolioCategories: parsed.portfolioCategories?.length
      ? parsed.portfolioCategories
      : defaults.portfolioCategories,
    portfolioProjects: parsed.portfolioProjects?.length
      ? parsed.portfolioProjects
      : defaults.portfolioProjects,
    testimonials: parsed.testimonials?.length ? parsed.testimonials : defaults.testimonials,
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
  const paths = canPersistCMS() ? [CONTENT_FILE] : [VERCEL_CMS_FILE, CONTENT_FILE];

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
      parsed = await readCMSFromBlob(Boolean(options?.bypassMemory));
    } else {
      await ensureDataDir();
      parsed = await readCMSFileFromDisk();
    }

    // Skip the in-memory overlay when the caller explicitly requests fresh data.
    if (
      !options?.bypassMemory &&
      memoryCMS &&
      isContentAtLeastAsFresh(memoryCMS, parsed)
    ) {
      return memoryCMS;
    }

    if (!parsed) {
      if (memoryCMS) return memoryCMS;
      if (shouldUseBlobStorage()) {
        throw new Error(
          "CMS blob not found or unreadable. Save content in Admin or connect Vercel Blob."
        );
      }
      throw new Error("CMS content not found");
    }

    let content = mergeContent(parsed);
    const { content: synced, changed } = await maybeSyncHeroFromMedia(
      parsed,
      content
    );
    content = synced;

    if (changed) {
      try {
        content = await writeCMSContent(content);
      } catch {
        if (!shouldUseBlobStorage()) memoryCMS = content;
      }
    } else if (!shouldUseBlobStorage()) {
      memoryCMS = content;
    }

    return content;
  } catch (err) {
    if (shouldUseBlobStorage()) throw err;
    console.error("[cms-store] load failed, using defaults:", err);
    return getDefaultCMSContent();
  }
}

/**
 * Read the current CMS content.
 *
 * Wrapped with React.cache() so multiple Server Components on the same page
 * share a single fetch per request.
 */
export const readCMSContent: () => Promise<CMSContent> = cache(loadCMSContent);

/** Bypass React.cache and in-memory overlay — authoritative read for public pages and writes. */
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
  const next = { ...content, updatedAt: new Date().toISOString() };

  if (shouldUseBlobStorage()) {
    await writeCMSToBlob(next);
    memoryCMS = next; // Optimistic same-Lambda overlay
    tryRevalidateCMS();
    return next;
  }

  memoryCMS = next;
  tryRevalidateCMS();

  if (canPersistCMS()) {
    await ensureDataDir();
    await fs.writeFile(CONTENT_FILE, JSON.stringify(next, null, 2), "utf-8");
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
