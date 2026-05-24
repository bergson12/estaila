"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  cancelSubscription as ppCancelSubscription,
  createOrder,
  createSubscription,
  isPayPalConfigured,
} from "@/lib/paypal";
import {
  CREDIT_PACKS,
  PLAN_CREDITS,
  PLAN_PRICE,
  type PlanKey,
} from "@/lib/billing-config";

function originFromHeaders(h: Headers): string {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Start a PayPal subscription flow. Returns approval URL (client redirects).
 */
export async function startSubscription(plan: PlanKey): Promise<{ approveUrl: string }> {
  const user = await requireUser();
  if (!isPayPalConfigured()) {
    throw new Error(
      "PayPal no está configurado. Define PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_PLAN_PRO y PAYPAL_PLAN_TEAM en .env"
    );
  }
  const planId =
    plan === "PRO"
      ? process.env.PAYPAL_PLAN_PRO
      : plan === "TEAM"
        ? process.env.PAYPAL_PLAN_TEAM
        : process.env.PAYPAL_PLAN_AGENCY;
  if (!planId) {
    throw new Error(`Falta PAYPAL_PLAN_${plan} en .env (crea el plan en dashboard PayPal y pega el ID)`);
  }
  const h = await headers();
  const origin = originFromHeaders(h);
  const { id, approveUrl } = await createSubscription({
    planId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    returnUrl: `${origin}/billing/success?type=sub&plan=${plan}`,
    cancelUrl: `${origin}/billing/cancel`,
  });
  // Pre-record (status set to inactive until webhook confirms)
  await prisma.billingEvent.create({
    data: {
      userId: user.id,
      type: "SUB_PENDING",
      amount: PLAN_PRICE[plan],
      reference: id,
      metadata: JSON.stringify({ plan }),
    },
  });
  return { approveUrl };
}

/**
 * Cancel current user's PayPal subscription.
 */
export async function cancelMySubscription(): Promise<void> {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { paypalSubId: true, plan: true },
  });
  if (!dbUser?.paypalSubId) throw new Error("No tienes suscripción activa");
  await ppCancelSubscription(dbUser.paypalSubId);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { planActive: false },
    }),
    prisma.billingEvent.create({
      data: {
        userId: user.id,
        type: "SUB_CANCELLED",
        reference: dbUser.paypalSubId,
        metadata: JSON.stringify({ plan: dbUser.plan, cancelledBy: "user" }),
      },
    }),
  ]);
}

/**
 * Buy a one-time credit pack. Returns PayPal approval URL.
 */
export async function buyCreditPack(packId: string): Promise<{ approveUrl: string }> {
  const user = await requireUser();
  if (!isPayPalConfigured()) {
    throw new Error("PayPal no está configurado.");
  }
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error("Pack no encontrado");

  const h = await headers();
  const origin = originFromHeaders(h);
  const { id, approveUrl } = await createOrder({
    amountUSD: pack.priceUSD,
    description: `estaila — ${pack.credits} créditos IA`,
    customId: `${user.id}:${packId}`,
    returnUrl: `${origin}/billing/success?type=pack&id=${packId}`,
    cancelUrl: `${origin}/billing/cancel`,
  });

  await prisma.billingEvent.create({
    data: {
      userId: user.id,
      type: "PACK_PENDING",
      amount: pack.priceUSD,
      reference: id,
      credits: pack.credits,
      metadata: JSON.stringify({ packId, credits: pack.credits }),
    },
  });
  return { approveUrl };
}

/**
 * Server action wrappers that redirect to PayPal.
 * Wired directly to <form action={...}> in client.
 */
export async function startSubscriptionAction(formData: FormData): Promise<never> {
  const plan = (formData.get("plan") as PlanKey | null) ?? "PRO";
  const { approveUrl } = await startSubscription(plan);
  redirect(approveUrl);
}

export async function buyCreditPackAction(formData: FormData): Promise<never> {
  const packId = String(formData.get("packId") ?? "PACK_20");
  const { approveUrl } = await buyCreditPack(packId);
  redirect(approveUrl);
}

export async function cancelSubscriptionAction(): Promise<void> {
  await cancelMySubscription();
}

/**
 * Apply a plan upgrade (called from webhook on subscription activation).
 * Idempotent — safe to call multiple times.
 */
export async function applyPlanActivation(args: {
  userId: string;
  plan: PlanKey;
  paypalSubId: string;
}): Promise<void> {
  const credits = PLAN_CREDITS[args.plan];
  await prisma.$transaction([
    prisma.user.update({
      where: { id: args.userId },
      data: {
        plan: args.plan,
        paypalSubId: args.paypalSubId,
        planActive: true,
        // grant credits for the month
        credits: { increment: credits },
      },
    }),
    prisma.billingEvent.upsert({
      where: { id: `${args.paypalSubId}-activated` },
      update: {},
      create: {
        id: `${args.paypalSubId}-activated`,
        userId: args.userId,
        type: "SUB_ACTIVATED",
        amount: PLAN_PRICE[args.plan],
        reference: args.paypalSubId,
        credits,
        metadata: JSON.stringify({ plan: args.plan }),
      },
    }),
  ]);
}

export async function applyCreditPack(args: {
  userId: string;
  packId: string;
  credits: number;
  amount: number;
  orderId: string;
}): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: args.userId },
      data: { credits: { increment: args.credits } },
    }),
    prisma.billingEvent.upsert({
      where: { id: `${args.orderId}-pack` },
      update: {},
      create: {
        id: `${args.orderId}-pack`,
        userId: args.userId,
        type: "PACK_PURCHASED",
        amount: args.amount,
        reference: args.orderId,
        credits: args.credits,
        metadata: JSON.stringify({ packId: args.packId }),
      },
    }),
  ]);
}

export async function getMyBilling() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
      credits: true,
      paypalSubId: true,
      planActive: true,
      planRenewsAt: true,
    },
  });
  const events = await prisma.billingEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  return { user: dbUser, events };
}
