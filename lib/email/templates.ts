import "server-only";

/**
 * Plain-HTML email templates for estaila.
 *
 * Why not React Email? Resend supports it but adds a build-time JSX
 * dependency that bloats the server bundle. For our 5-6 templates,
 * inline HTML strings with a shared shell are simpler + faster.
 *
 * All templates accept structured args; variable substitution is done
 * inline. Currency formatting: `formatPrice(priceUSD)`.
 */

type AgentInfo = {
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  location: string | null;
  image: string | null;
};

type PropertyInfo = {
  id: string;
  slug: string | null;
  title: string;
  priceUSD: number | null;
  operation: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
  location: string | null;
  description: string | null;
  heroPhoto: string | null;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://estaila.com";
const PRIMARY = "#00bf63";
const TEXT = "#0a0a0a";
const MUTED = "#737373";
const BORDER = "#e5e5e5";
const BG = "#fafafa";

function formatPrice(n: number | null): string {
  if (n == null) return "Consultar";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export type EmailVariant = "MINIMAL" | "EDITORIAL";

type ShellArgs = {
  variant?: EmailVariant;
  preview?: string;
  subject?: string;
  body: string;
  agent: AgentInfo;
};

/** Variant dispatcher — picks the chrome around the body content. */
function shell(args: ShellArgs): string {
  return args.variant === "EDITORIAL" ? shellEditorial(args) : shellMinimal(args);
}

/** MINIMAL — clean white card (default). Header logo + footer signature. */
function shellMinimal(args: ShellArgs): string {
  const preview = args.preview ?? "";
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Estaila</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${TEXT};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">${preview}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BG};padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
        <tr>
          <td style="padding:18px 28px 14px;border-bottom:1px solid ${BORDER};">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td>
                  <img src="${APP_URL}/logos/web-black-estaila.png" alt="estaila" height="26" style="height:26px;width:auto;display:block;" />
                </td>
                <td align="right">
                  <span style="font-size:11px;color:${MUTED};">${new Date().toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            ${args.body}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px;background:${BG};border-top:1px solid ${BORDER};">
            ${agentBlock(args.agent)}
          </td>
        </tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;">
        <tr>
          <td align="center" style="padding:18px 24px;font-size:11px;color:${MUTED};line-height:1.6;">
            Enviado vía <a href="${APP_URL}" style="color:${MUTED};text-decoration:underline;">estaila</a> · CRM + AI Studio para agentes inmobiliarios
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** EDITORIAL — premium: brand header band + big subject headline hero. */
function shellEditorial(args: ShellArgs): string {
  const preview = args.preview ?? "";
  const subject = args.subject ?? "";
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Estaila</title>
</head>
<body style="margin:0;padding:0;background:#eef0f1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${TEXT};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">${preview}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#eef0f1;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px -12px rgba(16,24,32,.18);">
        <!-- brand header band -->
        <tr>
          <td style="background:${PRIMARY};padding:20px 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td>
                  <span style="font-size:20px;font-weight:800;letter-spacing:-.02em;color:#fff;">estaila</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:.08em;">${new Date().toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- hero headline -->
        ${
          subject
            ? `<tr><td style="padding:34px 32px 6px;">
                 <div style="width:40px;height:4px;border-radius:3px;background:${PRIMARY};margin-bottom:16px;"></div>
                 <h1 style="margin:0;font-size:28px;line-height:1.18;font-weight:800;letter-spacing:-.02em;color:${TEXT};">${escapeHtml(subject)}</h1>
               </td></tr>`
            : ""
        }
        <tr>
          <td style="padding:18px 32px 28px;">
            ${args.body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 26px;background:${BG};border-top:1px solid ${BORDER};">
            ${agentBlock(args.agent)}
          </td>
        </tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;">
        <tr>
          <td align="center" style="padding:18px 24px;font-size:11px;color:${MUTED};line-height:1.6;">
            Enviado vía <a href="${APP_URL}" style="color:${MUTED};text-decoration:underline;">estaila</a> · CRM + AI Studio para agentes inmobiliarios
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function agentBlock(agent: AgentInfo): string {
  const avatar = agent.image
    ? `<img src="${agent.image}" alt="" width="48" height="48" style="border-radius:24px;display:block;object-fit:cover;" />`
    : `<div style="width:48px;height:48px;border-radius:24px;background:${PRIMARY};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;line-height:48px;text-align:center;">${agent.name.charAt(0).toUpperCase()}</div>`;
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td width="56" valign="top">${avatar}</td>
      <td valign="top" style="padding-left:12px;">
        <div style="font-weight:600;font-size:14px;line-height:1.3;">${escapeHtml(agent.name)}</div>
        ${agent.role ? `<div style="font-size:12px;color:${MUTED};margin-top:1px;">${escapeHtml(agent.role)}</div>` : ""}
        <div style="margin-top:6px;font-size:12px;line-height:1.5;">
          ${agent.email ? `<a href="mailto:${agent.email}" style="color:${TEXT};text-decoration:none;">${agent.email}</a>` : ""}
          ${agent.phone ? `&nbsp;·&nbsp;<a href="tel:${agent.phone}" style="color:${TEXT};text-decoration:none;">${escapeHtml(agent.phone)}</a>` : ""}
        </div>
      </td>
    </tr>
  </table>`;
}

function propertyCard(p: PropertyInfo): string {
  const url = p.slug
    ? `${APP_URL}/propiedad/${p.slug}`
    : `${APP_URL}/propiedades/${p.id}`;
  const hero = p.heroPhoto
    ? `<img src="${p.heroPhoto}" alt="${escapeHtml(p.title)}" width="544" height="320" style="display:block;width:100%;height:auto;object-fit:cover;border-radius:8px;" />`
    : "";
  const specs: string[] = [];
  if (p.bedrooms != null) specs.push(`${p.bedrooms} hab`);
  if (p.bathrooms != null) specs.push(`${p.bathrooms} baños`);
  if (p.metersSquared != null) specs.push(`${p.metersSquared} m²`);
  const specsHtml = specs.length
    ? `<div style="margin-top:6px;font-size:13px;color:${MUTED};">${specs.join(" · ")}</div>`
    : "";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid ${BORDER};border-radius:10px;overflow:hidden;background:#fff;">
    <tr><td>${hero}</td></tr>
    <tr>
      <td style="padding:14px 16px;">
        <div style="font-size:11px;letter-spacing:1px;color:${PRIMARY};font-weight:600;text-transform:uppercase;">${
          p.operation === "EN_VENTA" ? "En venta" : p.operation === "EN_ALQUILER" ? "En alquiler" : ""
        }</div>
        <div style="margin-top:4px;font-size:18px;font-weight:600;line-height:1.3;">${escapeHtml(p.title)}</div>
        ${p.location ? `<div style="margin-top:2px;font-size:13px;color:${MUTED};">${escapeHtml(p.location)}</div>` : ""}
        <div style="margin-top:10px;font-size:22px;font-weight:700;color:${TEXT};">${formatPrice(p.priceUSD)}</div>
        ${specsHtml}
        <div style="margin-top:14px;">
          <a href="${url}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 18px;border-radius:8px;">Ver propiedad →</a>
        </div>
      </td>
    </tr>
  </table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
// TEMPLATES
// ============================================================

import {
  defaultTemplateContent,
  PROPERTY_REQUIRED,
  type TemplateKind,
} from "./template-defaults";

export type { TemplateKind };

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
  preview: string;
};

export function renderTemplate(args: {
  kind: TemplateKind;
  agent: AgentInfo;
  contact: { name: string };
  property?: PropertyInfo;
  customSubject?: string;
  customBody?: string;
  customDateTime?: string;
  variant?: EmailVariant;
  customHtml?: string;
}): RenderedEmail {
  const { kind, agent, contact, property } = args;
  const greeting = `Hola ${escapeHtml(contact.name.split(" ")[0] ?? "")},`;

  if (PROPERTY_REQUIRED.includes(kind) && !property) {
    throw new Error(`property requerida para ${kind}`);
  }

  // Default subject + message for this kind; the caller can override either
  // (customSubject / customBody) — that's how the user edits the template.
  const def = defaultTemplateContent({
    kind,
    property: property ? { title: property.title, location: property.location } : null,
    dateTime: args.customDateTime,
  });
  const subject = args.customSubject?.trim() || def.subject;
  const message = args.customBody?.trim() || def.message;

  // Message prose → paragraphs (blank line splits)
  const msgHtml = message
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${escapeHtml(
          p
        ).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  const customHtml = args.customHtml?.trim();
  const body = customHtml
    ? `${customHtml}${property ? `<div style="margin-top:18px;">${propertyCard(property)}</div>` : ""}`
    : `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
    ${msgHtml}
    ${property ? `<div style="margin-top:8px;">${propertyCard(property)}</div>` : ""}
  `;

  const propLink = property
    ? `\n\nVer: ${APP_URL}/propiedad/${property.slug ?? property.id}`
    : "";

  const plainText = customHtml
    ? customHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : `${contact.name},\n\n${message}${propLink}\n\n— ${agent.name}`;

  return {
    subject,
    preview: subject,
    html: shell({ variant: args.variant, subject, preview: subject, body, agent }),
    text: plainText,
  };
}
