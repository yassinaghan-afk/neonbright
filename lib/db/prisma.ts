/**
 * Reusable Prisma Client singleton for a long-running self-hosted Next.js
 * process. Never create a new PrismaClient per request.
 *
 * Uses the pg driver adapter (engine-less Prisma 7 client).
 * Connection string comes exclusively from DATABASE_URL.
 */

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — required when CMS_STORAGE is 'postgres' or 'compare'"
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/** True when a database connection is configured. */
export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
