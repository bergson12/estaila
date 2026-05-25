import "server-only";

/**
 * PayPal REST API client.
 * Docs: https://developer.paypal.com/docs/api/overview/
 *
 * Two products live here:
 *   1. Subscriptions (recurring) → Pro / Team plans
 *   2. Orders (one-time)         → Credit packs
 */

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

function baseUrl(): string {
  const env = (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase();
  return env === "live" ? LIVE_BASE : SANDBOX_BASE;
}

export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/**
 * PayPal can run subscriptions only when at least one Plan ID is wired.
 * Used by /pricing to decide whether to render the "Pagar con PayPal" CTA
 * for recurring tiers (vs one-time packs which don't need plan IDs).
 */
export function isPayPalSubsReady(): boolean {
  if (!isPayPalConfigured()) return false;
  return !!(
    process.env.PAYPAL_PLAN_PRO ||
    process.env.PAYPAL_PLAN_TEAM ||
    process.env.PAYPAL_PLAN_AGENCY
  );
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new Error(
      "PayPal no configurado. Define PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en .env"
    );
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const id = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal auth ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function ppFetch<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const token = await getAccessToken();
  const { json, headers, ...rest } = init;
  const res = await fetch(`${baseUrl()}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text();
    }
    throw new Error(`PayPal ${path} ${res.status}: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// ---- Subscriptions ----------------------------------------------------------

export async function createSubscription(args: {
  planId: string;
  userId: string;
  userEmail: string;
  userName: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const body = {
    plan_id: args.planId,
    custom_id: args.userId,
    subscriber: {
      name: { given_name: args.userName.split(" ")[0] ?? args.userName, surname: args.userName.split(" ").slice(1).join(" ") || "—" },
      email_address: args.userEmail,
    },
    application_context: {
      brand_name: "estaila",
      locale: "es-ES",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      payment_method: { payer_selected: "PAYPAL", payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED" },
      return_url: args.returnUrl,
      cancel_url: args.cancelUrl,
    },
  };
  type SubResp = { id: string; links: { href: string; rel: string }[] };
  const data = await ppFetch<SubResp>("/v1/billing/subscriptions", {
    method: "POST",
    json: body,
  });
  const approve = data.links.find((l) => l.rel === "approve");
  if (!approve) throw new Error("PayPal: no approve link en respuesta");
  return { id: data.id, approveUrl: approve.href };
}

export async function cancelSubscription(subId: string, reason = "User requested cancellation"): Promise<void> {
  await ppFetch(`/v1/billing/subscriptions/${subId}/cancel`, {
    method: "POST",
    json: { reason },
  });
}

// ---- One-time orders (credit packs) -----------------------------------------

export async function createOrder(args: {
  amountUSD: number;
  description: string;
  customId: string; // userId:packId
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: { currency_code: "USD", value: args.amountUSD.toFixed(2) },
        description: args.description,
        custom_id: args.customId,
      },
    ],
    application_context: {
      brand_name: "estaila",
      locale: "es-ES",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      return_url: args.returnUrl,
      cancel_url: args.cancelUrl,
    },
  };
  type OrderResp = { id: string; links: { href: string; rel: string }[] };
  const data = await ppFetch<OrderResp>("/v2/checkout/orders", {
    method: "POST",
    json: body,
  });
  const approve = data.links.find((l) => l.rel === "approve");
  if (!approve) throw new Error("PayPal: no approve link en respuesta");
  return { id: data.id, approveUrl: approve.href };
}

export async function captureOrder(orderId: string): Promise<{
  status: string;
  customId?: string;
  amount?: string;
}> {
  type CaptureResp = {
    status: string;
    purchase_units?: {
      payments?: { captures?: { amount?: { value: string }; custom_id?: string }[] };
      custom_id?: string;
    }[];
  };
  const data = await ppFetch<CaptureResp>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    json: {},
  });
  const cap = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: data.status,
    customId: cap?.custom_id ?? data.purchase_units?.[0]?.custom_id,
    amount: cap?.amount?.value,
  };
}

// ---- Webhook verification ---------------------------------------------------

export async function verifyWebhook(args: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  body: unknown;
}): Promise<boolean> {
  type VerifyResp = { verification_status: string };
  const data = await ppFetch<VerifyResp>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    json: {
      auth_algo: args.authAlgo,
      cert_url: args.certUrl,
      transmission_id: args.transmissionId,
      transmission_sig: args.transmissionSig,
      transmission_time: args.transmissionTime,
      webhook_id: args.webhookId,
      webhook_event: args.body,
    },
  });
  return data.verification_status === "SUCCESS";
}
