#!/usr/bin/env node
/**
 * Import a CMS JSON snapshot into STORAGE_ROOT/cms-content.json
 *
 * Usage:
 *   node scripts/import-cms-content.mjs \
 *     --source "/path/to/content-before-recovery-2026-07-15.json" \
 *     --dry-run
 *
 *   STORAGE_ROOT=/app/storage node scripts/import-cms-content.mjs \
 *     --source "./imports/content-before-recovery-2026-07-15.json"
 *
 * Safety:
 * - validates JSON first
 * - creates timestamped backup if target exists
 * - atomic write
 * - does not alter IDs or content
 * - dry-run mode (default unless --apply)
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { source: null, dryRun: true, apply: false, storageRoot: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--source") out.source = argv[++i];
    else if (a === "--storage-root") out.storageRoot = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--apply") {
      out.apply = true;
      out.dryRun = false;
    }
  }
  return out;
}

async function atomicWrite(targetPath, data) {
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(
    dir,
    `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`
  );
  await fs.writeFile(tmp, data, "utf-8");
  await fs.rename(tmp, targetPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source) {
    console.error(
      "Usage: node scripts/import-cms-content.mjs --source <file.json> [--dry-run|--apply] [--storage-root <path>]"
    );
    process.exit(1);
  }

  const storageRoot = path.resolve(
    args.storageRoot ||
      process.env.STORAGE_ROOT ||
      path.join(ROOT, "storage")
  );
  const target = path.join(storageRoot, "cms-content.json");
  const sourcePath = path.resolve(args.source);

  console.log("[import-cms] source:", sourcePath);
  console.log("[import-cms] target:", target);
  console.log("[import-cms] mode:", args.dryRun ? "DRY-RUN" : "APPLY");

  const raw = await fs.readFile(sourcePath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("[import-cms] INVALID JSON:", err.message);
    process.exit(1);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.error("[import-cms] JSON root must be an object");
    process.exit(1);
  }

  // Lightweight shape check — do not alter content
  const keys = Object.keys(parsed);
  console.log("[import-cms] top-level keys:", keys.length, keys.slice(0, 12).join(", "));
  console.log(
    "[import-cms] portfolioProjects:",
    Array.isArray(parsed.portfolioProjects) ? parsed.portfolioProjects.length : "n/a"
  );
  console.log(
    "[import-cms] reviews:",
    Array.isArray(parsed.reviews) ? parsed.reviews.length : "n/a"
  );

  let targetExists = false;
  try {
    await fs.access(target);
    targetExists = true;
  } catch {
    targetExists = false;
  }

  if (targetExists) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backup = path.join(storageRoot, `cms-content.backup-${stamp}.json`);
    console.log("[import-cms] target exists — would backup to:", backup);
    if (!args.dryRun) {
      await fs.copyFile(target, backup);
      console.log("[import-cms] backup written");
    }
  } else {
    console.log("[import-cms] target does not exist yet");
  }

  // Write exact source bytes (preserve content/IDs). Re-stringify with same parse ensure valid JSON file.
  const payload = JSON.stringify(parsed, null, 2);

  if (args.dryRun) {
    console.log("[import-cms] DRY-RUN complete — no files written");
    console.log("[import-cms] To apply: add --apply");
    return;
  }

  await atomicWrite(target, payload);
  console.log("[import-cms] APPLY complete — wrote", target);
}

main().catch((err) => {
  console.error("[import-cms] failed:", err);
  process.exit(1);
});
