import { promises as fs } from "fs";
import path from "path";
import { getDefaultCMSContent } from "./defaults";
import type { CMSContent } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "cms-content.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readCMSContent(): Promise<CMSContent> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(CONTENT_FILE, "utf-8");
    return JSON.parse(raw) as CMSContent;
  } catch {
    const defaults = getDefaultCMSContent();
    await writeCMSContent(defaults);
    return defaults;
  }
}

export async function writeCMSContent(content: CMSContent): Promise<CMSContent> {
  await ensureDataDir();
  const next = { ...content, updatedAt: new Date().toISOString() };
  await fs.writeFile(CONTENT_FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export async function updateCMSContent(
  updater: (current: CMSContent) => CMSContent
): Promise<CMSContent> {
  const current = await readCMSContent();
  return writeCMSContent(updater(current));
}
