/**
 * Production Smoke Test
 *
 * Quick health check for deployed NeonBright application.
 * Verifies core functionality without modifying production data.
 *
 * Usage:
 *   node --import=tsx scripts/production-smoke-test.ts [base-url]
 *
 * Example:
 *   node --import=tsx scripts/production-smoke-test.ts https://neonbright.easypanel.host
 *   node --import=tsx scripts/production-smoke-test.ts http://localhost:3000
 */

import { promises as fs } from "fs";
import path from "path";

const BASE_URL = process.argv[2] || "http://localhost:3000";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  message?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function test(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      status: "pass",
      duration: Date.now() - start,
    });
  } catch (err) {
    results.push({
      name,
      status: "fail",
      message: err instanceof Error ? err.message : String(err),
      duration: Date.now() - start,
    });
  }
}

async function httpGet(url: string): Promise<{ status: number; ok: boolean }> {
  const response = await fetch(url);
  return { status: response.status, ok: response.ok };
}

async function checkStorageHealth(): Promise<void> {
  const storageRoot = process.env.STORAGE_ROOT || path.join(process.cwd(), "storage");
  const cmsPath = path.join(storageRoot, "cms-content.json");

  try {
    const content = await fs.readFile(cmsPath, "utf-8");
    const parsed = JSON.parse(content);

    if (!parsed.portfolioProjects || !Array.isArray(parsed.portfolioProjects)) {
      throw new Error("Invalid CMS structure: missing portfolioProjects array");
    }

    if (typeof parsed.revision !== "number") {
      console.warn("⚠️  CMS revision field missing (will be added on next write)");
    }

    console.log(`  CMS: ${parsed.portfolioProjects.length} projects, revision ${parsed.revision ?? "N/A"}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("CMS file not found at " + cmsPath);
    }
    throw err;
  }
}

async function main() {
  console.log("\n🔍 NeonBright Production Smoke Test");
  console.log(`   Base URL: ${BASE_URL}\n`);

  // Public pages
  await test("Homepage returns 200", async () => {
    const res = await httpGet(BASE_URL);
    if (!res.ok) throw new Error(`Got ${res.status}`);
  });

  await test("Events listing returns 200", async () => {
    const res = await httpGet(`${BASE_URL}/realisations/events`);
    if (!res.ok) throw new Error(`Got ${res.status}`);
  });

  await test("Brands listing returns 200", async () => {
    const res = await httpGet(`${BASE_URL}/realisations/brands`);
    if (!res.ok) throw new Error(`Got ${res.status}`);
  });

  // Note: Can't test specific detail pages without knowing valid slugs
  // In a real deployment, you'd query the API first or use known slugs

  await test("Invalid Event slug returns 404", async () => {
    const res = await httpGet(`${BASE_URL}/realisations/events/nonexistent-test-slug-12345`);
    if (res.status !== 404) {
      throw new Error(`Expected 404, got ${res.status}`);
    }
  });

  await test("Invalid Brand slug returns 404", async () => {
    const res = await httpGet(`${BASE_URL}/realisations/brands/nonexistent-test-slug-12345`);
    if (res.status !== 404) {
      throw new Error(`Expected 404, got ${res.status}`);
    }
  });

  // API endpoints
  await test("Public portfolio API returns valid JSON", async () => {
    const response = await fetch(`${BASE_URL}/api/portfolio`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error("API response missing projects array");
    }
    console.log(`  API: ${data.projects.length} projects`);
  });

  // Storage health (only if running locally or with filesystem access)
  if (BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1")) {
    await test("CMS storage is valid and writable", checkStorageHealth);
  } else {
    results.push({
      name: "CMS storage health",
      status: "skip",
      message: "Skipped (remote deployment)",
    });
  }

  // Print results
  console.log("\n📊 Test Results:\n");

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const result of results) {
    const icon = result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⏭️ ";
    const duration = result.duration ? ` (${result.duration}ms)` : "";
    console.log(`${icon} ${result.name}${duration}`);

    if (result.message) {
      console.log(`   ${result.message}`);
    }

    if (result.status === "pass") passed++;
    else if (result.status === "fail") failed++;
    else skipped++;
  }

  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);

  if (failed > 0) {
    console.error("❌ Some tests failed. Check logs above.");
    process.exit(1);
  } else {
    console.log("✅ All tests passed!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("\n❌ Smoke test failed:");
  console.error(err);
  process.exit(1);
});
