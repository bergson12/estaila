import { prisma } from "@/lib/db";
import {
  PLAN_PROPERTY_LIMIT,
  PLAN_CONTACT_LIMIT,
  FREE_MONTHLY_CREDITS,
} from "@/lib/billing-config";

/**
 * Límites del plan FREE (propiedades / contactos). Los planes pagos son
 * ilimitados. Se llama ANTES de crear; lanza un error amigable si excede.
 */
export async function assertWithinPlanLimit(
  userId: string,
  kind: "property" | "contact"
): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const plan = u?.plan ?? "FREE";
  const limit =
    (kind === "property" ? PLAN_PROPERTY_LIMIT : PLAN_CONTACT_LIMIT)[plan] ??
    Infinity;
  if (!Number.isFinite(limit)) return; // plan pago = ilimitado

  const count =
    kind === "property"
      ? await prisma.property.count({ where: { userId } })
      : await prisma.contact.count({ where: { userId } });

  if (count >= limit) {
    const label = kind === "property" ? "propiedades" : "contactos";
    throw new Error(
      `Tu plan Free permite hasta ${limit} ${label}. Sube a Solo (desde US$12/mes) para ${label} ilimitados.`
    );
  }
}

/**
 * Créditos mensuales del plan FREE. Al cambiar de mes hace TOP-UP a
 * FREE_MONTHLY_CREDITS (no pisa créditos comprados ni acumula): el usuario free
 * siempre arranca el mes con al menos 10. Los planes pagos NO pasan por aquí
 * (sus créditos los renueva el webhook de facturación). Devuelve el saldo final.
 */
export async function ensureFreeMonthlyCredits(user: {
  id: string;
  plan: string;
  credits: number;
  creditsResetAt: Date | null;
}): Promise<number> {
  if (user.plan !== "FREE") return user.credits;
  const now = new Date();
  const last = user.creditsResetAt;
  const sameMonth =
    !!last &&
    last.getUTCFullYear() === now.getUTCFullYear() &&
    last.getUTCMonth() === now.getUTCMonth();
  if (sameMonth) return user.credits;

  const next = Math.max(user.credits, FREE_MONTHLY_CREDITS);
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: next, creditsResetAt: now },
    });
  } catch {
    // columna creditsResetAt aún no migrada en runtime — no romper el render
    return user.credits;
  }
  return next;
}
