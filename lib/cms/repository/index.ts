/**
 * CMS repository factory — phased JSON → PostgreSQL cutover.
 *
 * CMS_STORAGE=json      (default) JSON file store serves everything.
 * CMS_STORAGE=compare   JSON serves reads; PostgreSQL is read in the
 *                       background and normalized results are compared;
 *                       mismatches are logged (no sensitive data). Never
 *                       writes to PostgreSQL outside the import script.
 * CMS_STORAGE=postgres  PostgreSQL serves reads/writes; JSON becomes
 *                       read-only emergency rollback data. No dual writes.
 */

import { JsonCmsRepository } from "./json-repository";
import { PostgresCmsRepository } from "./postgres-repository";
import { getCmsStorageMode, type CmsRepository } from "./types";
import type {
  CMSContent,
  CMSInstagramPost,
  CMSPortfolioProject,
  CMSReview,
  CMSTestimonial,
} from "@/lib/cms/types";

export { getCmsStorageMode } from "./types";
export type { CmsRepository, CmsStorageMode } from "./types";

const jsonRepo = new JsonCmsRepository();
let pgRepo: PostgresCmsRepository | null = null;

function getPgRepo(): PostgresCmsRepository {
  if (!pgRepo) pgRepo = new PostgresCmsRepository();
  return pgRepo;
}

// ── compare mode ─────────────────────────────────────────────────────────────

/** Field-level diff summary without exposing content values. */
function diffSummary(label: string, a: unknown, b: unknown): string[] {
  const diffs: string[] = [];
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      diffs.push(`${label}: length ${a.length} (json) ≠ ${b.length} (pg)`);
      return diffs;
    }
    for (let i = 0; i < a.length; i++) {
      const ja = JSON.stringify(a[i]);
      const jb = JSON.stringify(b[i]);
      if (ja !== jb) {
        const id =
          (a[i] as { id?: string })?.id ?? (b[i] as { id?: string })?.id ?? `#${i}`;
        diffs.push(`${label}[${id}]: records differ`);
      }
    }
  } else if (JSON.stringify(a) !== JSON.stringify(b)) {
    diffs.push(`${label}: values differ`);
  }
  return diffs;
}

function compareInBackground<T>(
  label: string,
  jsonResult: T,
  pgRead: () => Promise<T>
): void {
  // Fire-and-forget: never blocks or fails the JSON-served response.
  void (async () => {
    try {
      const pgResult = await pgRead();
      const diffs = diffSummary(label, jsonResult, pgResult);
      if (diffs.length) {
        console.warn(
          `[cms-compare] ${label}: ${diffs.length} mismatch(es):`,
          diffs.slice(0, 10).join("; ")
        );
      }
    } catch (err) {
      console.warn(
        `[cms-compare] ${label}: postgres read failed:`,
        err instanceof Error ? err.message.split("\n")[0] : err
      );
    }
  })();
}

class CompareCmsRepository implements CmsRepository {
  readonly backend = "json" as const;

  async getContent(): Promise<CMSContent> {
    const result = await jsonRepo.getContent();
    compareInBackground("content.portfolioProjects", result.portfolioProjects, async () =>
      (await getPgRepo().getContent()).portfolioProjects
    );
    return result;
  }

  async getContentFresh(): Promise<CMSContent> {
    return jsonRepo.getContentFresh();
  }

  async listPortfolioProjects(options?: {
    categoryId?: string;
    publishedOnly?: boolean;
  }): Promise<CMSPortfolioProject[]> {
    const result = await jsonRepo.listPortfolioProjects(options);
    compareInBackground("portfolioProjects", result, () =>
      getPgRepo().listPortfolioProjects(options)
    );
    return result;
  }

  async getPortfolioProjectBySlug(slug: string): Promise<CMSPortfolioProject | null> {
    const result = await jsonRepo.getPortfolioProjectBySlug(slug);
    compareInBackground(`project:${slug}`, result, () =>
      getPgRepo().getPortfolioProjectBySlug(slug)
    );
    return result;
  }

  async listReviews(publicOnly?: boolean): Promise<CMSReview[]> {
    const result = await jsonRepo.listReviews(publicOnly);
    compareInBackground("reviews", result, () => getPgRepo().listReviews(publicOnly));
    return result;
  }

  async listTestimonials(publicOnly?: boolean): Promise<CMSTestimonial[]> {
    const result = await jsonRepo.listTestimonials(publicOnly);
    compareInBackground("testimonials", result, () =>
      getPgRepo().listTestimonials(publicOnly)
    );
    return result;
  }

  async listInstagramPosts(publicOnly?: boolean): Promise<CMSInstagramPost[]> {
    const result = await jsonRepo.listInstagramPosts(publicOnly);
    compareInBackground("instagramPosts", result, () =>
      getPgRepo().listInstagramPosts(publicOnly)
    );
    return result;
  }

  async getSiteSettings() {
    const result = await jsonRepo.getSiteSettings();
    compareInBackground("siteSettings", result, () => getPgRepo().getSiteSettings());
    return result;
  }
}

let compareRepo: CompareCmsRepository | null = null;

// ── factory ──────────────────────────────────────────────────────────────────

export function getCmsRepository(): CmsRepository {
  const mode = getCmsStorageMode();
  if (mode === "postgres") return getPgRepo();
  if (mode === "compare") {
    if (!compareRepo) compareRepo = new CompareCmsRepository();
    return compareRepo;
  }
  return jsonRepo;
}

// ── convenience read functions (repository interface examples) ──────────────

export async function getHomepageContent(): Promise<CMSContent> {
  return getCmsRepository().getContent();
}

export async function listPortfolioProjects(options?: {
  categoryId?: string;
  publishedOnly?: boolean;
}): Promise<CMSPortfolioProject[]> {
  return getCmsRepository().listPortfolioProjects(options);
}

export async function getPortfolioProjectBySlug(
  slug: string
): Promise<CMSPortfolioProject | null> {
  return getCmsRepository().getPortfolioProjectBySlug(slug);
}

export async function listReviews(publicOnly?: boolean): Promise<CMSReview[]> {
  return getCmsRepository().listReviews(publicOnly);
}

export async function listTestimonials(publicOnly?: boolean): Promise<CMSTestimonial[]> {
  return getCmsRepository().listTestimonials(publicOnly);
}

export async function listInstagramPosts(
  publicOnly?: boolean
): Promise<CMSInstagramPost[]> {
  return getCmsRepository().listInstagramPosts(publicOnly);
}

export async function getSiteSettings() {
  return getCmsRepository().getSiteSettings();
}
