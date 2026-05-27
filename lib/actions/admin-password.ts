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
import { hashPassword } from "better-auth/crypto";
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

    // Hash with Better Auth's official function — produces the same format
    // Better Auth stores on signup (scrypt-based).
    const hashed = await hashPassword(args.newPassword);

    // Find or create the credential account for this user. A user who only
    // signed up with Google has no credential account yet; we create one so
    // they can also log in with email + the admin-set password.
    const target = await prisma.user.findUnique({
      where: { id: args.userId },
      select: { id: true, email: true },
    });
    if (!target) return { ok: false, error: "Usuario no encontrado" };

    const account = await prisma.account.findFirst({
      where: { userId: args.userId, providerId: "credential" },
      select: { id: true },
    });

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashed },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: args.userId,
          providerId: "credential",
          accountId: target.email,
          password: hashed,
        },
      });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
