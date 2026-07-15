import { promises as fs } from "fs";
import path from "path";

/**
 * Simple file-based mutex for single-process serialized CMS writes.
 *
 * Uses exclusive file open with O_EXCL flag. If multiple processes need
 * coordination, use a proper distributed lock (Redis, Postgres advisory lock).
 *
 * For NeonBright's single-container EasyPanel deployment, this is sufficient.
 */

export class FileLock {
  private lockPath: string;
  private lockFd: fs.FileHandle | null = null;

  constructor(resourcePath: string) {
    const dir = path.dirname(resourcePath);
    const name = path.basename(resourcePath);
    this.lockPath = path.join(dir, `.${name}.lock`);
  }

  /**
   * Acquire exclusive lock. Spins with exponential backoff if lock is held.
   *
   * @param options.timeout - Max milliseconds to wait (default: 30000)
   * @param options.retryDelay - Initial retry delay in ms (default: 10)
   * @returns true if acquired, false if timeout
   */
  async acquire(options?: {
    timeout?: number;
    retryDelay?: number;
  }): Promise<boolean> {
    const timeout = options?.timeout ?? 30000;
    const initialDelay = options?.retryDelay ?? 10;
    const start = Date.now();
    let delay = initialDelay;

    while (Date.now() - start < timeout) {
      try {
        // Try to create lock file exclusively (fails if exists).
        this.lockFd = await fs.open(this.lockPath, "wx");
        await this.lockFd.write(`${process.pid}\n${new Date().toISOString()}\n`);
        await this.lockFd.datasync();
        return true;
      } catch (err: unknown) {
        // Lock file exists or other error.
        if (this.isErrnoException(err) && err.code === "EEXIST") {
          // Lock held by another operation. Wait and retry.
          await this.sleep(delay);
          delay = Math.min(delay * 1.5, 1000); // Exponential backoff, max 1s
          continue;
        }
        // Unexpected error (permissions, etc.).
        throw err;
      }
    }

    // Timeout
    return false;
  }

  /**
   * Release the lock. Safe to call multiple times.
   */
  async release(): Promise<void> {
    if (this.lockFd) {
      try {
        await this.lockFd.close();
      } catch {
        /* ignore */
      }
      this.lockFd = null;
    }

    try {
      await fs.unlink(this.lockPath);
    } catch {
      /* ignore if already removed */
    }
  }

  /**
   * Execute fn with exclusive lock. Automatically releases lock after fn.
   *
   * @example
   * await lock.withLock(async () => {
   *   // Critical section
   * });
   */
  async withLock<T>(
    fn: () => Promise<T>,
    options?: { timeout?: number }
  ): Promise<T> {
    const acquired = await this.acquire(options);
    if (!acquired) {
      throw new Error(
        `Failed to acquire lock on ${this.lockPath} within ${options?.timeout ?? 30000}ms`
      );
    }

    try {
      return await fn();
    } finally {
      await this.release();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isErrnoException(err: unknown): err is NodeJS.ErrnoException {
    return (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as NodeJS.ErrnoException).code === "string"
    );
  }
}

/**
 * Convenience: run fn with exclusive lock on resourcePath.
 */
export async function withFileLock<T>(
  resourcePath: string,
  fn: () => Promise<T>,
  options?: { timeout?: number }
): Promise<T> {
  const lock = new FileLock(resourcePath);
  return lock.withLock(fn, options);
}
