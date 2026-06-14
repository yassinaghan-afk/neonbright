import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_SEO_REGISTRY } from "./defaults";
import type { SeoRegistry } from "./types";

const REGISTRY_FILE = path.join(process.cwd(), "data/seo-registry.json");

let cache: SeoRegistry | null = null;

function mergeRegistry(parsed: Partial<SeoRegistry>): SeoRegistry {
  return {
    updatedAt: parsed.updatedAt ?? DEFAULT_SEO_REGISTRY.updatedAt,
    services: parsed.services?.length ? parsed.services : DEFAULT_SEO_REGISTRY.services,
    cities: parsed.cities?.length ? parsed.cities : DEFAULT_SEO_REGISTRY.cities,
    industries: parsed.industries?.length ? parsed.industries : DEFAULT_SEO_REGISTRY.industries,
  };
}

export async function getSeoRegistry(): Promise<SeoRegistry> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(REGISTRY_FILE, "utf-8");
    cache = mergeRegistry(JSON.parse(raw) as SeoRegistry);
    return cache;
  } catch {
    cache = DEFAULT_SEO_REGISTRY;
    return cache;
  }
}

export function getSeoRegistrySync(): SeoRegistry {
  return cache ?? DEFAULT_SEO_REGISTRY;
}

export async function hydrateSeoRegistry(): Promise<SeoRegistry> {
  return getSeoRegistry();
}

export function clearSeoRegistryCache() {
  cache = null;
}

export async function writeSeoRegistry(registry: SeoRegistry): Promise<void> {
  await fs.mkdir(path.dirname(REGISTRY_FILE), { recursive: true });
  await fs.writeFile(
    REGISTRY_FILE,
    JSON.stringify({ ...registry, updatedAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
  cache = registry;
}
