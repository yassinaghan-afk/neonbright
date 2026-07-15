/**
 * Local security checks for upload path handling.
 * Run: npx --yes tsx scripts/verify-storage-security.ts
 */
import assert from "assert";
import {
  resolveUploadFilename,
  resolveSafeUploadPath,
  isAllowedUploadExtension,
} from "../lib/cms/upload-storage";

process.env.STORAGE_ROOT = "/tmp/neonbright-security-test-storage";

let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log("PASS:", name);
  } catch (err) {
    failed++;
    console.error("FAIL:", name, err instanceof Error ? err.message : err);
  }
}

check("rejects path traversal in filename", () => {
  assert.equal(resolveUploadFilename("../etc/passwd"), null);
  assert.equal(resolveUploadFilename("..\\windows"), null);
  assert.equal(resolveUploadFilename("foo/../bar.jpg"), null);
});

check("rejects absolute-ish / encoded traversal", () => {
  assert.equal(resolveUploadFilename("%2e%2e%2fpasswd"), null);
  assert.equal(resolveUploadFilename("..%2fetc"), null);
});

check("accepts safe generate ids", () => {
  assert.ok(resolveUploadFilename("img_m1abc_xyz.png"));
});

check("blocks executable extensions", () => {
  assert.equal(isAllowedUploadExtension("evil.exe"), false);
  assert.equal(isAllowedUploadExtension("x.sh"), false);
  assert.equal(isAllowedUploadExtension("a.php"), false);
  assert.equal(isAllowedUploadExtension("ok.jpg"), true);
  assert.equal(isAllowedUploadExtension("clip.mp4"), true);
});

check("resolveSafeUploadPath stays under uploads root", () => {
  const p = resolveSafeUploadPath("img_ok.png", "events");
  assert.ok(p);
  assert.ok(p!.includes("/uploads/events/img_ok.png"));
  assert.equal(resolveSafeUploadPath("img_ok.png", "../events"), null);
  assert.equal(resolveSafeUploadPath("../../etc/passwd", "cms"), null);
});

check("unknown category rejected", () => {
  assert.equal(resolveSafeUploadPath("img_ok.png", "not-a-category"), null);
});

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll security checks passed");
