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

/** Shared shell — header logo + footer signature */
function shell(args: {
  preview?: string;
  body: string;
  agent: AgentInfo;
}): string {
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
          <td style="padding:20px 28px 14px;border-bottom:1px solid ${BORDER};">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td>
                  <span style="font-size:11px;letter-spacing:1.5px;font-weight:600;color:${PRIMARY};text-transform:uppercase;">estaila</span>
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

export type TemplateKind =
  | "NEW_LISTING"
  | "PRICE_REDUCTION"
  | "OPEN_HOUSE"
  | "LEAD_REPLY"
  | "APPOINTMENT_CONFIRM"
  | "FOLLOWUP"
  | "CUSTOM";

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
}): RenderedEmail {
  const { kind, agent, contact, property } = args;
  const greeting = `Hola ${escapeHtml(contact.name.split(" ")[0] ?? "")},`;

  switch (kind) {
    case "NEW_LISTING": {
      if (!property) throw new Error("property requerida para NEW_LISTING");
      const preview = `Nueva propiedad: ${property.title} · ${formatPrice(property.priceUSD)}`;
      const body = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
          Tengo una propiedad nueva que coincide con lo que estás buscando. Échale un vistazo cuando puedas:
        </p>
        ${propertyCard(property)}
        ${
          property.description
            ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(property.description.slice(0, 200))}${property.description.length > 200 ? "…" : ""}</p>`
            : ""
        }
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;">
          ¿Te interesa? Coordinemos una visita esta semana. Respondé a este email o escríbeme.
        </p>
      `;
      return {
        subject: `Nueva propiedad en ${property.location ?? "tu zona"}: ${property.title}`,
        preview,
        html: shell({ preview, body, agent }),
        text: `${contact.name},\n\nTengo una propiedad nueva: ${property.title} (${formatPrice(property.priceUSD)}).\nVer: ${APP_URL}/propiedad/${property.slug ?? property.id}\n\n— ${agent.name}`,
      };
    }

    case "PRICE_REDUCTION": {
      if (!property) throw new Error("property requerida");
      const preview = `Bajó el precio: ${property.title}`;
      const body = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
          La propiedad que viste <strong>bajó de precio</strong>. Ahora está a:
        </p>
        ${propertyCard(property)}
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;">
          Si todavía te interesa, este es buen momento para verla. ¿Coordinamos visita?
        </p>
      `;
      return {
        subject: `🔻 Bajó de precio: ${property.title}`,
        preview,
        html: shell({ preview, body, agent }),
        text: `${contact.name}, la propiedad ${property.title} bajó a ${formatPrice(property.priceUSD)}. Ver: ${APP_URL}/propiedad/${property.slug ?? property.id}\n\n— ${agent.name}`,
      };
    }

    case "OPEN_HOUSE": {
      if (!property) throw new Error("property requerida");
      const dt = args.customDateTime ?? "este fin de semana";
      const preview = `Open house ${dt}: ${property.title}`;
      const body = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
          Estás invitado al open house <strong>${escapeHtml(dt)}</strong>. Sin cita previa, solo pasate:
        </p>
        ${propertyCard(property)}
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;">
          Habrá refrescos y podrás ver toda la propiedad con calma. Confirma tu asistencia respondiendo a este email.
        </p>
      `;
      return {
        subject: `Open house ${dt} · ${property.title}`,
        preview,
        html: shell({ preview, body, agent }),
        text: `${contact.name}, open house ${dt}: ${property.title}. ${APP_URL}/propiedad/${property.slug ?? property.id}\n\n— ${agent.name}`,
      };
    }

    case "LEAD_REPLY": {
      const preview = `Sobre tu interés en ${property?.title ?? "la propiedad"}`;
      const body = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
          Gracias por escribirme. Vi tu interés ${property ? `en <strong>${escapeHtml(property.title)}</strong>` : ""} y quiero ayudarte personalmente.
        </p>
        ${property ? propertyCard(property) : ""}
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;">
          ¿Cuál es el mejor horario para llamarte? Respondé a este email o me podés escribir directo al WhatsApp${agent.phone ? ` (${escapeHtml(agent.phone)})` : ""}.
        </p>
      `;
      return {
        subject: property
          ? `Sobre tu interés en ${property.title}`
          : `Hola ${contact.name.split(" ")[0]}, te respondo`,
        preview,
        html: shell({ preview, body, agent }),
        text: `${contact.name}, gracias por escribirme${property ? ` sobre ${property.title}` : ""}. ¿Cuándo te llamo?\n\n— ${agent.name}`,
      };
    }

    case "APPOINTMENT_CONFIRM": {
      const when = args.customDateTime ?? "la fecha confirmada";
      const preview = `Visita confirmada: ${when}`;
      const body = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
          Tu visita está <strong>confirmada para ${escapeHtml(when)}</strong>${property ? ` — ${escapeHtml(property.title)}` : ""}.
        </p>
        ${property ? propertyCard(property) : ""}
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;">
          Te espero en la dirección${property?.location ? ` (${escapeHtml(property.location)})` : ""}. Si necesitas cambiar la hora, avísame con tiempo.
        </p>
      `;
      return {
        subject: `Visita confirmada · ${when}`,
        preview,
        html: shell({ preview, body, agent }),
        text: `${contact.name}, tu visita está confirmada para ${when}. — ${agent.name}`,
      };
    }

    case "FOLLOWUP": {
      const preview = `¿Sigue activa tu búsqueda?`;
      const body = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
          Quería retomar contacto: ¿sigue activa tu búsqueda? Tengo varias opciones nuevas que pueden interesarte.
        </p>
        ${property ? propertyCard(property) : ""}
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;">
          Si las prioridades cambiaron, no hay problema — solo respondé brevemente y ajusto la búsqueda.
        </p>
      `;
      return {
        subject: `¿Sigue activa tu búsqueda, ${contact.name.split(" ")[0]}?`,
        preview,
        html: shell({ preview, body, agent }),
        text: `${contact.name}, ¿sigue activa tu búsqueda? — ${agent.name}`,
      };
    }

    case "CUSTOM":
    default: {
      const subject = args.customSubject ?? "Mensaje de tu agente";
      const bodyText = args.customBody ?? "";
      const html = bodyText
        .split(/\n{2,}/)
        .map(
          (p) =>
            `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
        )
        .join("");
      const body = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
        ${html}
        ${property ? `<div style="margin-top:18px;">${propertyCard(property)}</div>` : ""}
      `;
      return {
        subject,
        preview: subject,
        html: shell({ preview: subject, body, agent }),
        text: `${contact.name},\n\n${bodyText}\n\n— ${agent.name}`,
      };
    }
  }
}
