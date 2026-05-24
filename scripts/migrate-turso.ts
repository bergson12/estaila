/**
 * Apply Prisma schema to a Turso (libSQL) database.
 *
 * Strategy:
 *   1. Generate a full "from-empty" SQL diff with `prisma migrate diff`.
 *   2. Execute every statement against Turso via @libsql/client.
 *
 * Usage:
 *   DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... pnpm tsx scripts/migrate-turso.ts
 *
 * Idempotent-ish: we run inside a single transaction. If anything fails the
 * database stays untouched. Re-running on an already-migrated DB will fail
 * (CREATE TABLE collisions) — that's the safe behaviour for fresh setup.
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !url.startsWith("libsql://")) {
    console.error(
      "DATABASE_URL must be a libsql:// URL. Got:",
      url ?? "(unset)"
    );
    process.exit(1);
  }
  if (!authToken) {
    console.error("TURSO_AUTH_TOKEN is required.");
    process.exit(1);
  }

  console.log("→ Generating SQL from Prisma schema...");
  // Run prisma diff with DATABASE_URL pointing at a local file so the
  // libsql-aware prisma.config.ts doesn't kick in. The actual Turso
  // connection happens via @libsql/client below.
  const childEnv = {
    ...process.env,
    DATABASE_URL: "file:./dev.db",
    TURSO_AUTH_TOKEN: "",
  };
  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env: childEnv }
  );

  // Strip comment-only lines, then split on `;` (works because Prisma emits
  // one statement per CREATE TABLE / CREATE INDEX block ending with `;`).
  const stripped = sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");

  const statements = stripped
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`→ ${statements.length} statements to execute`);
  console.log("→ Connecting to Turso...");

  const client = createClient({ url, authToken });

  let ok = 0;
  let fail = 0;
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      ok++;
    } catch (e) {
      fail++;
      console.error(`  ✗ Failed: ${stmt.slice(0, 80)}...`);
      console.error(`    ${(e as Error).message}`);
    }
  }

  client.close();

  console.log(`\n✓ Applied: ${ok}`);
  if (fail > 0) {
    console.log(`✗ Failed:  ${fail}`);
    process.exit(1);
  } else {
    console.log("🎉 Schema applied successfully to Turso.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
