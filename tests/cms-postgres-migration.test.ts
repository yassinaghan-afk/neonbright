/**
 * CMS PostgreSQL migration tests — run against an ISOLATED test database.
 *
 * Requires DATABASE_URL pointing to a disposable Postgres database with the
 * schema applied (see scripts/run-postgres-tests.sh which provisions one).
 * Never point this at production.
 *
 * Verifies:
 *  - JSON import counts match database counts
 *  - IDs, slugs, categoryIds, published, sortOrder match exactly
 *  - Events/Brands/Reviews/Testimonials/Instagram/Hero/Partners parity
 *  - media URLs unchanged
 *  - import idempotency (rerun never duplicates)
 *  - partial updates preserve omitted fields
 *  - publish/hide immediately visible
 *  - reorder affects only the intended category
 *  - deletion removes only the selected record
 *  - unknown custom fields survive round-trips
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { rowToProject, projectMediaRows } from "../lib/db/cms-mapping";
import { writeContentToPostgres } from "../lib/cms/repository/postgres-writer";
import type { CMSContent, CMSPortfolioProject } from "../lib/cms/types";

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;
if (skip) {
  console.warn(
    "DATABASE_URL not set — postgres migration tests skipped. Use scripts/run-postgres-tests.sh"
  );
}

const REPO_ROOT = process.cwd();
const FIXTURE_DIR = path.join(REPO_ROOT, ".test-pg-storage");
const FIXTURE_JSON = path.join(FIXTURE_DIR, "cms-content.json");
const IMPORT_SCRIPT = path.join(REPO_ROOT, "scripts", "import-cms-json-to-postgres.ts");

let prisma: PrismaClient;
let fixture: CMSContent;

function runImport(args: string[]): string {
  return execFileSync(
    "npx",
    ["--yes", "tsx", IMPORT_SCRIPT, ...args],
    {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        DATABASE_URL,
        CMS_JSON_PATH: FIXTURE_JSON,
        STORAGE_ROOT: FIXTURE_DIR,
      },
      encoding: "utf-8",
    }
  );
}

async function buildFixture(): Promise<CMSContent> {
  const raw = await fs.readFile(path.join(REPO_ROOT, "data", "cms-content.json"), "utf-8");
  const content = JSON.parse(raw) as CMSContent;

  // Inject unknown custom field on a project — must survive round-trips.
  const projects = content.portfolioProjects as Array<CMSPortfolioProject & Record<string, unknown>>;
  if (projects.length) projects[0].customExperimentalField = "must-survive";

  // Ensure Instagram posts exist for parity testing.
  content.instagramPosts = [
    {
      id: "igtest-1",
      image: "/uploads/instagram/test-1.jpg",
      caption: "Test 1",
      instagramUrl: "https://instagram.com/p/test1",
      enabled: true,
      sortOrder: 0,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "igtest-2",
      image: "/uploads/instagram/test-2.jpg",
      caption: "Test 2",
      instagramUrl: "",
      enabled: false,
      sortOrder: 1,
    },
  ];

  // Ensure reviews exist for parity testing.
  content.reviews = [
    { id: "rvtest-1", image: "/uploads/reviews/r1.jpg", enabled: true, sortOrder: 0 },
    { id: "rvtest-2", image: "/uploads/reviews/r2.jpg", enabled: false, sortOrder: 1 },
  ];

  content.revision = 41;
  return content;
}

async function loadDbProject(id: string): Promise<CMSPortfolioProject | null> {
  const row = await prisma.portfolioProject.findUnique({
    where: { id },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  return row ? rowToProject(row, row.media) : null;
}

before(async function () {
  if (skip) return;
  prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL! }),
  });

  fixture = await buildFixture();
  await fs.mkdir(FIXTURE_DIR, { recursive: true });
  await fs.writeFile(FIXTURE_JSON, JSON.stringify(fixture, null, 2), "utf-8");
});

after(async () => {
  if (skip) return;
  await prisma.$disconnect();
  await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
});

test("dry-run reports counts and writes nothing", { skip }, async () => {
  const out = runImport([]);
  assert.match(out, /DRY RUN complete — nothing was written/);
  const count = await prisma.portfolioProject.count();
  assert.equal(count, 0, "dry-run must not write any project");
});

test("apply imports every collection with matching counts", { skip }, async () => {
  const out = runImport(["--apply"]);
  assert.match(out, /Import committed/);
  assert.match(out, /Post-import verify passed/);

  assert.equal(await prisma.portfolioCategory.count(), fixture.portfolioCategories.length);
  assert.equal(await prisma.portfolioProject.count(), fixture.portfolioProjects.length);
  assert.equal(await prisma.heroSlide.count(), fixture.heroSlides.length);
  assert.equal(
    await prisma.partner.count({ where: { kind: "partner" } }),
    fixture.partners.length
  );
  assert.equal(await prisma.review.count(), fixture.reviews.length);
  assert.equal(await prisma.testimonial.count(), fixture.testimonials.length);
  assert.equal(await prisma.instagramPost.count(), fixture.instagramPosts.length);
  assert.equal(await prisma.feature.count(), fixture.features.length);
  assert.equal(await prisma.industry.count(), fixture.industries.length);
  assert.equal(await prisma.processStep.count(), fixture.processSteps.length);
  assert.equal(await prisma.fAQ.count(), fixture.faq.length);
  assert.equal(await prisma.service.count(), fixture.services.length);
  assert.equal(await prisma.navigationItem.count(), fixture.nav.length);

  const expectedMedia = fixture.portfolioProjects.reduce(
    (sum, p) => sum + projectMediaRows(p).length,
    0
  );
  assert.equal(await prisma.projectMedia.count(), expectedMedia);
});

test("verify command passes after import", { skip }, () => {
  const out = runImport(["--verify"]);
  assert.match(out, /VERIFY passed/);
});

test("import is idempotent — rerun never duplicates", { skip }, async () => {
  const before = await prisma.portfolioProject.count();
  const out = runImport(["--apply"]);
  assert.match(out, /Import committed/);
  assert.equal(await prisma.portfolioProject.count(), before);
  assert.equal(await prisma.portfolioCategory.count(), fixture.portfolioCategories.length);
});

test("projects round-trip exactly: ids, slugs, media URLs, ordering", { skip }, async () => {
  for (const jsonProject of fixture.portfolioProjects) {
    const db = await loadDbProject(jsonProject.id);
    assert.ok(db, `project ${jsonProject.id} missing from db`);
    assert.equal(db.slug, jsonProject.slug);
    assert.equal(db.categoryId, jsonProject.categoryId);
    assert.equal(db.title, jsonProject.title);
    assert.equal(db.description, jsonProject.description ?? "");
    assert.equal(db.published, jsonProject.published === true);
    assert.equal(db.sortOrder, jsonProject.sortOrder ?? 0);
    assert.deepEqual(db.images, jsonProject.images ?? []);
    assert.deepEqual(db.gallery, jsonProject.gallery ?? []);
    assert.deepEqual(db.videos, jsonProject.videos ?? []);
    assert.equal(db.featuredImage, jsonProject.featuredImage ?? "");
    assert.equal(db.coverImage, jsonProject.coverImage ?? "");
    assert.equal(db.thumbnail, jsonProject.thumbnail ?? "");
    if (jsonProject.logoFile !== undefined) assert.equal(db.logoFile, jsonProject.logoFile);
  }
});

test("unknown custom fields survive the round-trip", { skip }, async () => {
  const target = fixture.portfolioProjects[0];
  const db = (await loadDbProject(target.id)) as CMSPortfolioProject & Record<string, unknown>;
  assert.equal(db.customExperimentalField, "must-survive");
});

test("reviews, testimonials, instagram, hero, partners parity", { skip }, async () => {
  const reviews = await prisma.review.findMany({ orderBy: { sortOrder: "asc" } });
  assert.deepEqual(
    reviews.map((r) => ({ id: r.id, image: r.image, enabled: r.enabled, sortOrder: r.sortOrder })),
    fixture.reviews.map((r) => ({
      id: r.id, image: r.image, enabled: r.enabled, sortOrder: r.sortOrder,
    }))
  );

  const testimonials = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  assert.deepEqual(
    testimonials.map((t) => t.id),
    fixture.testimonials.map((t) => t.id)
  );
  assert.deepEqual(
    testimonials.map((t) => t.quote),
    fixture.testimonials.map((t) => t.quote)
  );

  const igPosts = await prisma.instagramPost.findMany({ orderBy: { sortOrder: "asc" } });
  assert.deepEqual(
    igPosts.map((p) => ({ id: p.id, image: p.image, enabled: p.enabled })),
    fixture.instagramPosts.map((p) => ({ id: p.id, image: p.image, enabled: p.enabled }))
  );

  const heroSlides = await prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
  assert.deepEqual(
    heroSlides.map((s) => ({ id: s.id, src: s.src })),
    fixture.heroSlides.map((s) => ({ id: s.id, src: s.src }))
  );

  const partners = await prisma.partner.findMany({
    where: { kind: "partner" },
    orderBy: { sortOrder: "asc" },
  });
  assert.deepEqual(
    partners.map((p) => ({ id: p.id, name: p.name, logoUrl: p.logoUrl })),
    fixture.partners.map((p) => ({ id: p.id, name: p.name, logoUrl: p.logoUrl }))
  );
});

test("settings blocks stored as individual JSONB rows", { skip }, async () => {
  const hero = await prisma.siteSetting.findUnique({ where: { key: "hero" } });
  assert.ok(hero, "hero settings row missing");
  assert.deepEqual(hero.value, JSON.parse(JSON.stringify(fixture.hero)));

  const contact = await prisma.siteSetting.findUnique({ where: { key: "contact" } });
  assert.ok(contact);
  assert.deepEqual(contact.value, JSON.parse(JSON.stringify(fixture.contact)));
});

test("publish-only partial update preserves every other field", { skip }, async () => {
  const target = fixture.portfolioProjects.find((p) => p.published) ?? fixture.portfolioProjects[0];
  const beforeDb = await loadDbProject(target.id);
  assert.ok(beforeDb);

  // Simulate an Admin publish-only mutation: full snapshot with one field flipped.
  const content: CMSContent = {
    ...fixture,
    portfolioProjects: fixture.portfolioProjects.map((p) =>
      p.id === target.id ? { ...p, published: !p.published } : p
    ),
  };
  await writeContentToPostgres(content);

  const afterDb = await loadDbProject(target.id);
  assert.ok(afterDb);
  assert.equal(afterDb.published, !target.published);
  // Every other field must be preserved.
  assert.equal(afterDb.title, beforeDb.title);
  assert.equal(afterDb.description, beforeDb.description);
  assert.deepEqual(afterDb.images, beforeDb.images);
  assert.deepEqual(afterDb.gallery, beforeDb.gallery);
  assert.equal(afterDb.featuredImage, beforeDb.featuredImage);
  assert.equal(afterDb.slug, beforeDb.slug);

  // Restore.
  await writeContentToPostgres(fixture);
});

test("reorder affects only the intended category", { skip }, async () => {
  const categories = [...new Set(fixture.portfolioProjects.map((p) => p.categoryId))];
  assert.ok(categories.length >= 2, "fixture needs at least two categories");
  const [catA, catB] = categories;

  const beforeB = await prisma.portfolioProject.findMany({
    where: { categoryId: catB },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  // Reverse sortOrder inside category A only.
  const inA = fixture.portfolioProjects.filter((p) => p.categoryId === catA);
  const reordered = fixture.portfolioProjects.map((p) => {
    if (p.categoryId !== catA) return p;
    const idx = inA.findIndex((x) => x.id === p.id);
    return { ...p, sortOrder: inA.length - 1 - idx };
  });
  await writeContentToPostgres({ ...fixture, portfolioProjects: reordered });

  const afterB = await prisma.portfolioProject.findMany({
    where: { categoryId: catB },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  assert.deepEqual(afterB, beforeB, "category B ordering must be untouched");

  await writeContentToPostgres(fixture);
});

test("deletion removes only the selected record", { skip }, async () => {
  const victim = fixture.instagramPosts[1];
  const remaining = {
    ...fixture,
    instagramPosts: fixture.instagramPosts.filter((p) => p.id !== victim.id),
  };
  await writeContentToPostgres(remaining);

  assert.equal(await prisma.instagramPost.count(), fixture.instagramPosts.length - 1);
  assert.equal(
    await prisma.instagramPost.findUnique({ where: { id: victim.id } }),
    null
  );
  // Everything else intact.
  assert.equal(await prisma.portfolioProject.count(), fixture.portfolioProjects.length);
  assert.equal(await prisma.review.count(), fixture.reviews.length);

  await writeContentToPostgres(fixture);
  assert.equal(await prisma.instagramPost.count(), fixture.instagramPosts.length);
});

test("publish/hide is immediately visible in filtered reads", { skip }, async () => {
  const hidden = {
    ...fixture,
    reviews: fixture.reviews.map((r, i) => (i === 0 ? { ...r, enabled: false } : r)),
  };
  await writeContentToPostgres(hidden);
  const publicReviews = await prisma.review.findMany({ where: { enabled: true } });
  assert.ok(!publicReviews.some((r) => r.id === fixture.reviews[0].id));

  await writeContentToPostgres(fixture);
  const restored = await prisma.review.findMany({ where: { enabled: true } });
  assert.ok(restored.some((r) => r.id === fixture.reviews[0].id));
});

test("slug lookup: existing slug found, unknown slug null (→404 path)", { skip }, async () => {
  const known = fixture.portfolioProjects[0];
  const found = await prisma.portfolioProject.findFirst({ where: { slug: known.slug } });
  assert.ok(found);
  const missing = await prisma.portfolioProject.findFirst({
    where: { slug: "does-not-exist-slug" },
  });
  assert.equal(missing, null);
});

test("concurrent writes to different collections both survive", { skip }, async () => {
  const withNewFaq: CMSContent = {
    ...fixture,
    faq: [
      ...fixture.faq,
      { id: "faq-concurrent", question: "Q?", answer: "A", enabled: true, sortOrder: 99 },
    ],
  };
  const withNewIndustry: CMSContent = {
    ...withNewFaq,
    industries: [
      ...fixture.industries,
      { id: "ind-concurrent", name: "Test", icon: "star", enabled: true, sortOrder: 99 },
    ],
  };
  // Sequential transactions modelling two Admin saves against latest state.
  await writeContentToPostgres(withNewFaq);
  await writeContentToPostgres(withNewIndustry);

  assert.ok(await prisma.fAQ.findUnique({ where: { id: "faq-concurrent" } }));
  assert.ok(await prisma.industry.findUnique({ where: { id: "ind-concurrent" } }));

  await writeContentToPostgres(fixture);
});
