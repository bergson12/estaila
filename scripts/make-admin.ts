/**
 * Promote a user to ADMIN role.
 * Usage: pnpm tsx scripts/make-admin.ts <email>
 *
 * Reads DATABASE_URL from env. For Turso production use libsql:// URL with
 * TURSO_AUTH_TOKEN set.
 */
import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../lib/generated/prisma/client";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({
    url,
    ...(authToken && url.startsWith("libsql://") ? { authToken } : {}),
  });
  const prisma = new PrismaClient({ adapter });

  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, role: true },
  });
  if (!u) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  if (u.role === "ADMIN") {
    console.log(`${email} is already ADMIN.`);
    return;
  }
  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log(`✓ ${u.name} (${email}) promoted to ADMIN.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
