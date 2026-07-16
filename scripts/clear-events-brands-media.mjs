/**
 * clear-events-brands-media.mjs
 *
 * One-time production CMS cleanup for NeonBright.
 * Clears Event and Brand project media references from the runtime CMS
 * at ${STORAGE_ROOT}/cms-content.json without deleting physical files.
 *
 * Usage (inside EasyPanel container):
 *   npm run cms:clear-media:dry
 *   npm run cms:clear-media:apply
 *
 * Safety:
 *   - Identifies categories by canonical id/slug only
 *   - Creates timestamped CMS backup before apply
 *   - Writes CMS atomically (temp + rename)
 *   - Never deletes files under /app/storage/uploads
 *   - Preserves all logo fields (project logoFile, partners, site logos)
 *   - Safely rerunnable (idempotent clears)
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply") || process.argv[2] === "apply";

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? path.resolve(process.env.STORAGE_ROOT)
  : path.resolve(ROOT, "storage");

const CMS_PATH = path.join(STORAGE_ROOT, "cms-content.json");
const BACKUPS_DIR = path.join(STORAGE_ROOT, "backups");

/** Canonical Event / Brand category identifiers — never match by display title. */
const EVENT_CATEGORY = { id: "cat_evenements", slug: "evenements" };
const BRAND_CATEGORY = { id: "cat_marques", slug: "marques-clients" };

/**
 * Media fields cleared on Event AND Brand projects.
 * Arrays become []; strings become "".
 * Unknown compatible fields are included for forward-compat.
 */
const PROJECT_MEDIA_STRING_FIELDS = [
  "image",
  "imageUrl",
  "coverImage",
  "backgroundImage",
  "thumbnail",
  "thumbnailUrl",
  "heroImage",
  "featuredImage",
  "beforeImage",
  "afterImage",
  "mobileImageUrl",
  "desktopImageUrl",
];

const PROJECT_MEDIA_ARRAY_FIELDS = [
  "images",
  "gallery",
  "videos",
  "media",
  "carouselImages",
];

/**
 * Logo / brand-identity fields that must NEVER be cleared.
 * Matched case-insensitively by exact key name.
 */
const LOGO_FIELD_NAMES = new Set([
  "logofile",
  "logo",
  "logourl",
  "brandlogo",
  "brandlogourl",
  "clientlogo",
  "clientlogourl",
  "partnerlogo",
  "partnerlogourl",
]);

/** Homepage category card media fields to clear. */
const CATEGORY_CARD_MEDIA_FIELDS = ["coverImage", "heroImage", "thumbnailUrl", "backgroundImage"];

function isLogoField(key) {
  return LOGO_FIELD_NAMES.has(String(key).toLowerCase());
}

function hasMediaValue(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function emptyFor(value) {
  return Array.isArray(value) ? [] : "";
}

function resolveCategoryIds(categories) {
  const list = Array.isArray(categories) ? categories : [];
  const event = list.find(
    (c) => c?.id === EVENT_CATEGORY.id || c?.slug === EVENT_CATEGORY.slug
  );
  const brand = list.find(
    (c) => c?.id === BRAND_CATEGORY.id || c?.slug === BRAND_CATEGORY.slug
  );
  return {
    eventId: event?.id ?? null,
    brandId: brand?.id ?? null,
    eventCat: event ?? null,
    brandCat: brand ?? null,
  };
}

/**
 * Collect clearable media field changes for one project.
 * Returns [{ field, from, to }] — never touches logo fields.
 */
function planProjectClears(project, { clearAllMedia }) {
  const changes = [];
  const preservedLogos = [];

  for (const key of Object.keys(project)) {
    if (isLogoField(key)) {
      if (hasMediaValue(project[key])) {
        preservedLogos.push({ field: key, value: project[key] });
      }
      continue;
    }
  }

  // Explicit known media string fields
  for (const field of PROJECT_MEDIA_STRING_FIELDS) {
    if (!(field in project)) continue;
    if (isLogoField(field)) continue;
    if (!hasMediaValue(project[field])) continue;
    changes.push({ field, from: project[field], to: "" });
  }

  // Explicit known media array fields
  for (const field of PROJECT_MEDIA_ARRAY_FIELDS) {
    if (!(field in project)) continue;
    if (isLogoField(field)) continue;
    if (!hasMediaValue(project[field])) continue;
    changes.push({ field, from: project[field], to: [] });
  }

  // Extra unknown media-like keys (only when clearing all event media).
  // Conservative: never touch alt/SEO/text keys even if they contain "image".
  if (clearAllMedia) {
    const TEXT_SAFE = /^(imageAlt|seoTitle|seoDescription|subtitle|title|description|shortDescription|client|city|country|year|type|typeLabel|installationType)$/i;
    for (const key of Object.keys(project)) {
      if (isLogoField(key)) continue;
      if (TEXT_SAFE.test(key)) continue;
      if (/Alt$/i.test(key)) continue;
      if (PROJECT_MEDIA_STRING_FIELDS.includes(key)) continue;
      if (PROJECT_MEDIA_ARRAY_FIELDS.includes(key)) continue;
      // Only clear keys that clearly look like media URL containers
      if (!/^(image|imageUrl|coverImage|backgroundImage|thumbnail|thumbnailUrl|heroImage|featuredImage|beforeImage|afterImage|images|gallery|videos|media|carouselImages|mobileImageUrl|desktopImageUrl)$/i.test(key)) {
        continue;
      }
      if (/logo/i.test(key)) continue;
      if (!hasMediaValue(project[key])) continue;
      if (changes.some((c) => c.field === key)) continue;
      changes.push({ field: key, from: project[key], to: emptyFor(project[key]) });
    }
  }

  return { changes, preservedLogos };
}

function planCategoryCardClears(category) {
  if (!category) return [];
  const changes = [];
  for (const field of CATEGORY_CARD_MEDIA_FIELDS) {
    if (!(field in category)) continue;
    if (!hasMediaValue(category[field])) continue;
    changes.push({
      target: `category:${category.id}`,
      field,
      from: category[field],
      to: "",
    });
  }
  return changes;
}

function applyChanges(obj, changes) {
  for (const ch of changes) {
    obj[ch.field] = ch.to;
  }
}

async function loadCMS() {
  const raw = await fs.readFile(CMS_PATH, "utf8");
  return JSON.parse(raw);
}

async function backupAndWrite(cms) {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUPS_DIR, `cms-content.backup-${ts}.json`);
  await fs.copyFile(CMS_PATH, backupPath);
  console.log(`  Backup → ${backupPath}`);

  const tmp = CMS_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(cms, null, 2) + "\n", "utf8");
  await fs.rename(tmp, CMS_PATH);
}

function summarize() {
  return {
    eventProjects: 0,
    eventFieldsCleared: 0,
    brandProjects: 0,
    brandFieldsCleared: 0,
    logoFieldsPreserved: 0,
    categoryFieldsCleared: 0,
  };
}

async function run() {
  console.log(`\n=== ${APPLY ? "APPLY" : "DRY RUN"} — clear Events/Brands media ===`);
  console.log(`STORAGE_ROOT : ${STORAGE_ROOT}`);
  console.log(`CMS          : ${CMS_PATH}\n`);

  let cms;
  try {
    cms = await loadCMS();
  } catch (e) {
    console.error(`Cannot read CMS: ${e.message}`);
    process.exit(1);
  }

  const { eventId, brandId, eventCat, brandCat } = resolveCategoryIds(
    cms.portfolioCategories
  );

  if (!eventId) {
    console.error(
      `Event category not found (expected id=${EVENT_CATEGORY.id} or slug=${EVENT_CATEGORY.slug})`
    );
    process.exit(1);
  }
  if (!brandId) {
    console.error(
      `Brand category not found (expected id=${BRAND_CATEGORY.id} or slug=${BRAND_CATEGORY.slug})`
    );
    process.exit(1);
  }

  console.log(`Event category : id=${eventId} slug=${eventCat?.slug}`);
  console.log(`Brand category : id=${brandId} slug=${brandCat?.slug}\n`);

  const projects = Array.isArray(cms.portfolioProjects) ? cms.portfolioProjects : [];
  const eventProjects = projects.filter((p) => p.categoryId === eventId);
  const brandProjects = projects.filter((p) => p.categoryId === brandId);

  const stats = summarize();
  const plan = [];

  // Homepage category cards
  for (const ch of planCategoryCardClears(eventCat)) {
    plan.push({ kind: "category", label: "Réalisations pour événements", ...ch });
    stats.categoryFieldsCleared++;
  }
  for (const ch of planCategoryCardClears(brandCat)) {
    plan.push({ kind: "category", label: "Réalisations pour marque", ...ch });
    stats.categoryFieldsCleared++;
  }

  // Event projects — clear all media
  for (const project of eventProjects) {
    const { changes, preservedLogos } = planProjectClears(project, {
      clearAllMedia: true,
    });
    stats.eventProjects++;
    stats.eventFieldsCleared += changes.length;
    stats.logoFieldsPreserved += preservedLogos.length;
    plan.push({
      kind: "event-project",
      id: project.id,
      slug: project.slug,
      title: project.title,
      changes,
      preservedLogos,
    });
  }

  // Brand projects — clear non-logo media only
  for (const project of brandProjects) {
    const { changes, preservedLogos } = planProjectClears(project, {
      clearAllMedia: true,
    });
    stats.brandProjects++;
    stats.brandFieldsCleared += changes.length;
    stats.logoFieldsPreserved += preservedLogos.length;
    plan.push({
      kind: "brand-project",
      id: project.id,
      slug: project.slug,
      title: project.title,
      changes,
      preservedLogos,
    });
  }

  // Print plan
  for (const item of plan) {
    if (item.kind === "category") {
      console.log(`[category] ${item.label}`);
      console.log(`  CLEAR ${item.field}: ${JSON.stringify(item.from)} → ""`);
      continue;
    }
    console.log(`[${item.kind}] ${item.slug} (${item.id})`);
    if (item.changes.length === 0) {
      console.log("  (no media fields to clear)");
    }
    for (const ch of item.changes) {
      const preview =
        typeof ch.from === "string"
          ? ch.from
          : Array.isArray(ch.from)
            ? `[${ch.from.length} items]`
            : JSON.stringify(ch.from);
      console.log(`  CLEAR ${ch.field}: ${preview}`);
    }
    for (const logo of item.preservedLogos || []) {
      console.log(`  KEEP  ${logo.field}: ${JSON.stringify(logo.value)}`);
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`Event projects processed : ${stats.eventProjects}`);
  console.log(`Event media fields cleared : ${stats.eventFieldsCleared}`);
  console.log(`Brand projects processed : ${stats.brandProjects}`);
  console.log(`Brand media fields cleared : ${stats.brandFieldsCleared}`);
  console.log(`Category card fields cleared : ${stats.categoryFieldsCleared}`);
  console.log(`Logo fields preserved : ${stats.logoFieldsPreserved}`);
  console.log("Physical upload files : NOT deleted");

  if (!APPLY) {
    console.log("\nDry run only. Run  npm run cms:clear-media:apply  inside EasyPanel to apply.\n");
    return;
  }

  // Apply using the planned changes (already computed before any mutation).
  console.log("\nApplying…");

  for (const item of plan) {
    if (item.kind === "category") {
      const catId = String(item.target || "").replace(/^category:/, "");
      const target = cms.portfolioCategories?.find((c) => c.id === catId);
      if (target) target[item.field] = item.to;
      continue;
    }
    const project = projects.find((p) => p.id === item.id);
    if (!project) continue;
    applyChanges(project, item.changes);
  }

  cms.updatedAt = new Date().toISOString();
  if (typeof cms.revision === "number") cms.revision += 1;

  try {
    await backupAndWrite(cms);
    console.log("  CMS updated successfully.\n");
  } catch (e) {
    console.error(`FATAL: CMS write failed: ${e.message}`);
    process.exit(1);
  }

  console.log("Done. Re-run dry mode to confirm zero remaining media fields.\n");
}

await run();
