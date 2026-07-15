import { promises as fs } from "fs";
import path from "path";
import { getStorageRoot } from "@/lib/cms/storage-paths";

const BACKUP_DIR_NAME = "backups";
const MAX_BACKUPS = 30; // Keep last 30 versions

/**
 * Get the backups directory path.
 */
export function getBackupsDir(): string {
  return path.join(getStorageRoot(), BACKUP_DIR_NAME);
}

/**
 * Create a timestamped backup of the CMS content file.
 *
 * @param sourcePath - Path to cms-content.json
 * @param reason - Optional reason for backup (e.g., "before-delete", "scheduled")
 * @returns Path to created backup file, or null if source doesn't exist
 */
export async function createBackup(
  sourcePath: string,
  reason?: string
): Promise<string | null> {
  try {
    // Check if source exists
    await fs.access(sourcePath);
  } catch {
    return null; // Source doesn't exist, nothing to backup
  }

  const backupsDir = getBackupsDir();
  await fs.mkdir(backupsDir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, -5); // Format: 2026-07-15_23-45-30

  const reasonSuffix = reason ? `-${reason.replace(/[^a-z0-9-]/gi, "-")}` : "";
  const backupFilename = `cms-content_${timestamp}${reasonSuffix}.json`;
  const backupPath = path.join(backupsDir, backupFilename);

  try {
    await fs.copyFile(sourcePath, backupPath);
    console.log(`[cms-backup] created: ${backupFilename}`);
    
    // Cleanup old backups
    await cleanupOldBackups();
    
    return backupPath;
  } catch (err) {
    console.error("[cms-backup] failed to create backup:", err);
    throw err;
  }
}

/**
 * Keep only the most recent MAX_BACKUPS backup files.
 * Removes oldest backups first.
 */
export async function cleanupOldBackups(): Promise<void> {
  const backupsDir = getBackupsDir();

  try {
    const files = await fs.readdir(backupsDir);
    
    // Filter to only cms-content backup files
    const backupFiles = files
      .filter((f) => f.startsWith("cms-content_") && f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: path.join(backupsDir, f),
      }));

    if (backupFiles.length <= MAX_BACKUPS) {
      return; // No cleanup needed
    }

    // Sort by filename (timestamp) descending (newest first)
    backupFiles.sort((a, b) => b.name.localeCompare(a.name));

    // Remove oldest backups
    const toDelete = backupFiles.slice(MAX_BACKUPS);
    
    for (const file of toDelete) {
      try {
        await fs.unlink(file.path);
        console.log(`[cms-backup] removed old backup: ${file.name}`);
      } catch (err) {
        console.warn(`[cms-backup] failed to remove ${file.name}:`, err);
      }
    }

    if (toDelete.length > 0) {
      console.log(
        `[cms-backup] cleanup: removed ${toDelete.length} old backup(s), kept ${MAX_BACKUPS}`
      );
    }
  } catch (err) {
    console.warn("[cms-backup] cleanup failed:", err);
    // Non-fatal, continue
  }
}

/**
 * List all available backups, newest first.
 */
export async function listBackups(): Promise<
  Array<{ filename: string; path: string; size: number; mtime: Date }>
> {
  const backupsDir = getBackupsDir();

  try {
    await fs.access(backupsDir);
  } catch {
    return []; // No backups directory
  }

  try {
    const files = await fs.readdir(backupsDir);
    const backupFiles = files.filter(
      (f) => f.startsWith("cms-content_") && f.endsWith(".json")
    );

    const backups = await Promise.all(
      backupFiles.map(async (filename) => {
        const filePath = path.join(backupsDir, filename);
        const stats = await fs.stat(filePath);
        return {
          filename,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime,
        };
      })
    );

    // Sort by modification time descending (newest first)
    backups.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return backups;
  } catch (err) {
    console.error("[cms-backup] failed to list backups:", err);
    return [];
  }
}

/**
 * Restore CMS content from a backup file.
 *
 * @param backupPath - Path to backup file
 * @param targetPath - Path to restore to (usually cms-content.json)
 * @param createBackupBeforeRestore - Create backup of current state before restoring
 * @returns true if successful
 */
export async function restoreFromBackup(
  backupPath: string,
  targetPath: string,
  createBackupBeforeRestore = true
): Promise<boolean> {
  try {
    // Validate backup file exists and is valid JSON
    const backupContent = await fs.readFile(backupPath, "utf-8");
    JSON.parse(backupContent); // Validate JSON

    // Create backup of current state before restoring
    if (createBackupBeforeRestore) {
      try {
        await createBackup(targetPath, "before-restore");
      } catch {
        // Continue even if backup fails
      }
    }

    // Restore
    await fs.copyFile(backupPath, targetPath);
    console.log(`[cms-backup] restored from: ${path.basename(backupPath)}`);
    
    return true;
  } catch (err) {
    console.error("[cms-backup] restore failed:", err);
    return false;
  }
}
