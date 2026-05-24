import { NextResponse } from "next/server";
import { captureOrder, verifyWebhook } from "@/lib/paypal";
import { applyCreditPack, applyPlanActivation } from "@/lib/actions/billing";
import { prisma } from "@/lib/db";
import { CREDIT_PACKS } from "@/lib/billing-config";

/**
 * PayPal webhook receiver.
 *
 * Events of interest:
 *   - BILLING.SUBSCRIPTION.ACTIVATED      → plan activation
 *   - BILLING.SUBSCRIPTION.CANCELLED      → revert to FREE
 *   - BILLING.SUBSCRIPTION.RENEWED        → grant monthly credits
 *   - PAYMENT.SALE.COMPLETED              → renewal billing payment
 *   - CHECKOUT.ORDER.APPROVED             → credit pack purchase (capture + grant)
 *
 * Setup: in PayPal dashboard, point webhook URL to `/api/paypal/webhook`,
 * paste the resulting webhook ID into PAYPAL_WEBHOOK_ID env var.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const body = JSON.parse(rawBody);

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  // Verify signature only when webhook ID is configured (skip in early dev)
  if (webhookId) {
    const verified = await verifyWebhook({
      authAlgo: req.headers.get("paypal-auth-algo") ?? "",
      certUrl: req.headers.get("paypal-cert-url") ?? "",
      transmissionId: req.headers.get("paypal-transmission-id") ?? "",
      transmissionSig: req.headers.get("paypal-transmission-sig") ?? "",
      transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
      webhookId,
      body,
    }).catch(() => false);
    if (!verified) {
      console.error("[paypal-webhook] signature verification failed");
      return NextResponse.json({ error: "bad signature" }, { status: 400 });
    }
  }

  const eventType = body?.event_type as string | undefined;
  const resource = body?.resource ?? {};
  console.log(`[paypal-webhook] ${eventType}`);

  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subId: string = resource.id;
        const userId: string | undefined = resource.custom_id;
        if (!userId) throw new Error("custom_id missing on subscription");
        const planId: string | undefined = resource.plan_id;
        const plan: "PRO" | "TEAM" | "AGENCY" =
          planId === process.env.PAYPAL_PLAN_AGENCY
            ? "AGENCY"
            : planId === process.env.PAYPAL_PLAN_TEAM
              ? "TEAM"
              : "PRO";
        await applyPlanActivation({ userId, plan, paypalSubId: subId });
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subId: string = resource.id;
        const userId: string | undefined = resource.custom_id;
        if (userId) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { planActive: false, plan: "FREE" },
            }),
            prisma.billingEvent.create({
              data: {
                userId,
                type: "SUB_CANCELLED",
                reference: subId,
                metadata: JSON.stringify({ source: eventType }),
              },
            }),
          ]);
        }
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Recurring payment (renewal). Grant monthly credits.
        const subId: string | undefined =
          resource.billing_agreement_id ?? resource.supplementary_data?.related_ids?.subscription_id;
        if (!subId) break;
        const u = await prisma.user.findUnique({
          where: { paypalSubId: subId },
          select: { id: true, plan: true },
        });
        if (!u) break;
        const credits =
          u.plan === "AGENCY" ? 1000 : u.plan === "TEAM" ? 200 : u.plan === "PRO" ? 50 : 0;
        if (credits > 0) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: u.id },
              data: { credits: { increment: credits } },
            }),
            prisma.billingEvent.create({
              data: {
                userId: u.id,
                type: "SUB_RENEWED",
                amount: Number(resource.amount?.total ?? 0),
                reference: subId,
                credits,
                metadata: JSON.stringify({ plan: u.plan }),
              },
            }),
          ]);
        }
        break;
      }

      case "CHECKOUT.ORDER.APPROVED": {
        // One-time credit pack: capture funds + grant credits
        const orderId: string = resource.id;
        const customId: string | undefined =
          resource.purchase_units?.[0]?.custom_id;
        if (!customId || !customId.includes(":")) break;
        const [userId, packId] = customId.split(":");
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (!pack) break;
        const cap = await captureOrder(orderId);
        if (cap.status === "COMPLETED") {
          await applyCreditPack({
            userId,
            packId,
            credits: pack.credits,
            amount: Number(cap.amount ?? pack.priceUSD),
            orderId,
          });
        }
        break;
      }
    }
  } catch (e) {
    console.error("[paypal-webhook] handler error:", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// Webhook is unauthenticated — must be POST only
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "PayPal webhook endpoint — POST only",
  });
}
