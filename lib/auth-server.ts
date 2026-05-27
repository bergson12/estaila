import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma, ensureLightweightMigrations } from "./db";

export async function getCurrentSession() {
  // Ensure additive schema migrations (e.g. agentBio column) are applied
  // before Better Auth's prisma adapter runs findUnique. Cached after first run.
  await ensureLightweightMigrations();
  return await auth.api.getSession({ headers: await headers() });
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require an ADMIN user. Redirects to /dashboard if user is not admin.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  return dbUser?.role === "ADMIN";
}
