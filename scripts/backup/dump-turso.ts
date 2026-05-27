/**
 * Dump the entire Turso DB to a single SQL file.
 *
 * Reads schema + all data via libSQL HTTP API and produces a portable
 * SQL script that can be replayed against any SQLite-compatible DB.
 *
 * Usage:
 *   DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... \
 *   npx tsx scripts/backup/dump-turso.ts > backup.sql
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const outFile = process.argv[2] ?? "backup.sql";

  if (!url || !authToken) {
    console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
  }
  if (!url.startsWith("libsql://")) {
    console.error("DATABASE_URL must be a libsql:// URL");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  const out: string[] = [];
  const ts = new Date().toISOString();
  out.push(`-- estaila Turso backup`);
  out.push(`-- Generated: ${ts}`);
  out.push(`-- Source: ${url}`);
  out.push(`PRAGMA foreign_keys=OFF;`);
  out.push(`BEGIN TRANSACTION;`);
  out.push("");

  // 1. List all user tables
  const tablesRes = await client.execute(
    `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' ORDER BY name`
  );
  const tables = tablesRes.rows.map((r) => ({
    name: String(r.name),
    sql: String(r.sql),
  }));

  // 2. List all indexes
  const indexesRes = await client.execute(
    `SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );
  const indexes = indexesRes.rows.map((r) => ({
    name: String(r.name),
    sql: String(r.sql),
  }));

  console.error(`→ ${tables.length} tables, ${indexes.length} indexes`);

  // 3. Schema (drop + create)
  out.push(`-- ============================================================`);
  out.push(`-- SCHEMA`);
  out.push(`-- ============================================================`);
  for (const t of tables) {
    out.push(`DROP TABLE IF EXISTS "${t.name}";`);
    out.push(`${t.sql};`);
  }
  out.push("");
  for (const idx of indexes) {
    out.push(`${idx.sql};`);
  }
  out.push("");

  // 4. Data (one INSERT per row, batched)
  out.push(`-- ============================================================`);
  out.push(`-- DATA`);
  out.push(`-- ============================================================`);
  let totalRows = 0;
  for (const t of tables) {
    const rowsRes = await client.execute(`SELECT * FROM "${t.name}"`);
    if (rowsRes.rows.length === 0) {
      out.push(`-- ${t.name}: empty`);
      continue;
    }
    const cols = rowsRes.columns.map((c) => `"${c}"`).join(",");
    out.push(`-- ${t.name}: ${rowsRes.rows.length} rows`);
    for (const row of rowsRes.rows) {
      const vals = rowsRes.columns.map((c) => sqlValue(row[c]));
      out.push(`INSERT INTO "${t.name}" (${cols}) VALUES (${vals.join(",")});`);
    }
    out.push("");
    totalRows += rowsRes.rows.length;
  }

  out.push(`COMMIT;`);
  out.push(`PRAGMA foreign_keys=ON;`);

  writeFileSync(outFile, out.join("\n"), "utf8");
  client.close();
  console.error(`✓ Wrote ${outFile} — ${totalRows} rows across ${tables.length} tables`);
}

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof ArrayBuffer || v instanceof Uint8Array) {
    const bytes =
      v instanceof Uint8Array ? v : new Uint8Array(v as ArrayBuffer);
    return `X'${Buffer.from(bytes).toString("hex")}'`;
  }
  // string — escape single quotes
  return `'${String(v).replace(/'/g, "''")}'`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
