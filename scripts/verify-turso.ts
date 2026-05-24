import "dotenv/config";
import { createClient } from "@libsql/client";

async function main() {
  const c = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const r = await c.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log(`Tables in Turso (${r.rows.length}):`);
  for (const row of r.rows) console.log("  -", row.name);
  c.close();
}

main();
