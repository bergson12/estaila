import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature, variantToPlan } from "@/lib/lemonsqueezy";
import {
  applyLemonCreditsPurchase,
  applyLemonPlanCancelled,
  applyLemonPlanUpgrade,
  applyLemonRenewal,
} from "@/lib/actions/billing-lemon";
import type { CreditPackId } from "@/lib/billing-config";

/**
 * POST /api/lemonsqueezy/webhook
 *
 * LS sends events with header `X-Signature` = HMAC SHA256(body, secret).
 * Events we handle:
 *   subscription_created    — new sub → activate plan
 *   subscription_updated    — plan change → re-sync plan + renews_at
 *   subscription_cancelled  — sub cancelled (still active until ends_at)
 *   subscription_resumed    — undo cancellation
 *   subscription_expired    — sub fully ended → planActive=false
 *   subscription_payment_success — renewal → extend planRenewsAt
 *   subscription_payment_failed — log only (LS retries automatically)
 *   order_created           — one-time payment (credit packs)
 *
 * Idempotency: each webhook has unique `meta.event_name` + `data.id` —
 * we store processed event IDs in BillingEvent.id to skip duplicates.
 */

type LSEventName =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_refunded"
  | "order_created"
  | "order_refunded";

type LSWebhookPayload = {
  meta: {
    event_name: LSEventName;
    custom_data?: {
      user_id?: string;
      plan?: string;
      cycle?: string;
      pack?: string;
      credits?: string;
      source?: string;
    };
  };
  data: {
    type: string;
    id: string;
    attributes: Record<string, unknown>;
  };
};

export async function POST(req: NextRequest) {
  // 1. Verify signature on RAW body
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  const valid = await verifyWebhookSignature(raw, sig).catch(() => false);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse payload
  let payload: LSWebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_name, custom_data } = payload.meta;
  const { id: resourceId, attributes } = payload.data;

  // 3. Idempotency check
  const idemKey = `ls:${event_name}:${resourceId}:${(attributes as Record<string, unknown>).updated_at ?? ""}`;
  const seen = await prisma.billingEvent.findUnique({
    where: { id: idemKey },
    select: { id: true },
  });
  if (seen) return NextResponse.json({ ok: true, skipped: "duplicate" });

  try {
    switch (event_name) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed": {
        const userId = custom_data?.user_id;
        if (!userId) {
          console.warn("[LS webhook] no user_id in custom_data", { event_name, resourceId });
          break;
        }
        const variantId = String(attributes.variant_id ?? "");
        const mapping = variantToPlan(variantId);
        if (!mapping) {
          console.warn("[LS webhook] unknown variant_id", variantId);
          break;
        }
        const customerId = String(attributes.customer_id ?? "");
        const renewsAtRaw = attributes.renews_at as string | null | undefined;
        await applyLemonPlanUpgrade({
          userId,
          plan: mapping.plan,
          lsSubId: resourceId,
          lsCustomerId: customerId,
          lsVariantId: variantId,
          renewsAt: renewsAtRaw ? new Date(renewsAtRaw) : null,
        });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await applyLemonPlanCancelled({ lsSubId: resourceId });
        break;
      }

      case "subscription_payment_success": {
        // For subscription_payment_*, resourceId is the invoice, not the subscription.
        // Look up via subscription_id in attributes:
        const subId = String(attributes.subscription_id ?? "");
        const billingReason = attributes.billing_reason as string | undefined;
        // Only count "renewal" or "initial" — skip refunds etc.
        if (billingReason !== "renewal" && billingReason !== "initial") break;

        // Fetch renews_at from sub directly
        const { getSubscription } = await import("@/lib/lemonsqueezy");
        try {
          const sub = await getSubscription(subId);
          const renewsAt = sub.attributes.renews_at
            ? new Date(sub.attributes.renews_at)
            : null;
          await applyLemonRenewal({ lsSubId: subId, renewsAt });
        } catch (e) {
          console.error("[LS webhook] failed renewal sync", e);
        }
        break;
      }

      case "order_created": {
        // One-time payment (credit pack)
        const userId = custom_data?.user_id;
        const packId = custom_data?.pack as CreditPackId | undefined;
        if (!userId || !packId) break;
        await applyLemonCreditsPurchase({
          userId,
          packId,
          reference: resourceId,
        });
        break;
      }

      case "subscription_payment_failed":
      case "subscription_payment_refunded":
      case "order_refunded": {
        // Log only — LS will retry / customer-facing notifications handled separately.
        console.info("[LS webhook]", event_name, resourceId);
        break;
      }

      default:
        console.info("[LS webhook] unhandled event", event_name);
    }

    // 4. Mark idempotency key as processed
    await prisma.billingEvent
      .create({
        data: {
          id: idemKey,
          userId: custom_data?.user_id ?? "system",
          type: "WEBHOOK_PROCESSED",
          provider: "LEMONSQUEEZY",
          reference: resourceId,
          metadata: JSON.stringify({ event_name }),
        },
      })
      .catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[LS webhook] handler error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "lemonsqueezy webhook",
    configured: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  });
}
