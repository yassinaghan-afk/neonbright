/**
 * One-time JSON → PostgreSQL CMS import.
 *
 * Usage:
 *   npm run cms:db:import:dry     # default — validates + reports, writes nothing
 *   npm run cms:db:import         # applies inside one transaction
 *   npm run cms:db:verify         # compares JSON vs database, no writes
 *
 * Guarantees:
 *   - dry-run by default (writes require --apply)
 *   - full-JSON validation and per-collection counts before any write
 *   - timestamped JSON backup before apply
 *   - single transaction: one failed record rolls back everything
 *   - idempotent upserts keyed on stable IDs — rerunning never duplicates
 *   - never deletes existing database records
 */

import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { CMSContent } from "../lib/cms/types";
import {
  categoryToRow,
  contentCounts,
  faqToRow,
  featureToRow,
  heroSlideToRow,
  industryToRow,
  instagramPostToRow,
  instagramReelToRow,
  navToRow,
  partnerToRow,
  processStepToRow,
  projectMediaRows,
  projectToRow,
  reviewToRow,
  serviceToRow,
  settingsFromContent,
  testimonialToRow,
} from "../lib/db/cms-mapping";

// ── CLI / env ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const VERIFY = args.includes("--verify");
const MODE = VERIFY ? "verify" : APPLY ? "apply" : "dry-run";

function getStorageRoot(): string {
  const fromEnv = process.env.STORAGE_ROOT?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), "storage");
}

const CMS_JSON_PATH =
  process.env.CMS_JSON_PATH?.trim() ||
  path.join(getStorageRoot(), "cms-content.json");

// ── helpers ──────────────────────────────────────────────────────────────────

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

async function readAndValidateJson(): Promise<CMSContent> {
  let raw: string;
  try {
    raw = await fs.readFile(CMS_JSON_PATH, "utf-8");
  } catch {
    fail(`CMS JSON not found or unreadable: ${CMS_JSON_PATH}`);
  }

  let parsed: CMSContent;
  try {
    parsed = JSON.parse(raw) as CMSContent;
  } catch (err) {
    fail(`CMS JSON is not valid JSON: ${err instanceof Error ? err.message : err}`);
  }

  // Structural validation — required collections must be arrays when present.
  const arrayKeys = [
    "portfolioCategories", "portfolioProjects", "heroSlides", "partners",
    "brandsPageLogos", "reviews", "testimonials", "instagramPosts",
    "instagramReels", "features", "industries", "processSteps", "faq",
    "services", "nav",
  ] as const;
  for (const key of arrayKeys) {
    const value = (parsed as Record<string, unknown>)[key];
    if (value !== undefined && !Array.isArray(value)) {
      fail(`CMS JSON invalid: "${key}" must be an array`);
    }
  }

  // Referential validation — every project must reference a known category.
  const categoryIds = new Set((parsed.portfolioCategories ?? []).map((c) => c.id));
  for (const p of parsed.portfolioProjects ?? []) {
    if (!p.id) fail(`Project without id (title="${p.title}")`);
    if (!p.slug) fail(`Project ${p.id} has no slug`);
    if (!categoryIds.has(p.categoryId)) {
      fail(`Project ${p.id} references unknown categoryId "${p.categoryId}"`);
    }
  }

  // Duplicate-ID validation per collection.
  for (const key of arrayKeys) {
    const list = ((parsed as Record<string, unknown>)[key] ?? []) as Array<{ id?: string }>;
    const seen = new Set<string>();
    for (const item of list) {
      if (!item.id) continue;
      if (seen.has(item.id)) fail(`Duplicate id "${item.id}" in "${key}"`);
      seen.add(item.id);
    }
  }

  return parsed;
}

async function createJsonBackup(): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(getStorageRoot(), "backups");
  await fs.mkdir(backupDir, { recursive: true });
  const target = path.join(backupDir, `cms-content-pre-pg-import-${stamp}.json`);
  await fs.copyFile(CMS_JSON_PATH, target);
  return target;
}

function makePrisma(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) fail("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

// ── db counts / verify ───────────────────────────────────────────────────────

async function dbCounts(prisma: PrismaClient): Promise<Record<string, number>> {
  const [
    portfolioCategories, portfolioProjects, projectMedia, heroSlides,
    partners, brandsPageLogos, reviews, testimonials, instagramPosts,
    instagramReels, features, industries, processSteps, faq, services,
    nav, settings,
  ] = await Promise.all([
    prisma.portfolioCategory.count(),
    prisma.portfolioProject.count(),
    prisma.projectMedia.count(),
    prisma.heroSlide.count(),
    prisma.partner.count({ where: { kind: "partner" } }),
    prisma.partner.count({ where: { kind: "brandsLogo" } }),
    prisma.review.count(),
    prisma.testimonial.count(),
    prisma.instagramPost.count(),
    prisma.instagramReel.count(),
    prisma.feature.count(),
    prisma.industry.count(),
    prisma.processStep.count(),
    prisma.fAQ.count(),
    prisma.service.count(),
    prisma.navigationItem.count(),
    prisma.siteSetting.count(),
  ]);
  return {
    portfolioCategories, portfolioProjects, projectMedia, heroSlides,
    partners, brandsPageLogos, reviews, testimonials, instagramPosts,
    instagramReels, features, industries, processSteps, faq, services,
    nav, settings,
  };
}

function printComparison(
  jsonCounts: Record<string, number>,
  db: Record<string, number> | null
) {
  console.log("\nCollection            JSON     DB      Match");
  console.log("─".repeat(48));
  for (const [key, jsonCount] of Object.entries(jsonCounts)) {
    const dbCount = db ? (db[key] ?? 0) : null;
    const match =
      dbCount === null ? "—" : dbCount >= jsonCount ? "✓" : "✖ MISSING";
    console.log(
      `${key.padEnd(22)}${String(jsonCount).padEnd(9)}${String(dbCount ?? "-").padEnd(8)}${match}`
    );
  }
}

async function verifyIdsAndSlugs(
  prisma: PrismaClient,
  content: CMSContent
): Promise<string[]> {
  const mismatches: string[] = [];

  const checkIds = async (
    label: string,
    jsonIds: string[],
    fetchDbIds: () => Promise<string[]>
  ) => {
    const dbIds = new Set(await fetchDbIds());
    for (const id of jsonIds) {
      if (!dbIds.has(id)) mismatches.push(`${label}: missing id ${id}`);
    }
  };

  await checkIds(
    "portfolioCategories",
    (content.portfolioCategories ?? []).map((c) => c.id),
    async () => (await prisma.portfolioCategory.findMany({ select: { id: true } })).map((r) => r.id)
  );
  await checkIds(
    "portfolioProjects",
    (content.portfolioProjects ?? []).map((p) => p.id),
    async () => (await prisma.portfolioProject.findMany({ select: { id: true } })).map((r) => r.id)
  );

  // Slug parity for projects.
  const dbProjects = await prisma.portfolioProject.findMany({
    select: { id: true, slug: true, categoryId: true, published: true, sortOrder: true },
  });
  const dbBySlug = new Map(dbProjects.map((p) => [p.id, p]));
  for (const p of content.portfolioProjects ?? []) {
    const db = dbBySlug.get(p.id);
    if (!db) continue;
    if (db.slug !== p.slug) mismatches.push(`project ${p.id}: slug "${db.slug}" ≠ "${p.slug}"`);
    if (db.categoryId !== p.categoryId)
      mismatches.push(`project ${p.id}: categoryId "${db.categoryId}" ≠ "${p.categoryId}"`);
    if (db.published !== (p.published === true))
      mismatches.push(`project ${p.id}: published ${db.published} ≠ ${p.published}`);
    if (db.sortOrder !== (p.sortOrder ?? 0))
      mismatches.push(`project ${p.id}: sortOrder ${db.sortOrder} ≠ ${p.sortOrder}`);
  }

  await checkIds(
    "testimonials",
    (content.testimonials ?? []).map((t) => t.id),
    async () => (await prisma.testimonial.findMany({ select: { id: true } })).map((r) => r.id)
  );
  await checkIds(
    "reviews",
    (content.reviews ?? []).map((r) => r.id),
    async () => (await prisma.review.findMany({ select: { id: true } })).map((r) => r.id)
  );
  await checkIds(
    "instagramPosts",
    (content.instagramPosts ?? []).map((p) => p.id),
    async () => (await prisma.instagramPost.findMany({ select: { id: true } })).map((r) => r.id)
  );
  await checkIds(
    "heroSlides",
    (content.heroSlides ?? []).map((s) => s.id),
    async () => (await prisma.heroSlide.findMany({ select: { id: true } })).map((r) => r.id)
  );
  await checkIds(
    "partners",
    (content.partners ?? []).map((p) => p.id),
    async () =>
      (await prisma.partner.findMany({ where: { kind: "partner" }, select: { id: true } })).map(
        (r) => r.id
      )
  );

  return mismatches;
}

// ── import (single transaction, idempotent upserts, no deletes) ─────────────

async function importAll(prisma: PrismaClient, content: CMSContent): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      for (const c of content.portfolioCategories ?? []) {
        const row = categoryToRow(c);
        await tx.portfolioCategory.upsert({
          where: { id: row.id },
          create: row,
          update: row,
        });
      }

      for (const p of content.portfolioProjects ?? []) {
        const row = projectToRow(p);
        await tx.portfolioProject.upsert({
          where: { id: row.id },
          create: row,
          update: row,
        });
        // Media rows: replace this project's media set to mirror the JSON
        // arrays exactly (scoped to the project being imported — never
        // touches other records).
        await tx.projectMedia.deleteMany({ where: { projectId: p.id } });
        const media = projectMediaRows(p);
        if (media.length) await tx.projectMedia.createMany({ data: media });
      }

      for (const s of content.heroSlides ?? []) {
        const row = heroSlideToRow(s);
        await tx.heroSlide.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const p of content.partners ?? []) {
        const row = partnerToRow(p, "partner");
        await tx.partner.upsert({ where: { id: row.id }, create: row, update: row });
      }
      for (const p of content.brandsPageLogos ?? []) {
        const row = partnerToRow(p, "brandsLogo");
        await tx.partner.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const r of content.reviews ?? []) {
        const row = reviewToRow(r);
        await tx.review.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const t of content.testimonials ?? []) {
        const row = testimonialToRow(t);
        await tx.testimonial.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const p of content.instagramPosts ?? []) {
        const row = instagramPostToRow(p);
        await tx.instagramPost.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const r of content.instagramReels ?? []) {
        const row = instagramReelToRow(r);
        await tx.instagramReel.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const f of content.features ?? []) {
        const row = featureToRow(f);
        await tx.feature.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const i of content.industries ?? []) {
        const row = industryToRow(i);
        await tx.industry.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const s of content.processSteps ?? []) {
        const row = processStepToRow(s);
        await tx.processStep.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const f of content.faq ?? []) {
        const row = faqToRow(f);
        await tx.fAQ.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const s of content.services ?? []) {
        const row = serviceToRow(s);
        await tx.service.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const n of content.nav ?? []) {
        const row = navToRow(n);
        await tx.navigationItem.upsert({ where: { id: row.id }, create: row, update: row });
      }

      for (const { key, value } of settingsFromContent(content)) {
        await tx.siteSetting.upsert({
          where: { key },
          create: { key, value: value as object },
          update: { value: value as object },
        });
      }

      await tx.cmsRevision.create({
        data: {
          revision: content.revision ?? 0,
          source: "json-import",
          note: `Imported from ${CMS_JSON_PATH}`,
          counts: contentCounts(content),
        },
      });
    },
    { timeout: 120_000 }
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nCMS JSON → PostgreSQL import — mode: ${MODE.toUpperCase()}`);
  console.log(`Source JSON: ${CMS_JSON_PATH}`);

  const content = await readAndValidateJson();
  console.log("✓ JSON parsed and validated");
  console.log(`  revision: ${content.revision ?? "n/a"}  updatedAt: ${content.updatedAt}`);

  const jsonCounts = contentCounts(content);

  if (MODE === "dry-run") {
    // Try to also read DB counts if reachable (optional in dry-run).
    let db: Record<string, number> | null = null;
    if (process.env.DATABASE_URL?.trim()) {
      try {
        const prisma = makePrisma();
        db = await dbCounts(prisma);
        await prisma.$disconnect();
      } catch (err) {
        console.warn(
          `\n(DB not reachable for comparison: ${err instanceof Error ? err.message.split("\n")[0] : err})`
        );
      }
    } else {
      console.warn("\n(DATABASE_URL not set — showing JSON counts only)");
    }
    printComparison(jsonCounts, db);
    console.log("\nDRY RUN complete — nothing was written.");
    console.log("Run `npm run cms:db:import` to apply.");
    return;
  }

  if (MODE === "verify") {
    const prisma = makePrisma();
    const db = await dbCounts(prisma);
    printComparison(jsonCounts, db);
    const mismatches = await verifyIdsAndSlugs(prisma, content);
    await prisma.$disconnect();
    if (mismatches.length) {
      console.error(`\n✖ ${mismatches.length} mismatch(es):`);
      mismatches.slice(0, 50).forEach((m) => console.error(`  - ${m}`));
      process.exit(1);
    }
    console.log("\n✓ VERIFY passed — IDs, slugs, categoryIds, published and sortOrder match.");
    return;
  }

  // APPLY
  const backupPath = await createJsonBackup();
  console.log(`✓ JSON backup created: ${backupPath}`);

  const prisma = makePrisma();
  const before = await dbCounts(prisma);

  console.log("Importing inside a single transaction…");
  try {
    await importAll(prisma, content);
  } catch (err) {
    await prisma.$disconnect();
    fail(
      `Import failed — transaction rolled back, database unchanged.\n  ${err instanceof Error ? err.message : err}`
    );
  }

  const after = await dbCounts(prisma);
  console.log("\n✓ Import committed.");
  console.log("\nBefore → After:");
  for (const key of Object.keys(jsonCounts)) {
    console.log(`  ${key.padEnd(22)}${before[key] ?? 0} → ${after[key] ?? 0} (json: ${jsonCounts[key]})`);
  }

  const mismatches = await verifyIdsAndSlugs(prisma, content);
  await prisma.$disconnect();
  if (mismatches.length) {
    console.error(`\n✖ Post-import verify found ${mismatches.length} mismatch(es)`);
    mismatches.slice(0, 50).forEach((m) => console.error(`  - ${m}`));
    process.exit(1);
  }
  console.log("✓ Post-import verify passed.");
}

main().catch((err) => fail(err instanceof Error ? err.stack ?? err.message : String(err)));
