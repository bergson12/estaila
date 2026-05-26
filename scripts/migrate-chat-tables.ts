/**
 * One-off migration: add ChatConversation + ChatMessage tables to Turso.
 *
 * Usage:
 *   DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... pnpm tsx scripts/migrate-chat-tables.ts
 *
 * Idempotent: uses CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "ChatConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nueva conversación',
    "wizard" TEXT,
    "preview" TEXT,
    "pinned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "actionsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "ChatConversation_userId_updatedAt_idx" ON "ChatConversation"("userId", "updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "ChatConversation_userId_pinned_idx" ON "ChatConversation"("userId", "pinned")`,
  `CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt")`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !url.startsWith("libsql://")) {
    console.error("DATABASE_URL must be a libsql:// URL.");
    process.exit(1);
  }
  if (!authToken) {
    console.error("TURSO_AUTH_TOKEN required.");
    process.exit(1);
  }

  console.log("→ Connecting to Turso...");
  const client = createClient({ url, authToken });

  for (const stmt of STATEMENTS) {
    const first = stmt.trim().slice(0, 60).replace(/\s+/g, " ");
    try {
      await client.execute(stmt);
      console.log(`  ✓ ${first}...`);
    } catch (e) {
      console.error(`  ✗ ${first}...`);
      console.error(`    ${(e as Error).message}`);
      process.exit(1);
    }
  }

  client.close();
  console.log("\n✓ ChatConversation + ChatMessage tables ready in Turso.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
