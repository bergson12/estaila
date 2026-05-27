import "server-only";

/**
 * Minimal email sender — uses Resend's REST API directly (no SDK).
 *
 * Env:
 *   RESEND_API_KEY  — required to actually send
 *   EMAIL_FROM      — default sender, e.g. "estaila <no-reply@estaila.com>"
 *
 * If RESEND_API_KEY is missing we log the email to console instead. That keeps
 * local dev (and previews without a key) from crashing while still surfacing
 * what would have been sent.
 */

type SendArgs = {
  to: string;
  subject: string;
  /** HTML body. Plain text fallback is auto-derived if `text` not given. */
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

const DEFAULT_FROM = "estaila <no-reply@estaila.com>";

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = args.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!key) {
    console.warn(
      `[email] RESEND_API_KEY missing — would have sent:\n  to=${args.to}\n  subject=${args.subject}\n  preview=${args.html.slice(0, 120)}`
    );
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const body: Record<string, unknown> = {
    from,
    to: [args.to],
    subject: args.subject,
    html: args.html,
  };
  if (args.text) body.text = args.text;
  if (args.replyTo) body.reply_to = args.replyTo;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[email] Resend ${res.status}: ${detail.slice(0, 300)}`);
    return { ok: false, error: `Resend ${res.status}` };
  }

  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}

// ---------- Templates ----------

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://estaila.com";

export function buildVerificationEmail(verifyUrl: string, userName?: string): {
  subject: string;
  html: string;
} {
  const name = userName?.split(" ")[0] ?? "";
  return {
    subject: "Verifica tu cuenta en estaila",
    html: `
<!doctype html>
<html><body style="margin:0;background:#f6f7f9;font-family:'Raleway',Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:14px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${APP_URL}/logos/web-black-estaila.png" alt="estaila" style="height:32px;" />
    </div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.01em;">
      ${name ? `Hola ${name},` : "Confirma tu email"}
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#4a4a4a;margin:0 0 24px;">
      Gracias por unirte a estaila. Click el botón de abajo para verificar tu cuenta y empezar a usar el CRM + Studio IA.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}"
        style="display:inline-block;background:#00bf63;color:#fff;text-decoration:none;
        padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:0.01em;">
        Verificar mi cuenta
      </a>
    </div>
    <p style="font-size:13px;color:#7a7a7a;margin:24px 0 0;line-height:1.55;">
      O copia y pega este enlace:<br />
      <span style="color:#1a1a1a;word-break:break-all;">${verifyUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #ececec;margin:32px 0 16px;" />
    <p style="font-size:12px;color:#a0a0a0;margin:0;">
      Si no creaste esta cuenta, puedes ignorar este correo.
    </p>
    <p style="font-size:12px;color:#a0a0a0;margin:8px 0 0;">
      © ${new Date().getFullYear()} estaila · CRM + AI Studio
    </p>
  </div>
</body></html>`,
  };
}

export function buildResetPasswordEmail(resetUrl: string, userName?: string): {
  subject: string;
  html: string;
} {
  const name = userName?.split(" ")[0] ?? "";
  return {
    subject: "Restablece tu contraseña · estaila",
    html: `
<!doctype html>
<html><body style="margin:0;background:#f6f7f9;font-family:'Raleway',Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:14px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${APP_URL}/logos/web-black-estaila.png" alt="estaila" style="height:32px;" />
    </div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.01em;">
      ${name ? `Hola ${name},` : "Restablecer contraseña"}
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#4a4a4a;margin:0 0 24px;">
      Recibimos una solicitud para restablecer tu contraseña. Click el botón para crear una nueva. El enlace expira en <strong>1 hora</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}"
        style="display:inline-block;background:#00bf63;color:#fff;text-decoration:none;
        padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:0.01em;">
        Crear nueva contraseña
      </a>
    </div>
    <p style="font-size:13px;color:#7a7a7a;margin:24px 0 0;line-height:1.55;">
      O copia y pega este enlace:<br />
      <span style="color:#1a1a1a;word-break:break-all;">${resetUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #ececec;margin:32px 0 16px;" />
    <p style="font-size:12px;color:#a0a0a0;margin:0;">
      Si no solicitaste este cambio, ignora este correo — tu contraseña permanece igual.
    </p>
    <p style="font-size:12px;color:#a0a0a0;margin:8px 0 0;">
      © ${new Date().getFullYear()} estaila · CRM + AI Studio
    </p>
  </div>
</body></html>`,
  };
}
