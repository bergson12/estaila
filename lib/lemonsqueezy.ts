import "server-only";

/**
 * Lemon Squeezy REST API client.
 *
 * Docs: https://docs.lemonsqueezy.com/api
 * Auth: Bearer LEMONSQUEEZY_API_KEY
 * Base: https://api.lemonsqueezy.com/v1
 *
 * Uses native fetch — no external SDK required.
 */

const BASE = "https://api.lemonsqueezy.com/v1";

function apiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY not configured");
  return key;
}

function storeId(): string {
  const id = process.env.LEMONSQUEEZY_STORE_ID;
  if (!id) throw new Error("LEMONSQUEEZY_STORE_ID not configured");
  return id;
}

async function ls<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey()}`,
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    body: init?.json ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LS ${res.status} ${path}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// ============================================================
// CHECKOUT
// ============================================================

export type CreateCheckoutInput = {
  variantId: string;
  /** Pre-fill identification — links order to user in webhook */
  userId: string;
  userEmail: string;
  userName?: string;
  /** Custom metadata stored on the checkout/order/subscription */
  customData?: Record<string, string>;
  /** Discount code (optional) */
  discountCode?: string;
  /** Embed mode (overlay) — default true for SPA */
  embed?: boolean;
  /** Redirect on success URL — full https URL */
  redirectUrl?: string;
};

export type CheckoutResponse = {
  data: {
    id: string;
    attributes: {
      url: string;
      checkout_data: unknown;
      product_options: unknown;
      checkout_options: unknown;
    };
  };
};

/**
 * Create a Lemon Squeezy checkout session for a given variant.
 * Returns hosted URL the client should open.
 */
export async function createCheckout(
  input: CreateCheckoutInput
): Promise<CheckoutResponse> {
  return ls<CheckoutResponse>("/checkouts", {
    method: "POST",
    json: {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.userEmail,
            name: input.userName,
            custom: {
              user_id: input.userId,
              ...(input.customData ?? {}),
            },
            discount_code: input.discountCode,
          },
          product_options: {
            redirect_url:
              input.redirectUrl ??
              `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing/success?provider=ls`,
            receipt_button_text: "Volver al CRM",
            receipt_thank_you_note:
              "Gracias por suscribirte a estaila. Tu plan ya está activo.",
          },
          checkout_options: {
            embed: input.embed ?? false,
            media: false,
            logo: true,
            dark: false,
          },
          expires_at: null,
        },
        relationships: {
          store: { data: { type: "stores", id: storeId() } },
          variant: { data: { type: "variants", id: input.variantId } },
        },
      },
    },
  });
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export type Subscription = {
  id: string;
  attributes: {
    store_id: number;
    customer_id: number;
    order_id: number;
    product_id: number;
    variant_id: number;
    user_email: string;
    user_name: string;
    status: "on_trial" | "active" | "paused" | "past_due" | "unpaid" | "cancelled" | "expired";
    status_formatted: string;
    pause: { mode: "void" | "free" } | null;
    cancelled: boolean;
    trial_ends_at: string | null;
    billing_anchor: number;
    renews_at: string | null;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
    urls: {
      update_payment_method: string;
      customer_portal: string;
    };
  };
};

export async function getSubscription(subId: string): Promise<Subscription> {
  const res = await ls<{ data: Subscription }>(`/subscriptions/${subId}`);
  return res.data;
}

export async function cancelSubscription(subId: string): Promise<void> {
  await ls(`/subscriptions/${subId}`, { method: "DELETE" });
}

export async function resumeSubscription(subId: string): Promise<void> {
  await ls(`/subscriptions/${subId}`, {
    method: "PATCH",
    json: {
      data: { type: "subscriptions", id: subId, attributes: { cancelled: false } },
    },
  });
}

export async function changeSubscriptionVariant(
  subId: string,
  variantId: string
): Promise<void> {
  await ls(`/subscriptions/${subId}`, {
    method: "PATCH",
    json: {
      data: {
        type: "subscriptions",
        id: subId,
        attributes: {
          variant_id: Number(variantId),
          invoice_immediately: true,
        },
      },
    },
  });
}

// ============================================================
// CUSTOMER PORTAL
// ============================================================

/**
 * Returns a one-shot customer portal URL where the user can:
 * update card, cancel, view invoices, change plan, etc.
 */
export async function getCustomerPortalUrl(subId: string): Promise<string> {
  const sub = await getSubscription(subId);
  return sub.attributes.urls.customer_portal;
}

// ============================================================
// WEBHOOK SIGNATURE VERIFY
// ============================================================

/**
 * Verify the X-Signature header from a LS webhook.
 * Algo: HMAC SHA256 of raw body using LEMONSQUEEZY_WEBHOOK_SECRET.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) return false;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET not configured");

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// ============================================================
// VARIANT → PLAN MAPPING (from env)
// ============================================================

import type { PlanKey } from "./billing-config";

/** Map a LS variant ID → CRM plan key. Returns null if unrecognized. */
export function variantToPlan(
  variantId: string | number
): { plan: PlanKey; cycle: "monthly" | "yearly" } | null {
  const id = String(variantId);
  const env = process.env;
  const map: Record<string, { plan: PlanKey; cycle: "monthly" | "yearly" }> = {
    [env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY ?? ""]: { plan: "PRO", cycle: "monthly" },
    [env.LEMONSQUEEZY_VARIANT_PRO_YEARLY ?? ""]: { plan: "PRO", cycle: "yearly" },
    [env.LEMONSQUEEZY_VARIANT_TEAM_MONTHLY ?? ""]: { plan: "TEAM", cycle: "monthly" },
    [env.LEMONSQUEEZY_VARIANT_TEAM_YEARLY ?? ""]: { plan: "TEAM", cycle: "yearly" },
    [env.LEMONSQUEEZY_VARIANT_AGENCY_MONTHLY ?? ""]: { plan: "AGENCY", cycle: "monthly" },
    [env.LEMONSQUEEZY_VARIANT_AGENCY_YEARLY ?? ""]: { plan: "AGENCY", cycle: "yearly" },
  };
  return map[id] ?? null;
}

/** Map credit pack id → variant ID for one-time payments */
export function packToVariant(packId: string): string | null {
  const env = process.env;
  const map: Record<string, string | undefined> = {
    PACK_20: env.LEMONSQUEEZY_VARIANT_PACK_20,
    PACK_50: env.LEMONSQUEEZY_VARIANT_PACK_50,
    PACK_150: env.LEMONSQUEEZY_VARIANT_PACK_150,
  };
  return map[packId] ?? null;
}

export function planToVariant(
  plan: PlanKey,
  cycle: "monthly" | "yearly"
): string | null {
  const env = process.env;
  const key = `LEMONSQUEEZY_VARIANT_${plan}_${cycle.toUpperCase()}` as const;
  return (env as Record<string, string | undefined>)[key] ?? null;
}

/** True when the minimum LS env vars are present (API key + store + secret). */
export function isLemonConfigured(): boolean {
  return !!(
    process.env.LEMONSQUEEZY_API_KEY &&
    process.env.LEMONSQUEEZY_STORE_ID &&
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  );
}
