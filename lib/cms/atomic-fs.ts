import { promises as fs } from "fs";
import path from "path";

/**
 * Atomically write a file: write to temp next to target, then rename.
 */
export async function atomicWriteFile(
  targetPath: string,
  data: string | Buffer,
  encoding: BufferEncoding = "utf-8"
): Promise<void> {
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });

  const tmp = path.join(
    dir,
    `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`
  );

  try {
    if (typeof data === "string") {
      await fs.writeFile(tmp, data, encoding);
    } else {
      await fs.writeFile(tmp, data);
    }
    await fs.rename(tmp, targetPath);
  } catch (err) {
    try {
      await fs.unlink(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}
