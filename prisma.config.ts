import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Prisma config — supports both:
 *   - Local dev:   DATABASE_URL=file:./dev.db  (Prisma uses native sqlite)
 *   - Production:  DATABASE_URL=libsql://... + TURSO_AUTH_TOKEN=...
 *                  (Prisma uses LibSQL adapter)
 *
 * For applying schema to Turso, use `pnpm tsx scripts/migrate-turso.ts`.
 */
const raw = process.env.DATABASE_URL ?? "file:./dev.db";
const isLibsql = raw.startsWith("libsql://");

const fileUrl = raw.startsWith("file:")
  ? `file:${path.resolve(process.cwd(), raw.replace(/^file:/, ""))}`
  : raw;

const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(isLibsql
    ? {
        migrations: {
          path: "prisma/migrations",
          adapter: () =>
            new PrismaLibSql({
              url: raw,
              ...(authToken ? { authToken } : {}),
            }),
        },
      }
    : {
        datasource: { url: fileUrl },
        migrations: { path: "prisma/migrations" },
      }),
});
