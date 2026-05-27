"use server";

/**
 * Admin password actions.
 *
 * - sendPasswordResetEmail: triggers Better Auth's reset flow for a user.
 *   Admin never sees the new password; user gets a secure email link.
 * - setUserPasswordDirect: hard-set a password directly (uses Better Auth's
 *   internal hash via the public account update API). For cases where the
 *   admin needs to set a specific password (e.g. user can't access their email).
 */

import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function sendPasswordResetEmail(args: {
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const target = await prisma.user.findUnique({
      where: { id: args.userId },
      select: { email: true },
    });
    if (!target?.email) {
      return { ok: false, error: "Usuario o email no encontrado" };
    }
    await auth.api.requestPasswordReset({
      body: { email: target.email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Direct password set — uses scrypt to hash and writes directly to the
 * credential account. Use sparingly (only when email-based flow is impossible).
 */
export async function setUserPasswordDirect(args: {
  userId: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (args.newPassword.length < 6) {
      return { ok: false, error: "Contraseña mínimo 6 caracteres" };
    }
    // Use Better Auth's internal context to hash with the same algorithm
    // Better Auth uses on signup. Available via auth.$context.password.hash().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (auth as any).$context;
    const hasher = ctx?.password?.hash ?? ctx?.context?.password?.hash;
    if (typeof hasher !== "function") {
      return {
        ok: false,
        error: "Hasher de Better Auth no disponible — usa el flow por email.",
      };
    }
    const hashed = await hasher(args.newPassword);

    // Find the credential account for this user
    const account = await prisma.account.findFirst({
      where: { userId: args.userId, providerId: "credential" },
      select: { id: true },
    });
    if (!account) {
      return {
        ok: false,
        error: "Usuario no tiene cuenta con email/contraseña (¿login con Google?). Usa el flow por email.",
      };
    }
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
