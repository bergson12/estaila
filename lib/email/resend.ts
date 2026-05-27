import "server-only";

/**
 * Resend client + send helper.
 *
 * Single backend: Resend (https://resend.com). Free tier: 3K emails/mes.
 * Domain verification required for production — without it, you can only
 * send to addresses you own (testing).
 *
 * Env:
 *   RESEND_API_KEY       — re_xxx
 *   EMAIL_FROM_DOMAIN    — verified domain (defaults to estaila.com)
 *   EMAIL_FROM_NAME      — friendly sender name (defaults to "Estaila")
 */

import { Resend } from "resend";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY no configurado. Define en .env o Vercel env vars."
    );
  }
  return new Resend(key);
}

const DEFAULT_DOMAIN = "estaila.com";
const DEFAULT_NAME = "Estaila";

/**
 * Compose the From header for an agent.
 * Falls back to a neutral estaila address if domain not configured.
 *
 * Examples:
 *   agentSender({ name: "María López", email: "maria@gmail.com" })
 *   → "María López vía Estaila <maria.lopez@estaila.com>"
 */
export function agentSender(args: {
  name: string;
  email: string | null;
  customDomain?: string | null;
}): string {
  const domain =
    args.customDomain ?? process.env.EMAIL_FROM_DOMAIN ?? DEFAULT_DOMAIN;
  const slug = args.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s.-]/g, "")
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".")
    .slice(0, 32);
  const display = args.customDomain
    ? args.name
    : `${args.name} vía ${DEFAULT_NAME}`;
  const from = args.customDomain
    ? `${slug || "agente"}@${domain}`
    : `${slug || "agente"}@${domain}`;
  return `${display} <${from}>`;
}

type SendArgs = {
  /** Recipient email(s) */
  to: string | string[];
  /** Reply-To, typically the agent's real inbox */
  replyTo?: string;
  /** Subject */
  subject: string;
  /** HTML body (preferred) */
  html?: string;
  /** Plain text fallback */
  text?: string;
  /** Override sender; defaults to "Estaila <noreply@estaila.com>" */
  from?: string;
  /** Tags for analytics (Resend dashboard) */
  tags?: { name: string; value: string }[];
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Send a transactional email. Returns a tagged union so callers can show
 * the real error message (Next 16 would otherwise redact server-action throws).
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  try {
    if (!isResendConfigured()) {
      return { ok: false, error: "RESEND_API_KEY no configurado" };
    }
    const client = getClient();
    const from =
      args.from ??
      `${process.env.EMAIL_FROM_NAME ?? DEFAULT_NAME} <noreply@${
        process.env.EMAIL_FROM_DOMAIN ?? DEFAULT_DOMAIN
      }>`;

    // Resend's typed API expects exactly one of html / text / react.
    // We always provide at least html, optionally text as fallback.
    const payload: Record<string, unknown> = {
      from,
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
    };
    if (args.replyTo) payload.replyTo = args.replyTo;
    if (args.tags) payload.tags = args.tags;
    if (args.html) payload.html = args.html;
    if (args.text) payload.text = args.text;
    if (!args.html && !args.text) {
      return { ok: false, error: "Email requiere html o text" };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await client.emails.send(payload as any);

    if (result.error) {
      return { ok: false, error: result.error.message ?? "Error Resend" };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
