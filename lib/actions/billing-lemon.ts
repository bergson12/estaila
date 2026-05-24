"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  cancelSubscription as lsCancel,
  changeSubscriptionVariant as lsChangeVariant,
  createCheckout,
  getCustomerPortalUrl,
  packToVariant,
  planToVariant,
} from "@/lib/lemonsqueezy";
import type { PlanKey, CreditPackId } from "@/lib/billing-config";
import { CREDIT_PACKS, PLAN_CREDITS } from "@/lib/billing-config";

// ============================================================
// CHECKOUT — Subscription
// ============================================================

/**
 * Create a Lemon Squeezy checkout URL for a plan/cycle and return it.
 * Client redirects (or opens overlay) using this URL.
 */
export async function createLemonCheckout(
  plan: PlanKey,
  cycle: "monthly" | "yearly" = "monthly"
): Promise<{ url: string }> {
  const user = await requireUser();

  const variantId = planToVariant(plan, cycle);
  if (!variantId) {
    throw new Error(
      `Variante LS no configurada para ${plan} ${cycle}. Setea LEMONSQUEEZY_VARIANT_${plan}_${cycle.toUpperCase()}.`
    );
  }

  const checkout = await createCheckout({
    variantId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name ?? undefined,
    customData: { plan, cycle, source: "crm" },
    redirectUrl:
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing/success?provider=ls&plan=${plan}`,
  });

  return { url: checkout.data.attributes.url };
}

// ============================================================
// FORM ACTION wrappers (redirect-style, for <form action={...}>)
// ============================================================

export async function startLemonSubscriptionAction(formData: FormData) {
  const plan = formData.get("plan") as PlanKey;
  const cycle = (formData.get("cycle") as "monthly" | "yearly") ?? "monthly";
  const { url } = await createLemonCheckout(plan, cycle);
  redirect(url);
}

export async function buyLemonPackAction(formData: FormData) {
  const packId = formData.get("packId") as CreditPackId;
  const { url } = await createLemonPackCheckout(packId);
  redirect(url);
}

export async function cancelLemonSubscriptionAction() {
  await cancelLemonSubscription();
}

export async function openLemonPortalAction() {
  const { url } = await getLemonPortalUrl();
  redirect(url);
}

// ============================================================
// CHECKOUT — Credit pack (one-time)
// ============================================================

export async function createLemonPackCheckout(
  packId: CreditPackId
): Promise<{ url: string }> {
  const user = await requireUser();

  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error("Pack inválido");

  const variantId = packToVariant(packId);
  if (!variantId) {
    throw new Error(
      `Variante LS no configurada para ${packId}. Setea LEMONSQUEEZY_VARIANT_${packId}.`
    );
  }

  const checkout = await createCheckout({
    variantId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name ?? undefined,
    customData: { pack: packId, credits: String(pack.credits), source: "crm" },
    redirectUrl:
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing/success?provider=ls&pack=${packId}`,
  });

  return { url: checkout.data.attributes.url };
}

// ============================================================
// CANCEL
// ============================================================

export async function cancelLemonSubscription() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lsSubId: true, plan: true },
  });
  if (!dbUser?.lsSubId)
    throw new Error("No tienes suscripción Lemon Squeezy activa");

  await lsCancel(dbUser.lsSubId);
  await prisma.user.update({
    where: { id: user.id },
    data: { planActive: false },
  });
  // Don't clear plan/lsSubId — keep until webhook confirms expiry.
  revalidatePath("/empresa");
  revalidatePath("/billing/success");
  return { ok: true };
}

// ============================================================
// CHANGE PLAN (upgrade / downgrade in-place via LS)
// ============================================================

export async function changeLemonPlan(
  plan: PlanKey,
  cycle: "monthly" | "yearly" = "monthly"
) {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lsSubId: true },
  });
  if (!dbUser?.lsSubId)
    throw new Error("No tienes suscripción LS activa para cambiar");

  const variantId = planToVariant(plan, cycle);
  if (!variantId) throw new Error(`Variante LS no configurada: ${plan} ${cycle}`);

  await lsChangeVariant(dbUser.lsSubId, variantId);
  // Webhook will sync plan/lsVariantId/planRenewsAt.
  revalidatePath("/empresa");
  return { ok: true };
}

// ============================================================
// CUSTOMER PORTAL — single-use URL
// ============================================================

export async function getLemonPortalUrl(): Promise<{ url: string }> {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lsSubId: true },
  });
  if (!dbUser?.lsSubId)
    throw new Error("No tienes suscripción LS para administrar");

  const url = await getCustomerPortalUrl(dbUser.lsSubId);
  return { url };
}

// ============================================================
// INTERNAL — apply plan upgrade from webhook
// (Called from /api/lemonsqueezy/webhook, NOT from client)
// ============================================================

export async function applyLemonPlanUpgrade(args: {
  userId: string;
  plan: PlanKey;
  lsSubId: string;
  lsCustomerId: string;
  lsVariantId: string;
  renewsAt: Date | null;
}) {
  const credits = PLAN_CREDITS[args.plan];

  await prisma.$transaction([
    prisma.user.update({
      where: { id: args.userId },
      data: {
        plan: args.plan,
        lsSubId: args.lsSubId,
        lsCustomerId: args.lsCustomerId,
        lsVariantId: args.lsVariantId,
        billingProvider: "LEMONSQUEEZY",
        planActive: true,
        planRenewsAt: args.renewsAt,
        credits: { increment: credits },
      },
    }),
    prisma.billingEvent.upsert({
      where: { id: `${args.lsSubId}-activated` },
      create: {
        id: `${args.lsSubId}-activated`,
        userId: args.userId,
        type: "SUB_ACTIVATED",
        provider: "LEMONSQUEEZY",
        reference: args.lsSubId,
        credits,
        metadata: JSON.stringify({ plan: args.plan }),
      },
      update: {},
    }),
  ]);
}

export async function applyLemonPlanCancelled(args: { lsSubId: string }) {
  const user = await prisma.user.findFirst({
    where: { lsSubId: args.lsSubId },
    select: { id: true },
  });
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { planActive: false },
  });
  await prisma.billingEvent.create({
    data: {
      userId: user.id,
      type: "SUB_CANCELLED",
      provider: "LEMONSQUEEZY",
      reference: args.lsSubId,
    },
  });
}

export async function applyLemonRenewal(args: {
  lsSubId: string;
  renewsAt: Date | null;
}) {
  await prisma.user.updateMany({
    where: { lsSubId: args.lsSubId },
    data: { planActive: true, planRenewsAt: args.renewsAt },
  });
}

export async function applyLemonCreditsPurchase(args: {
  userId: string;
  packId: CreditPackId;
  reference: string;
}) {
  const pack = CREDIT_PACKS.find((p) => p.id === args.packId);
  if (!pack) return;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: args.userId },
      data: { credits: { increment: pack.credits } },
    }),
    prisma.billingEvent.upsert({
      where: { id: `${args.reference}-pack` },
      create: {
        id: `${args.reference}-pack`,
        userId: args.userId,
        type: "PACK_PURCHASED",
        provider: "LEMONSQUEEZY",
        reference: args.reference,
        amount: pack.priceUSD,
        credits: pack.credits,
        metadata: JSON.stringify({ pack: args.packId }),
      },
      update: {},
    }),
  ]);
}
