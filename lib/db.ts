import { PrismaClient } from "./generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Prisma client backed by LibSQL (Turso) — works in Node (Vercel server runtime)
 * and locally against either a remote Turso URL or a local SQLite file.
 *
 * Environment:
 *   - DATABASE_URL: libsql://<db>-<org>.turso.io  OR  file:./dev.db (local)
 *   - TURSO_AUTH_TOKEN: required for libsql:// URLs in production
 *
 * One global singleton in dev (survives HMR); per-process in prod.
 */

const SCHEMA_VERSION = "v7-turso-2026-05-24";

type GlobalCache = {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

const globalForPrisma = globalThis as unknown as GlobalCache;

function buildClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = new PrismaLibSql({
    url,
    ...(authToken && url.startsWith("libsql://") ? { authToken } : {}),
  });

  return new PrismaClient({ adapter });
}

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION
) {
  globalForPrisma.prisma = undefined;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
}

// ----- Auto-apply lightweight schema additions (Turso fresh deploy) -----
// Columns added in code that need to exist on the prod DB but weren't
// migrated yet. ALTER IF NOT EXISTS is cheap + idempotent.
//
// Pattern: callers that touch User must `await ensureLightweightMigrations()`
// before their first query. Cached so it only hits DDL once per process.
let migrationsPromise: Promise<void> | null = null;
export function ensureLightweightMigrations(): Promise<void> {
  if (migrationsPromise) return migrationsPromise;
  const adds: string[] = [
    `ALTER TABLE "user" ADD COLUMN "agentBio" TEXT`,
    `ALTER TABLE "user" ADD COLUMN "isTester" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "user" ADD COLUMN "creditsResetAt" DATETIME`,
    `ALTER TABLE "user" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'es'`,
    `ALTER TABLE "Transaction" ADD COLUMN "receiptUrl" TEXT`,
  ];
  migrationsPromise = (async () => {
    for (const sql of adds) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        // Column already exists or different error — silently ignore
      }
    }
  })();
  return migrationsPromise;
}

export type { Prisma } from "./generated/prisma/client";
