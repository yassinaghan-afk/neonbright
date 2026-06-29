import { promises as fs } from "fs";
import path from "path";
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

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "cms-content.json");
const VERCEL_CMS_FILE = path.join("/tmp", "neonbright-cms-content.json");

let memoryCMS: CMSContent | null = null;

function canPersistCMS(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

async function ensureDataDir() {
  if (!canPersistCMS()) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
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

export async function readCMSContent(): Promise<CMSContent> {
  if (memoryCMS) return memoryCMS;

  try {
    await ensureDataDir();
    const parsed = await readCMSFileFromDisk();
    if (!parsed) throw new Error("CMS content file not found");

    let content = mergeContent(parsed);
    const { content: synced, changed } = await maybeSyncHeroFromMedia(parsed, content);
    content = synced;

    if (changed) {
      try {
        content = await writeCMSContent(content);
      } catch {
        memoryCMS = content;
      }
    }

    return content;
  } catch {
    const defaults = getDefaultCMSContent();
    if (!isHeroMediaSyncEnabled()) {
      return defaults;
    }
    const result = await refreshBrandHeroSlides(true);
    const content = applyBrandHeroSlides(defaults, result.slides, result.mediaVersion);
    try {
      return await writeCMSContent(content);
    } catch {
      memoryCMS = content;
      return content;
    }
  }
}

export async function writeCMSContent(content: CMSContent): Promise<CMSContent> {
  const next = { ...content, updatedAt: new Date().toISOString() };
  memoryCMS = next;

  if (canPersistCMS()) {
    await ensureDataDir();
    await fs.writeFile(CONTENT_FILE, JSON.stringify(next, null, 2), "utf-8");
    return next;
  }

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
  const current = await readCMSContent();
  return writeCMSContent(updater(current));
}
