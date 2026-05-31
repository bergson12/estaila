"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionary";

/**
 * Cambia el idioma del panel. Escribe la cookie `locale` (fuente de verdad
 * para el render) y persiste User.locale (registro / futuro cross-device).
 * revalida todo el layout para que server + client re-rendericen traducidos.
 */
export async function setLocale(locale: Locale) {
  const user = await requireUser();
  const value: Locale = locale === "en" ? "en" : "es";

  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Columna additive (ensureLightweightMigrations); no bloquear si falta.
  await prisma.user
    .update({ where: { id: user.id }, data: { locale: value } })
    .catch(() => {});

  revalidatePath("/", "layout");
  return { ok: true as const, locale: value };
}
